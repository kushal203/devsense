import * as vscode from 'vscode';
import { HardwareMetrics } from './hardwareMonitor';

export class StatusBarManager {
  private cpuItem: vscode.StatusBarItem;
  private ramItem: vscode.StatusBarItem;
  private tempItem: vscode.StatusBarItem;
  private liteModeItem: vscode.StatusBarItem;
  private config: vscode.WorkspaceConfiguration;

  constructor(context: vscode.ExtensionContext) {
    this.config = vscode.workspace.getConfiguration('devsense');

    this.cpuItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 110
    );
    this.cpuItem.command = 'devsense.openDashboard';
    this.cpuItem.tooltip = 'DevSense: CPU Usage — Click to open Dashboard';

    this.ramItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 109
    );
    this.ramItem.command = 'devsense.openDashboard';
    this.ramItem.tooltip = 'DevSense: RAM Usage — Click to open Dashboard';

    this.tempItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 108
    );
    this.tempItem.command = 'devsense.openDashboard';
    this.tempItem.tooltip = 'DevSense: CPU Temperature — Click to open Dashboard';

    this.liteModeItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right, 107
    );
    this.liteModeItem.command = 'devsense.toggleLiteMode';
    this.liteModeItem.tooltip = 'DevSense: Lite Mode — Click to toggle';
    this.liteModeItem.text = '';
    this.liteModeItem.hide();

    context.subscriptions.push(
      this.cpuItem, this.ramItem, this.tempItem, this.liteModeItem
    );

    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('devsense.showStatusBar')) {
        this.config = vscode.workspace.getConfiguration('devsense');
        this.applyVisibility();
      }
    });

    this.applyVisibility();
  }

  update(metrics: HardwareMetrics): void {
    if (!this.config.get<boolean>('showStatusBar', true)) { return; }

    const cpuWarn = this.config.get<number>('cpuWarningThreshold', 80);
    const ramWarn = this.config.get<number>('ramWarningThreshold', 85);
    const tempWarn = this.config.get<number>('tempWarningThreshold', 80);

    // CPU
    const cpuIcon = metrics.cpu.usage >= cpuWarn ? '$(warning)' : '$(pulse)';
    const cpuColor = this.getColor(metrics.cpu.usage, cpuWarn, 95);
    this.cpuItem.text = `${cpuIcon} ${metrics.cpu.usage}%`;
    this.cpuItem.color = cpuColor;
    this.cpuItem.backgroundColor = metrics.cpu.usage >= 95
      ? new vscode.ThemeColor('statusBarItem.errorBackground')
      : metrics.cpu.usage >= cpuWarn
        ? new vscode.ThemeColor('statusBarItem.warningBackground')
        : undefined;

    // RAM
    const ramGB = (metrics.ram.used / 1e9).toFixed(1);
    const totalGB = (metrics.ram.total / 1e9).toFixed(1);
    const ramIcon = metrics.ram.usagePercent >= ramWarn ? '$(warning)' : '$(server)';
    this.ramItem.text = `${ramIcon} ${ramGB}/${totalGB}GB`;
    this.ramItem.color = this.getColor(metrics.ram.usagePercent, ramWarn, 95);
    this.ramItem.backgroundColor = metrics.ram.usagePercent >= 95
      ? new vscode.ThemeColor('statusBarItem.errorBackground')
      : metrics.ram.usagePercent >= ramWarn
        ? new vscode.ThemeColor('statusBarItem.warningBackground')
        : undefined;

    // Temperature
    if (metrics.cpu.temp > 0) {
      const tempIcon = metrics.cpu.temp >= tempWarn ? '$(warning)' : '$(flame)';
      this.tempItem.text = `${tempIcon} ${metrics.cpu.temp}°C`;
      this.tempItem.color = this.getColor(metrics.cpu.temp, tempWarn, 90);
      this.tempItem.backgroundColor = metrics.cpu.temp >= 90
        ? new vscode.ThemeColor('statusBarItem.errorBackground')
        : metrics.cpu.temp >= tempWarn
          ? new vscode.ThemeColor('statusBarItem.warningBackground')
          : undefined;
      this.tempItem.show();
    } else {
      this.tempItem.hide();
    }
  }

  showLiteMode(active: boolean): void {
    if (active) {
      this.liteModeItem.text = '$(zap) Lite Mode';
      this.liteModeItem.color = new vscode.ThemeColor('charts.yellow');
      this.liteModeItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
      this.liteModeItem.show();
    } else {
      this.liteModeItem.hide();
    }
  }

  private applyVisibility(): void {
    const show = this.config.get<boolean>('showStatusBar', true);
    if (show) {
      this.cpuItem.show();
      this.ramItem.show();
    } else {
      this.cpuItem.hide();
      this.ramItem.hide();
      this.tempItem.hide();
    }
  }

  private getColor(value: number, warn: number, critical: number): vscode.ThemeColor | undefined {
    if (value >= critical) { return new vscode.ThemeColor('charts.red'); }
    if (value >= warn) { return new vscode.ThemeColor('charts.yellow'); }
    return new vscode.ThemeColor('charts.green');
  }

  dispose(): void {
    this.cpuItem.dispose();
    this.ramItem.dispose();
    this.tempItem.dispose();
    this.liteModeItem.dispose();
  }
}
