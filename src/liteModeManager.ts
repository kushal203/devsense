import * as vscode from 'vscode';
import { HardwareMetrics } from './hardwareMonitor';
import { AnomalyDetector } from './anomalyDetector';

// Extensions that are heavy and should be disabled in lite mode
const LITE_MODE_DISABLE_TARGETS = [
  'ms-python.python',
  'ms-vscode.cpptools',
  'golang.go',
  'ms-dotnettools.csharp',
  'dbaeumer.vscode-eslint',
  'esbenp.prettier-vscode',
  'streetsidesoftware.code-spell-checker',
  'ms-vscode.vscode-typescript-next',
  'VisualStudioExptTeam.vscodeintellicode',
];

export class LiteModeManager {
  private isLiteMode = false;
  private context: vscode.ExtensionContext;
  private anomalyDetector: AnomalyDetector;
  private stressCount = 0;
  private readonly STRESS_TRIGGER_COUNT = 3; // consecutive stressed readings before auto-enable

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.anomalyDetector = new AnomalyDetector();
    // Restore lite mode state
    this.isLiteMode = context.globalState.get<boolean>('devsense.liteModeActive', false);
  }

  evaluateStress(metrics: HardwareMetrics): void {
    const config = vscode.workspace.getConfiguration('devsense');
    if (!config.get<boolean>('liteModeAutoTrigger', true)) { return; }

    const isStressed = this.anomalyDetector.isSystemUnderStress(metrics);

    if (isStressed) {
      this.stressCount++;
      if (this.stressCount >= this.STRESS_TRIGGER_COUNT && !this.isLiteMode) {
        this.enable();
      }
    } else {
      this.stressCount = 0;
      if (this.isLiteMode) {
        // Auto-disable after stress resolves
        this.disable();
      }
    }
  }

  toggle(): void {
    if (this.isLiteMode) {
      this.disable();
    } else {
      this.enable();
    }
  }

  private enable(): void {
    if (this.isLiteMode) { return; }
    this.isLiteMode = true;
    this.context.globalState.update('devsense.liteModeActive', true);

    vscode.window.showInformationMessage(
      '⚡ DevSense: Lite Mode ENABLED — heavy extensions suspended to reduce system load.',
      'Disable Now'
    ).then(action => {
      if (action === 'Disable Now') { this.disable(); }
    });

    // Notify the webview
    vscode.commands.executeCommand('devsense.openDashboard');
    this.broadcastLiteModeStatus();
  }

  private disable(): void {
    if (!this.isLiteMode) { return; }
    this.isLiteMode = false;
    this.stressCount = 0;
    this.context.globalState.update('devsense.liteModeActive', false);

    vscode.window.showInformationMessage('✅ DevSense: Lite Mode DISABLED — all extensions restored.');
    this.broadcastLiteModeStatus();
  }

  private broadcastLiteModeStatus(): void {
    // Import lazily to avoid circular dep
    const { DashboardPanel } = require('./panels/dashboardPanel');
    DashboardPanel.postMessage({
      type: 'liteModeStatus',
      data: { active: this.isLiteMode }
    });
  }

  isActive(): boolean {
    return this.isLiteMode;
  }

  getDisabledExtensions(): string[] {
    return LITE_MODE_DISABLE_TARGETS;
  }
}
