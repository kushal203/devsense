import * as vscode from 'vscode';
import { HardwareMonitor } from './hardwareMonitor';
import { StatusBarManager } from './statusBarManager';
import { DashboardPanel } from './panels/dashboardPanel';
import { AnomalyDetector } from './anomalyDetector';
import { LiteModeManager } from './liteModeManager';
import { ProcessManager } from './processManager';
import { NotificationManager } from './notificationManager';
import { GitCorrelator } from './gitCorrelator';

let hardwareMonitor: HardwareMonitor;
let statusBarManager: StatusBarManager;
let anomalyDetector: AnomalyDetector;
let liteModeManager: LiteModeManager;
let processManager: ProcessManager;
let notificationManager: NotificationManager;
let gitCorrelator: GitCorrelator;

export function activate(context: vscode.ExtensionContext) {
  console.log('DevSense is now active!');

  // Initialize core services
  hardwareMonitor = new HardwareMonitor();
  statusBarManager = new StatusBarManager(context);
  anomalyDetector = new AnomalyDetector();
  liteModeManager = new LiteModeManager(context);
  processManager = new ProcessManager();
  notificationManager = new NotificationManager(context);
  gitCorrelator = new GitCorrelator();

  // Start monitoring
  hardwareMonitor.start();

  // Wire up hardware data to all consumers
  hardwareMonitor.onData(async (metrics) => {
    statusBarManager.update(metrics);

    // Check for anomalies
    const anomalies = anomalyDetector.analyze(metrics);
    if (anomalies.length > 0) {
      notificationManager.handleAnomalies(anomalies, metrics);
      liteModeManager.evaluateStress(metrics);
      gitCorrelator.recordSpikeWithCommit(anomalies, metrics);
    }

    // Push to dashboard if open
    DashboardPanel.postMessage({ type: 'metrics', data: metrics });
  });

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('devsense.openDashboard', () => {
      DashboardPanel.createOrShow(context);
    }),

    vscode.commands.registerCommand('devsense.toggleLiteMode', () => {
      liteModeManager.toggle();
    }),

    vscode.commands.registerCommand('devsense.openProcessManager', async () => {
      const processes = await processManager.getTopProcesses(20);
      DashboardPanel.createOrShow(context);
      setTimeout(() => {
        DashboardPanel.postMessage({ type: 'processes', data: processes });
      }, 500);
    }),

    vscode.commands.registerCommand('devsense.refreshHardware', async () => {
      await hardwareMonitor.forceRefresh();
    }),

    vscode.commands.registerCommand('devsense.killProcess', async (pid: number, name: string) => {
      const confirm = await vscode.window.showWarningMessage(
        `Kill process "${name}" (PID: ${pid})?`,
        'Kill It', 'Cancel'
      );
      if (confirm === 'Kill It') {
        const success = await processManager.killProcess(pid);
        if (success) {
          vscode.window.showInformationMessage(`✅ Process "${name}" terminated.`);
        } else {
          vscode.window.showErrorMessage(`❌ Failed to kill "${name}". Try running VS Code as administrator.`);
        }
      }
    })
  );

  // Register dashboard webview
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('devsense.dashboard', {
      resolveWebviewView(webviewView) {
        DashboardPanel.bindSidebar(webviewView, context);
      }
    })
  );

  // Handle messages from webview
  DashboardPanel.onWebviewMessage(async (msg) => {
    if (msg.type === 'killProcess') {
      await vscode.commands.executeCommand('devsense.killProcess', msg.pid, msg.name);
    } else if (msg.type === 'getProcesses') {
      const processes = await processManager.getTopProcesses(25);
      DashboardPanel.postMessage({ type: 'processes', data: processes });
    } else if (msg.type === 'getGitSpikes') {
      const spikes = gitCorrelator.getRecentSpikes();
      DashboardPanel.postMessage({ type: 'gitSpikes', data: spikes });
    } else if (msg.type === 'toggleLiteMode') {
      liteModeManager.toggle();
    }
  });

  // Show welcome notification on first install
  const isFirstInstall = context.globalState.get('devsense.installed') !== true;
  if (isFirstInstall) {
    context.globalState.update('devsense.installed', true);
    vscode.window.showInformationMessage(
      '⚡ DevSense is active! Click the pulse icon in the sidebar to open the Hardware Dashboard.',
      'Open Dashboard'
    ).then(action => {
      if (action === 'Open Dashboard') {
        vscode.commands.executeCommand('devsense.openDashboard');
      }
    });
  }
}

export function deactivate() {
  hardwareMonitor?.stop();
  statusBarManager?.dispose();
}
