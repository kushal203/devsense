/* global vscode Chart */
'use strict';

const vscode = acquireVsCodeApi();

// ── State ──────────────────────────────────────────────────────
const MAX_HISTORY = 60;
const state = {
  cpuHistory: new Array(MAX_HISTORY).fill(0),
  ramHistory: new Array(MAX_HISTORY).fill(0),
  netDownHistory: new Array(MAX_HISTORY).fill(0),
  netUpHistory: new Array(MAX_HISTORY).fill(0),
  diskReadHistory: new Array(MAX_HISTORY).fill(0),
  diskWriteHistory: new Array(MAX_HISTORY).fill(0),
  gpuUsageHistory: new Array(MAX_HISTORY).fill(0),
  gpuVramHistory: new Array(MAX_HISTORY).fill(0),
  labels: new Array(MAX_HISTORY).fill(''),
  lastMetrics: null,
};

// ── Session Peaks ────────────────────────────────────────────────
const peaks = { cpu: 0, ram: 0, temp: -1, gpu: -1 };

function resetPeaks() {
  peaks.cpu = 0; peaks.ram = 0; peaks.temp = -1; peaks.gpu = -1;
  setText('peakCpu', '–'); setText('peakRam', '–');
  setText('peakTemp', '–'); setText('peakGpu', '–');
}

// ── RAM Trend / Memory Leak Detector ────────────────────────────
// Stores last 30 RAM readings to compute trend
const ramTrendWindow = 30;
const ramSamples = [];
let leakWarningActive = false;

function computeRamTrend(currentPct) {
  ramSamples.push(currentPct);
  if (ramSamples.length > ramTrendWindow) ramSamples.shift();
  if (ramSamples.length < 10) return { arrow: '→', delta: 0, isLeaking: false };

  const firstHalf = ramSamples.slice(0, Math.floor(ramSamples.length / 2));
  const secondHalf = ramSamples.slice(Math.floor(ramSamples.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const delta = avgSecond - avgFirst;

  let arrow = '→'; // stable
  if (delta > 1.5)  arrow = '↑↑'; // fast rising
  else if (delta > 0.5) arrow = '↑';  // rising
  else if (delta < -1.5) arrow = '↓↓'; // fast falling
  else if (delta < -0.5) arrow = '↓';  // falling

  // Leak: RAM rising by 5%+ across full window of 30 samples
  const isLeaking = ramSamples.length >= ramTrendWindow &&
    (ramSamples[ramSamples.length - 1] - ramSamples[0]) >= 5;

  return { arrow, delta: Math.round(delta * 10) / 10, isLeaking };
}

// ── CPU Boost Tracker ────────────────────────────────────────
let cpuBaseSpeed = 0; // will be set on first reading

// ── Chart Setup ──────────────────────────────────────────────────
const chartDefaults = {
  responsive: true,
  animation: { duration: 300 },
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: {
    x: {
      display: false,
      grid: { display: false }
    },
    y: {
      min: 0,
      max: 100,
      display: true,
      grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
      ticks: {
        color: '#4a5068',
        font: { size: 9 },
        callback: (v) => `${v}%`,
        maxTicksLimit: 4
      }
    }
  },
  elements: { point: { radius: 0 }, line: { tension: 0.4, borderWidth: 2 } }
};

let cpuChart, ramChart, netChart, diskChart, gpuChart;

function initCharts() {
  const cpuCtx = document.getElementById('cpuChart').getContext('2d');
  cpuChart = new Chart(cpuCtx, {
    type: 'line',
    data: {
      labels: [...state.labels],
      datasets: [{
        data: [...state.cpuHistory],
        borderColor: '#4f7df4',
        backgroundColor: 'rgba(79,125,244,0.08)',
        fill: true
      }]
    },
    options: structuredClone(chartDefaults)
  });

  const ramCtx = document.getElementById('ramChart').getContext('2d');
  ramChart = new Chart(ramCtx, {
    type: 'line',
    data: {
      labels: [...state.labels],
      datasets: [{
        data: [...state.ramHistory],
        borderColor: '#22d3a4',
        backgroundColor: 'rgba(34,211,164,0.08)',
        fill: true
      }]
    },
    options: structuredClone(chartDefaults)
  });

  const netCtx = document.getElementById('netChart').getContext('2d');
  const netOptions = structuredClone(chartDefaults);
  delete netOptions.scales.y.max;
  netOptions.scales.y.ticks.callback = (v) => formatSpeed(v);

  netChart = new Chart(netCtx, {
    type: 'line',
    data: {
      labels: [...state.labels],
      datasets: [
        {
          label: 'Download',
          data: [...state.netDownHistory],
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6,182,212,0.06)',
          fill: true
        },
        {
          label: 'Upload',
          data: [...state.netUpHistory],
          borderColor: '#a855f7',
          backgroundColor: 'rgba(168,85,247,0.06)',
          fill: true
        }
      ]
    },
    options: netOptions
  });

  const diskCtx = document.getElementById('diskChart').getContext('2d');
  const diskOptions = structuredClone(chartDefaults);
  delete diskOptions.scales.y.max;
  diskOptions.scales.y.ticks.callback = (v) => formatOps(v);

  diskChart = new Chart(diskCtx, {
    type: 'line',
    data: {
      labels: [...state.labels],
      datasets: [
        {
          label: 'Read',
          data: [...state.diskReadHistory],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.06)',
          fill: true
        },
        {
          label: 'Write',
          data: [...state.diskWriteHistory],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.06)',
          fill: true
        }
      ]
    },
    options: diskOptions
  });

  const gpuCtx = document.getElementById('gpuChart').getContext('2d');
  gpuChart = new Chart(gpuCtx, {
    type: 'line',
    data: {
      labels: [...state.labels],
      datasets: [
        {
          label: 'Core Usage',
          data: [...state.gpuUsageHistory],
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139,92,246,0.06)',
          fill: true
        },
        {
          label: 'VRAM Usage',
          data: [...state.gpuVramHistory],
          borderColor: '#ec4899',
          backgroundColor: 'rgba(236,72,153,0.06)',
          fill: true
        }
      ]
    },
    options: structuredClone(chartDefaults)
  });
}

// ── Tab Navigation ─────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const tabId = tab.dataset.tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`content-${tabId}`).classList.add('active');

    if (tabId === 'processes') {
      vscode.postMessage({ type: 'getProcesses' });
    } else if (tabId === 'history') {
      vscode.postMessage({ type: 'getGitSpikes' });
    }
  });
});

// ── Button Handlers ────────────────────────────────────────────
document.getElementById('settingsBtn').addEventListener('click', () => {
  vscode.postMessage({ type: 'openSettings' });
});

document.getElementById('liteModeBtn').addEventListener('click', () => {
  vscode.postMessage({ type: 'toggleLiteMode' });
});

document.getElementById('disableLiteBannerBtn').addEventListener('click', () => {
  vscode.postMessage({ type: 'toggleLiteMode' });
});

document.getElementById('processBtn').addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById('tab-processes').classList.add('active');
  document.getElementById('content-processes').classList.add('active');
  vscode.postMessage({ type: 'getProcesses' });
});

document.getElementById('refreshProcs').addEventListener('click', () => {
  vscode.postMessage({ type: 'getProcesses' });
});

document.getElementById('refreshSpikes').addEventListener('click', () => {
  vscode.postMessage({ type: 'getGitSpikes' });
});

document.getElementById('clearSpikes').addEventListener('click', () => {
  vscode.postMessage({ type: 'clearSpikes' });
});

document.getElementById('peaksResetBtn').addEventListener('click', resetPeaks);

document.getElementById('leakDismissBtn').addEventListener('click', () => {
  const leakBanner = document.getElementById('leakBanner');
  if (leakBanner) leakBanner.style.display = 'none';
  leakWarningActive = false;
  // Reset samples so it can re-trigger if leak continues
  ramSamples.length = 0;
});

// ── Metrics Update ─────────────────────────────────────────────
function updateMetrics(metrics) {
  state.lastMetrics = metrics;

  const { cpu, ram, gpu, disk, network, battery, timestamp } = metrics;
  const time = new Date(timestamp).toLocaleTimeString();
  setText('lastUpdated', 'Updated: ' + time);

  // Format and set uptime
  const hours = Math.floor(metrics.uptime / 3600);
  const minutes = Math.floor((metrics.uptime % 3600) / 60);
  setText('sysUptime', `Uptime: ${hours}h ${minutes}m`);

  // Update histories
  state.cpuHistory.push(cpu.usage);
  state.cpuHistory.shift();
  state.ramHistory.push(ram.usagePercent);
  state.ramHistory.shift();
  state.netDownHistory.push(network.downloadSpeed);
  state.netDownHistory.shift();
  state.netUpHistory.push(network.uploadSpeed);
  state.netUpHistory.shift();
  state.diskReadHistory.push(disk.readSpeed);
  state.diskReadHistory.shift();
  state.diskWriteHistory.push(disk.writeSpeed);
  state.diskWriteHistory.shift();

  state.gpuUsageHistory.push(gpu.usage >= 0 ? gpu.usage : 0);
  state.gpuUsageHistory.shift();

  let vramPct = 0;
  if (gpu.vram && gpu.vram > 0 && gpu.vramUsed) {
    vramPct = Math.round((gpu.vramUsed / gpu.vram) * 100);
  }
  state.gpuVramHistory.push(vramPct);
  state.gpuVramHistory.shift();

  state.labels.push(time);
  state.labels.shift();

  // CPU Card
  updateCard('cpuCard', 'cpuValue', 'cpuBar', 'cpuMeta',
    cpu.usage, `${cpu.usage}%`,
    cpu.model || 'CPU');
  if (cpu.speed && cpu.speed > 0) {
    setText('cpuSpeed', `⚡ ${cpu.speed.toFixed(2)} GHz`);
  }

  // RAM Card — with trend indicator
  const usedGB = (ram.used / 1e9).toFixed(1);
  const totalGB = (ram.total / 1e9).toFixed(1);
  const freeGB = ((ram.total - ram.used) / 1e9).toFixed(1);
  const trend = computeRamTrend(ram.usagePercent);
  const trendColor = trend.arrow.includes('↑') ? '#f59e0b' : trend.arrow.includes('↓') ? '#22d3a4' : '#7880a0';
  updateCard('ramCard', 'ramValue', 'ramBar', 'ramMeta',
    ram.usagePercent, `${ram.usagePercent}%`,
    `${usedGB}GB / ${totalGB}GB`);
  const ramFreeEl = document.getElementById('ramFree');
  if (ramFreeEl) {
    ramFreeEl.innerHTML = `▼ ${freeGB}GB free &nbsp;<span style="color:${trendColor};font-weight:700">${trend.arrow}</span>`;
  }

  // Memory Leak Banner
  const leakBanner = document.getElementById('leakBanner');
  if (leakBanner) {
    if (trend.isLeaking && !leakWarningActive) {
      leakWarningActive = true;
      leakBanner.style.display = 'flex';
    } else if (!trend.isLeaking && leakWarningActive) {
      leakWarningActive = false;
      leakBanner.style.display = 'none';
    }
  }

  // CPU Boost Badge
  const cpuSpeedEl = document.getElementById('cpuSpeed');
  if (cpu.speed && cpu.speed > 0) {
    if (cpuBaseSpeed === 0) cpuBaseSpeed = cpu.speed; // capture first reading as base
    const isBoosting = cpu.speed > cpuBaseSpeed * 1.05;
    if (cpuSpeedEl) {
      cpuSpeedEl.innerHTML = isBoosting
        ? `⚡ ${cpu.speed.toFixed(2)} GHz <span class="boost-badge">⚡ BOOST</span>`
        : `⚡ ${cpu.speed.toFixed(2)} GHz`;
    }
  }

  // Temp Card
  if (cpu.temp > 0) {
    const tempPct = Math.min(100, (cpu.temp / 100) * 100);
    updateCard('tempCard', 'tempValue', 'tempBar', 'tempMeta',
      tempPct, `${cpu.temp}°C`,
      'CPU Temperature');

    // Color-code the temp value based on severity
    const tempValueEl = document.getElementById('tempValue');
    if (cpu.temp >= 90) {
      tempValueEl.style.color = 'var(--accent-red)';
    } else if (cpu.temp >= 75) {
      tempValueEl.style.color = 'var(--accent-orange)';
    } else if (cpu.temp >= 60) {
      tempValueEl.style.color = 'var(--accent-yellow)';
    } else {
      tempValueEl.style.color = 'var(--accent-green)';
    }
  } else {
    setText('tempValue', 'N/A');
    setText('tempMeta', 'Not available');
  }

  // GPU Card
  if (gpu.usage >= 0) {
    updateCard('gpuCard', 'gpuValue', 'gpuBar', 'gpuMeta',
      gpu.usage, `${gpu.usage}%`,
      gpu.name);
    if (gpu.vram && gpu.vram > 0) {
      const vramGB = (gpu.vram / 1024).toFixed(1);
      const vramUsedGB = gpu.vramUsed ? (gpu.vramUsed / 1024).toFixed(1) : null;
      setText('gpuVram', vramUsedGB ? `🟣 VRAM: ${vramUsedGB}GB / ${vramGB}GB` : `🟣 VRAM: ${vramGB}GB`);
    }
    const gpuContainer = document.getElementById('gpuChartContainer');
    if (gpuContainer) { gpuContainer.style.display = 'block'; }
  } else {
    setText('gpuValue', 'N/A');
    setText('gpuMeta', gpu.name || 'No GPU data');
    const gpuContainer = document.getElementById('gpuChartContainer');
    if (gpuContainer) { gpuContainer.style.display = 'none'; }
  }

  // Network
  setText('netDown', formatSpeed(network.downloadSpeed));
  setText('netUp', formatSpeed(network.uploadSpeed));

  // Disk
  setText('diskRead', `${Math.round(disk.readSpeed)} ops/s`);
  setText('diskWrite', `${Math.round(disk.writeSpeed)} ops/s`);
  setText('diskUsage', `${Math.round(disk.usagePercent)}%`);
  if (disk.free != null && disk.free > 0) {
    const freeGB = (disk.free / 1e9).toFixed(1);
    setText('diskFree', `${freeGB} GB`);
  }

  // Battery
  if (battery.hasBattery) {
    document.getElementById('batteryCardSm').style.display = 'block';
    setText('battPct', `${Math.round(battery.percent)}%`);
    setText('battStatus', battery.isCharging ? '⚡ Charging' : '🔋 Draining');
  }

  // Charts
  if (cpuChart && ramChart && netChart && diskChart && gpuChart) {
    cpuChart.data.labels = [...state.labels];
    cpuChart.data.datasets[0].data = [...state.cpuHistory];
    cpuChart.update('none');

    ramChart.data.labels = [...state.labels];
    ramChart.data.datasets[0].data = [...state.ramHistory];
    ramChart.update('none');

    netChart.data.labels = [...state.labels];
    netChart.data.datasets[0].data = [...state.netDownHistory];
    netChart.data.datasets[1].data = [...state.netUpHistory];
    netChart.update('none');

    diskChart.data.labels = [...state.labels];
    diskChart.data.datasets[0].data = [...state.diskReadHistory];
    diskChart.data.datasets[1].data = [...state.diskWriteHistory];
    diskChart.update('none');

    gpuChart.data.labels = [...state.labels];
    gpuChart.data.datasets[0].data = [...state.gpuUsageHistory];
    gpuChart.data.datasets[1].data = [...state.gpuVramHistory];
    gpuChart.update('none');
  }

  // CPU Cores
  updateCores(cpu.cores);

  // Session Peaks
  updatePeaks(metrics);

  // Health Score
  updateHealthScore(metrics);

  // Alerts
  checkAlerts(metrics);
}

function updatePeaks(metrics) {
  const { cpu, ram, gpu } = metrics;

  if (cpu.usage > peaks.cpu) {
    peaks.cpu = cpu.usage;
    const el = document.getElementById('peakCpu');
    if (el) { el.textContent = `${cpu.usage}%`; el.classList.add('peak-flash'); setTimeout(() => el.classList.remove('peak-flash'), 600); }
  }
  if (ram.usagePercent > peaks.ram) {
    peaks.ram = ram.usagePercent;
    const el = document.getElementById('peakRam');
    if (el) { el.textContent = `${ram.usagePercent}%`; el.classList.add('peak-flash'); setTimeout(() => el.classList.remove('peak-flash'), 600); }
  }
  if (cpu.temp > 0 && cpu.temp > peaks.temp) {
    peaks.temp = cpu.temp;
    const el = document.getElementById('peakTemp');
    if (el) { el.textContent = `${cpu.temp}°C`; el.classList.add('peak-flash'); setTimeout(() => el.classList.remove('peak-flash'), 600); }
  }
  if (gpu.usage >= 0 && gpu.usage > peaks.gpu) {
    peaks.gpu = gpu.usage;
    const el = document.getElementById('peakGpu');
    if (el) { el.textContent = `${gpu.usage}%`; el.classList.add('peak-flash'); setTimeout(() => el.classList.remove('peak-flash'), 600); }
  }
}

function updateHealthScore(metrics) {
  const { cpu, ram, gpu } = metrics;

  // Compute penalty for each factor (0 = perfect, 100 = worst)
  const cpuPenalty = cpu.usage;
  const ramPenalty = ram.usagePercent;

  let tempPenalty = 0;
  if (cpu.temp > 0) {
    // Map 0-100°C to 0-100 penalty
    tempPenalty = Math.min(100, cpu.temp);
  }

  let gpuPenalty = 0;
  let hasGpu = false;
  if (gpu.usage >= 0) {
    hasGpu = true;
    gpuPenalty = gpu.usage;
  }

  // Weighted average penalty
  let totalWeight = 0;
  let totalPenalty = 0;

  totalPenalty += cpuPenalty * 35; totalWeight += 35;
  totalPenalty += ramPenalty * 30; totalWeight += 30;
  if (cpu.temp > 0) { totalPenalty += tempPenalty * 25; totalWeight += 25; }
  if (hasGpu)       { totalPenalty += gpuPenalty * 10; totalWeight += 10; }

  const avgPenalty = totalWeight > 0 ? totalPenalty / totalWeight : 0;
  const score = Math.round(100 - avgPenalty);

  // Color thresholds
  let color, label;
  if (score >= 80)      { color = '#22d3a4'; label = 'Healthy'; }   // green
  else if (score >= 55) { color = '#f59e0b'; label = 'Moderate'; }  // yellow
  else if (score >= 30) { color = '#f97316'; label = 'Stressed'; }  // orange
  else                  { color = '#ef4444'; label = 'Critical'; }   // red

  // Update ring
  const circumference = 201.06;
  const offset = circumference - (score / 100) * circumference;
  const ring = document.getElementById('healthRingFill');
  if (ring) {
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = color;
  }

  setText('healthScoreNum', String(score));
  const titleEl = document.getElementById('healthTitle');
  if (titleEl) {
    titleEl.textContent = `System Health — ${label}`;
    titleEl.style.color = color;
  }

  // Factor dots + values
  function factorColor(penalty) {
    if (penalty < 60) return '#22d3a4';
    if (penalty < 80) return '#f59e0b';
    if (penalty < 90) return '#f97316';
    return '#ef4444';
  }

  const cpuDot = document.getElementById('hfCpuDot');
  if (cpuDot) cpuDot.style.background = factorColor(cpuPenalty);
  setText('hfCpu', `${cpu.usage}%`);

  const ramDot = document.getElementById('hfRamDot');
  if (ramDot) ramDot.style.background = factorColor(ramPenalty);
  setText('hfRam', `${ram.usagePercent}%`);

  const tempDot = document.getElementById('hfTempDot');
  if (tempDot) tempDot.style.background = cpu.temp > 0 ? factorColor(tempPenalty) : '#4a5068';
  setText('hfTemp', cpu.temp > 0 ? `${cpu.temp}°C` : 'N/A');

  const gpuDot = document.getElementById('hfGpuDot');
  if (gpuDot) gpuDot.style.background = hasGpu ? factorColor(gpuPenalty) : '#4a5068';
  setText('hfGpu', hasGpu ? `${gpu.usage}%` : 'N/A');
}

function updateCard(cardId, valueId, barId, metaId, pct, valueText, metaText) {
  setText(valueId, valueText);
  setText(metaId, metaText);

  const bar = document.getElementById(barId);
  if (bar) { bar.style.width = `${Math.min(100, pct)}%`; }

  const card = document.getElementById(cardId);
  if (card) {
    card.classList.remove('warning', 'critical');
    if (pct >= 95) { card.classList.add('critical'); }
    else if (pct >= 80) { card.classList.add('warning'); }
  }
}

function updateCores(cores) {
  if (!cores || cores.length === 0) { return; }
  const grid = document.getElementById('coresGrid');
  grid.innerHTML = '';
  cores.forEach((usage, i) => {
    const el = document.createElement('div');
    el.className = 'core-item';
    const height = Math.max(2, Math.round(usage));
    el.innerHTML = `
      <div class="core-val">${usage}%</div>
      <div class="core-bar-wrap">
        <div class="core-bar" style="height:${height}%"></div>
      </div>
      <div class="core-label">C${i}</div>
    `;
    grid.appendChild(el);
  });
}

function checkAlerts(metrics) {
  const alerts = [];
  if (metrics.cpu.usage >= 80) { alerts.push(`CPU ${metrics.cpu.usage}%`); }
  if (metrics.ram.usagePercent >= 85) { alerts.push(`RAM ${metrics.ram.usagePercent}%`); }
  if (metrics.cpu.temp > 0 && metrics.cpu.temp >= 80) { alerts.push(`Temp ${metrics.cpu.temp}°C`); }

  const banner = document.getElementById('alertBanner');
  const alertText = document.getElementById('alertText');
  if (alerts.length > 0) {
    banner.style.display = 'flex';
    alertText.textContent = `⚠️ High load: ${alerts.join(' | ')}`;
  } else {
    banner.style.display = 'none';
  }
}

// ── Process List ───────────────────────────────────────────────
function updateProcesses(processes) {
  const list = document.getElementById('processList');
  if (!processes || processes.length === 0) {
    setText('procCount', '(0)');
    list.innerHTML = `
      <div class="empty-state" style="padding-top: 15px;">
        <div class="empty-icon">🔍</div>
        <div class="empty-text">No high-CPU processes</div>
        <div class="empty-sub">Your system is running smoothly.</div>
      </div>
    `;
    return;
  }

  setText('procCount', `(${processes.length})`);

  list.innerHTML = processes.map(p => `
    <div class="process-item">
      <div>
        <div class="proc-name" title="${escHtml(p.command || p.name)}">${escHtml(p.name)}</div>
        <div class="proc-pid">PID ${p.pid}</div>
      </div>
      <div class="proc-cpu">${p.cpu.toFixed(1)}%</div>
      <div class="proc-mem">${p.mem}MB</div>
      <button class="proc-kill" data-pid="${p.pid}" data-name="${escHtml(p.name)}">Kill</button>
    </div>
  `).join('');

  list.querySelectorAll('.proc-kill').forEach(btn => {
    btn.addEventListener('click', () => {
      vscode.postMessage({
        type: 'killProcess',
        pid: parseInt(btn.dataset.pid),
        name: btn.dataset.name
      });
    });
  });
}

// ── Git Spikes ─────────────────────────────────────────────────
function updateGitSpikes(spikes) {
  const list = document.getElementById('spikeList');
  if (!spikes || spikes.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-text">No spikes recorded yet.</div>
        <div class="empty-sub">Hardware anomalies will appear here linked to your git commits.</div>
      </div>`;
    return;
  }

  list.innerHTML = spikes.map((spike, idx) => {
    const date = new Date(spike.timestamp).toLocaleString();
    const badges = spike.anomalies.map(a =>
      `<span class="spike-badge ${a.severity}">${a.type.toUpperCase()} ${Math.round(a.value)}${getUnit(a.type)}</span>`
    ).join(' ');

    const commitSection = spike.commitHash ? `
      <div class="spike-commit">
        <span class="spike-hash">${escHtml(spike.commitHash)}</span>
        <span class="spike-msg">${escHtml(spike.commitMessage || '')}</span>
        ${spike.branch ? `<span style="color:#7880a0;font-size:9px">on ${escHtml(spike.branch)}</span>` : ''}
        <button class="copy-hash-btn" data-hash="${escHtml(spike.commitHash)}" title="Copy commit hash" style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:11px;color:var(--text-muted);padding:0 2px;">📋</button>
      </div>` : '<div style="font-size:10px;color:#4a5068;margin-top:4px">No git repository detected</div>';

    return `
      <div class="spike-item">
        <div class="spike-header">
          <div style="display:flex;gap:4px;flex-wrap:wrap">${badges}</div>
          <span class="spike-time">${date}</span>
        </div>
        ${commitSection}
      </div>`;
  }).join('');

  list.querySelectorAll('.copy-hash-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.hash).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✅';
        setTimeout(() => { btn.textContent = orig; }, 1200);
      });
    });
  });
}

// ── Lite Mode Status ───────────────────────────────────────────
function updateLiteMode(active) {
  const banner = document.getElementById('liteBanner');
  const btn = document.getElementById('liteModeBtn');
  banner.style.display = active ? 'flex' : 'none';
  btn.title = active ? 'Disable Lite Mode' : 'Enable Lite Mode';
  btn.querySelector('span').textContent = active ? '🔥' : '🧊';
}

// ── Message Handler ────────────────────────────────────────────
window.addEventListener('message', event => {
  const msg = event.data;
  switch (msg.type) {
    case 'metrics':
      updateMetrics(msg.data);
      break;
    case 'processes':
      updateProcesses(msg.data);
      break;
    case 'gitSpikes':
      updateGitSpikes(msg.data);
      break;
    case 'liteModeStatus':
      updateLiteMode(msg.data.active);
      break;
  }
});

// ── Helpers ────────────────────────────────────────────────────
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) { el.textContent = text; }
}

function formatSpeed(kbps) {
  if (kbps >= 1024) { return `${(kbps / 1024).toFixed(1)} MB/s`; }
  return `${Math.round(kbps)} KB/s`;
}

function formatOps(v) {
  if (v >= 1000) { return `${(v / 1000).toFixed(1)}k ops/s`; }
  return `${Math.round(v)} ops/s`;
}

function getUnit(type) {
  switch (type) {
    case 'cpu': return '%';
    case 'ram': return '%';
    case 'temp': return '°C';
    case 'gpu': return '°C';
    case 'battery': return '%';
    default: return '';
  }
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Wait for Chart.js to load
  const waitForChart = setInterval(() => {
    if (typeof Chart !== 'undefined') {
      clearInterval(waitForChart);
      initCharts();
    }
  }, 100);
});
