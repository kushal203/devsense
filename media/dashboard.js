/* global vscode Chart */
'use strict';

const vscode = acquireVsCodeApi();

// ── State ──────────────────────────────────────────────────────
const MAX_HISTORY = 60;
const state = {
  cpuHistory: new Array(MAX_HISTORY).fill(0),
  ramHistory: new Array(MAX_HISTORY).fill(0),
  labels: new Array(MAX_HISTORY).fill(''),
  lastMetrics: null,
};

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

let cpuChart, ramChart;

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
  state.labels.push(time);
  state.labels.shift();

  // CPU Card
  updateCard('cpuCard', 'cpuValue', 'cpuBar', 'cpuMeta',
    cpu.usage, `${cpu.usage}%`,
    cpu.model || 'CPU');

  // RAM Card
  const usedGB = (ram.used / 1e9).toFixed(1);
  const totalGB = (ram.total / 1e9).toFixed(1);
  updateCard('ramCard', 'ramValue', 'ramBar', 'ramMeta',
    ram.usagePercent, `${ram.usagePercent}%`,
    `${usedGB}GB / ${totalGB}GB`);

  // Temp Card
  if (cpu.temp > 0) {
    const tempPct = Math.min(100, (cpu.temp / 100) * 100);
    updateCard('tempCard', 'tempValue', 'tempBar', 'tempMeta',
      tempPct, `${cpu.temp}°C`,
      'CPU Temperature');
  } else {
    setText('tempValue', 'N/A');
    setText('tempMeta', 'Not available');
  }

  // GPU Card
  if (gpu.usage >= 0) {
    updateCard('gpuCard', 'gpuValue', 'gpuBar', 'gpuMeta',
      gpu.usage, `${gpu.usage}%`,
      gpu.name);
  } else {
    setText('gpuValue', 'N/A');
    setText('gpuMeta', gpu.name || 'No GPU data');
  }

  // Network
  setText('netDown', formatSpeed(network.downloadSpeed));
  setText('netUp', formatSpeed(network.uploadSpeed));

  // Disk
  setText('diskRead', `${Math.round(disk.readSpeed)} ops/s`);
  setText('diskWrite', `${Math.round(disk.writeSpeed)} ops/s`);
  setText('diskUsage', `${Math.round(disk.usagePercent)}%`);

  // Battery
  if (battery.hasBattery) {
    document.getElementById('batteryCardSm').style.display = 'block';
    setText('battPct', `${Math.round(battery.percent)}%`);
    setText('battStatus', battery.isCharging ? '⚡ Charging' : '🔋 Draining');
  }

  // Charts
  if (cpuChart && ramChart) {
    cpuChart.data.labels = [...state.labels];
    cpuChart.data.datasets[0].data = [...state.cpuHistory];
    cpuChart.update('none');

    ramChart.data.labels = [...state.labels];
    ramChart.data.datasets[0].data = [...state.ramHistory];
    ramChart.update('none');
  }

  // CPU Cores
  updateCores(cpu.cores);

  // Alerts
  checkAlerts(metrics);
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
    list.innerHTML = '<div class="loading">No processes found.</div>';
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

  list.innerHTML = spikes.map(spike => {
    const date = new Date(spike.timestamp).toLocaleString();
    const badges = spike.anomalies.map(a =>
      `<span class="spike-badge ${a.severity}">${a.type.toUpperCase()} ${Math.round(a.value)}${getUnit(a.type)}</span>`
    ).join(' ');

    const commitSection = spike.commitHash ? `
      <div class="spike-commit">
        <span class="spike-hash">${escHtml(spike.commitHash)}</span>
        <span class="spike-msg">${escHtml(spike.commitMessage || '')}</span>
        ${spike.branch ? `<span style="color:#7880a0;font-size:9px">on ${escHtml(spike.branch)}</span>` : ''}
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
}

// ── Lite Mode Status ───────────────────────────────────────────
function updateLiteMode(active) {
  const banner = document.getElementById('liteBanner');
  const btn = document.getElementById('liteModeBtn');
  banner.style.display = active ? 'block' : 'none';
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
