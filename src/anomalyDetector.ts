import * as vscode from 'vscode';
import { HardwareMetrics } from './hardwareMonitor';

export interface Anomaly {
  type: 'cpu' | 'ram' | 'temp' | 'gpu' | 'battery' | 'disk';
  severity: 'warning' | 'critical';
  value: number;
  threshold: number;
  message: string;
  suggestion: string;
}

export class AnomalyDetector {
  private config: vscode.WorkspaceConfiguration;
  private lastNotified: Map<string, number> = new Map();
  private readonly COOLDOWN_MS = 30000; // 30s between same anomaly notifications

  constructor() {
    this.config = vscode.workspace.getConfiguration('devsense');
    vscode.workspace.onDidChangeConfiguration(() => {
      this.config = vscode.workspace.getConfiguration('devsense');
    });
  }

  analyze(metrics: HardwareMetrics): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const cpuWarn = this.config.get<number>('cpuWarningThreshold', 80);
    const ramWarn = this.config.get<number>('ramWarningThreshold', 85);
    const tempWarn = this.config.get<number>('tempWarningThreshold', 80);

    // CPU check
    if (metrics.cpu.usage >= cpuWarn && this.canNotify('cpu')) {
      anomalies.push({
        type: 'cpu',
        severity: metrics.cpu.usage >= 95 ? 'critical' : 'warning',
        value: metrics.cpu.usage,
        threshold: cpuWarn,
        message: `CPU is at ${metrics.cpu.usage}%`,
        suggestion: this.getCpuSuggestion(metrics.cpu.usage)
      });
      this.markNotified('cpu');
    }

    // RAM check
    if (metrics.ram.usagePercent >= ramWarn && this.canNotify('ram')) {
      const availableGB = (metrics.ram.available / 1e9).toFixed(1);
      anomalies.push({
        type: 'ram',
        severity: metrics.ram.usagePercent >= 95 ? 'critical' : 'warning',
        value: metrics.ram.usagePercent,
        threshold: ramWarn,
        message: `RAM is at ${metrics.ram.usagePercent}% (${availableGB}GB free)`,
        suggestion: this.getRamSuggestion(metrics.ram.usagePercent)
      });
      this.markNotified('ram');
    }

    // Temperature check
    if (metrics.cpu.temp > 0 && metrics.cpu.temp >= tempWarn && this.canNotify('temp')) {
      anomalies.push({
        type: 'temp',
        severity: metrics.cpu.temp >= 90 ? 'critical' : 'warning',
        value: metrics.cpu.temp,
        threshold: tempWarn,
        message: `CPU temperature is ${metrics.cpu.temp}°C`,
        suggestion: this.getTempSuggestion(metrics.cpu.temp)
      });
      this.markNotified('temp');
    }

    // GPU check
    if (metrics.gpu.temp > 0 && metrics.gpu.temp >= 85 && this.canNotify('gpu')) {
      anomalies.push({
        type: 'gpu',
        severity: metrics.gpu.temp >= 95 ? 'critical' : 'warning',
        value: metrics.gpu.temp,
        threshold: 85,
        message: `GPU temperature is ${metrics.gpu.temp}°C`,
        suggestion: 'Close GPU-intensive applications or check GPU cooling.'
      });
      this.markNotified('gpu');
    }

    // Battery check
    if (metrics.battery.hasBattery && !metrics.battery.isCharging && metrics.battery.percent <= 15 && this.canNotify('battery')) {
      anomalies.push({
        type: 'battery',
        severity: metrics.battery.percent <= 5 ? 'critical' : 'warning',
        value: metrics.battery.percent,
        threshold: 15,
        message: `Battery is at ${metrics.battery.percent}%`,
        suggestion: 'Plug in your charger. DevSense will enable Lite Mode to conserve power.'
      });
      this.markNotified('battery');
    }

    return anomalies;
  }

  isSystemUnderStress(metrics: HardwareMetrics): boolean {
    const cpuWarn = this.config.get<number>('cpuWarningThreshold', 80);
    const ramWarn = this.config.get<number>('ramWarningThreshold', 85);
    const tempWarn = this.config.get<number>('tempWarningThreshold', 80);

    return (
      metrics.cpu.usage >= cpuWarn ||
      metrics.ram.usagePercent >= ramWarn ||
      (metrics.cpu.temp > 0 && metrics.cpu.temp >= tempWarn) ||
      (metrics.battery.hasBattery && !metrics.battery.isCharging && metrics.battery.percent <= 15)
    );
  }

  private canNotify(key: string): boolean {
    const last = this.lastNotified.get(key) || 0;
    return Date.now() - last > this.COOLDOWN_MS;
  }

  private markNotified(key: string): void {
    this.lastNotified.set(key, Date.now());
  }

  private getCpuSuggestion(usage: number): string {
    if (usage >= 95) {
      return 'Your CPU is critically overloaded. Consider closing background apps or canceling heavy builds.';
    }
    return 'Open the Process Manager to identify which processes are consuming CPU. DevSense will activate Lite Mode.';
  }

  private getRamSuggestion(usage: number): string {
    if (usage >= 95) {
      return 'Critical RAM pressure! Close browser tabs, restart language servers, or add more RAM.';
    }
    return 'Close unused browser tabs and applications. Consider increasing swap/virtual memory.';
  }

  private getTempSuggestion(temp: number): string {
    if (temp >= 90) {
      return 'Critical temperature! Ensure your cooling system is working. Reduce CPU load immediately.';
    }
    return 'Check that your laptop vents are clear. Consider a cooling pad. DevSense is limiting background tasks.';
  }
}
