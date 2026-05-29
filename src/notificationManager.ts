import * as vscode from 'vscode';
import { Anomaly } from './anomalyDetector';
import { HardwareMetrics } from './hardwareMonitor';

export class NotificationManager {
  private config: vscode.WorkspaceConfiguration;

  constructor(_context: vscode.ExtensionContext) {
    this.config = vscode.workspace.getConfiguration('devsense');
    vscode.workspace.onDidChangeConfiguration(() => {
      this.config = vscode.workspace.getConfiguration('devsense');
    });
  }

  handleAnomalies(anomalies: Anomaly[], _metrics: HardwareMetrics): void {
    if (!this.config.get<boolean>('enableNotifications', true)) { return; }

    for (const anomaly of anomalies) {
      this.showAnomalyNotification(anomaly);
    }
  }

  private showAnomalyNotification(anomaly: Anomaly): void {
    const icon = this.getSeverityIcon(anomaly.severity);
    const title = `${icon} DevSense: ${anomaly.message}`;

    const actions = ['Open Dashboard', 'Process Manager', 'Dismiss'];

    if (anomaly.severity === 'critical') {
      vscode.window.showErrorMessage(title, ...actions).then(action => {
        this.handleAction(action);
      });
    } else {
      vscode.window.showWarningMessage(title, ...actions).then(action => {
        this.handleAction(action);
      });
    }

    // Also log the suggestion
    console.log(`[DevSense] ${anomaly.message}: ${anomaly.suggestion}`);
  }

  private handleAction(action: string | undefined): void {
    if (action === 'Open Dashboard') {
      vscode.commands.executeCommand('devsense.openDashboard');
    } else if (action === 'Process Manager') {
      vscode.commands.executeCommand('devsense.openProcessManager');
    }
  }

  private getSeverityIcon(severity: 'warning' | 'critical'): string {
    return severity === 'critical' ? '🔴' : '🟡';
  }

  showInfo(message: string): void {
    vscode.window.showInformationMessage(`⚡ DevSense: ${message}`);
  }
}
