import * as si from 'systeminformation';
import * as vscode from 'vscode';
import { EventEmitter } from 'events';

export interface HardwareMetrics {
  timestamp: number;
  cpu: {
    usage: number;          // 0-100
    temp: number;           // °C, -1 if unavailable
    cores: number[];        // per-core usage
    speed: number;          // GHz
    model: string;
  };
  ram: {
    used: number;           // bytes
    total: number;          // bytes
    usagePercent: number;   // 0-100
    available: number;      // bytes
  };
  gpu: {
    name: string;
    usage: number;          // 0-100, -1 if unavailable
    temp: number;           // °C, -1 if unavailable
    memUsed: number;        // MB
    memTotal: number;       // MB
  };
  disk: {
    readSpeed: number;      // MB/s
    writeSpeed: number;     // MB/s
    usagePercent: number;   // 0-100
  };
  network: {
    downloadSpeed: number;  // KB/s
    uploadSpeed: number;    // KB/s
  };
  battery: {
    hasBattery: boolean;
    percent: number;        // 0-100
    isCharging: boolean;
    timeRemaining: number;  // minutes, -1 if unknown
  };
  uptime: number;           // seconds
}

export class HardwareMonitor extends EventEmitter {
  private interval: NodeJS.Timeout | null = null;
  private config: vscode.WorkspaceConfiguration;
  private lastNetStats: si.Systeminformation.NetworkStatsData[] | null = null;
  private lastDiskStats: si.Systeminformation.DisksIoData | null = null;
  private cachedStaticInfo: {
    cpuModel?: string;
    gpuInfo?: si.Systeminformation.GraphicsControllerData[];
  } = {};

  constructor() {
    super();
    this.config = vscode.workspace.getConfiguration('devsense');
  }

  async start(): Promise<void> {
    // Pre-fetch static info
    try {
      const cpuInfo = await si.cpu();
      this.cachedStaticInfo.cpuModel = `${cpuInfo.manufacturer} ${cpuInfo.brand}`;
      const graphics = await si.graphics();
      this.cachedStaticInfo.gpuInfo = graphics.controllers;
    } catch (_) {}

    const pollInterval = Math.max(500, this.config.get<number>('updateInterval', 2000));
    await this.poll();
    this.interval = setInterval(() => this.poll(), pollInterval);

    // Listen for config changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('devsense.updateInterval')) {
        this.restart();
      }
    });
  }

  private async restart(): Promise<void> {
    this.stop();
    await this.start();
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async forceRefresh(): Promise<void> {
    await this.poll();
  }

  onData(callback: (metrics: HardwareMetrics) => void): void {
    this.on('data', callback);
  }

  private async poll(): Promise<void> {
    try {
      const metrics = await this.gatherMetrics();
      this.emit('data', metrics);
    } catch (err) {
      console.error('[DevSense] Hardware poll error:', err);
    }
  }

  private async gatherMetrics(): Promise<HardwareMetrics> {
    const [
      cpuLoad,
      cpuTemp,
      mem,
      netStats,
      diskIO,
      battery
    ] = await Promise.all([
      si.currentLoad().catch(() => null),
      si.cpuTemperature().catch(() => null),
      si.mem().catch(() => null),
      si.networkStats().catch(() => null),
      si.disksIO().catch(() => null),
      si.battery().catch(() => null),
    ]);

    // GPU
    let gpuUsage = -1;
    let gpuTemp = -1;
    let gpuMemUsed = 0;
    let gpuMemTotal = 0;
    let gpuName = 'N/A';
    try {
      const graphics = await si.graphics();
      const controller = graphics.controllers?.[0];
      if (controller) {
        gpuName = controller.name || 'GPU';
        gpuTemp = controller.temperatureGpu ?? -1;
        gpuUsage = controller.utilizationGpu ?? -1;
        gpuMemUsed = (controller.memoryUsed ?? 0);
        gpuMemTotal = (controller.memoryTotal ?? 0);
      }
    } catch (_) {}

    // Network speeds
    let downloadSpeed = 0;
    let uploadSpeed = 0;
    if (netStats && this.lastNetStats) {
      const prevTotal = this.lastNetStats.reduce((s, n) => s + (n.rx_bytes || 0), 0);
      const currTotal = netStats.reduce((s, n) => s + (n.rx_bytes || 0), 0);
      const prevTx = this.lastNetStats.reduce((s, n) => s + (n.tx_bytes || 0), 0);
      const currTx = netStats.reduce((s, n) => s + (n.tx_bytes || 0), 0);
      downloadSpeed = Math.max(0, (currTotal - prevTotal) / 1024);
      uploadSpeed = Math.max(0, (currTx - prevTx) / 1024);
    }
    this.lastNetStats = netStats;

    // Disk speeds
    let readSpeed = 0;
    let writeSpeed = 0;
    if (diskIO && this.lastDiskStats) {
      readSpeed = Math.max(0, ((diskIO.rIO_sec ?? 0)));
      writeSpeed = Math.max(0, ((diskIO.wIO_sec ?? 0)));
    }
    this.lastDiskStats = diskIO;

    // Disk usage
    let diskUsagePercent = 0;
    try {
      const fsData = await si.fsSize();
      const mainFs = fsData.find(f => f.mount === '/' || f.mount === 'C:') || fsData[0];
      if (mainFs) {
        diskUsagePercent = mainFs.use || 0;
      }
    } catch (_) {}

    const cpuCores = cpuLoad?.cpus?.map(c => Math.round(c.load ?? 0)) || [];

    return {
      timestamp: Date.now(),
      cpu: {
        usage: Math.round(cpuLoad?.currentLoad ?? 0),
        temp: cpuTemp?.main ?? cpuTemp?.cores?.[0] ?? -1,
        cores: cpuCores,
        speed: 0,
        model: this.cachedStaticInfo.cpuModel || 'CPU'
      },
      ram: {
        used: mem?.used ?? 0,
        total: mem?.total ?? 1,
        usagePercent: Math.round(((mem?.used ?? 0) / (mem?.total ?? 1)) * 100),
        available: mem?.available ?? 0
      },
      gpu: {
        name: gpuName,
        usage: gpuUsage,
        temp: gpuTemp,
        memUsed: gpuMemUsed,
        memTotal: gpuMemTotal
      },
      disk: {
        readSpeed: readSpeed,
        writeSpeed: writeSpeed,
        usagePercent: diskUsagePercent
      },
      network: {
        downloadSpeed: downloadSpeed,
        uploadSpeed: uploadSpeed
      },
      battery: {
        hasBattery: battery?.hasBattery ?? false,
        percent: battery?.percent ?? 100,
        isCharging: battery?.isCharging ?? true,
        timeRemaining: battery?.timeRemaining ?? -1
      },
      uptime: (await si.time()).uptime || 0
    };
  }
}
