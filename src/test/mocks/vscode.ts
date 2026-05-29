/**
 * VS Code API mock for unit tests.
 * Allows testing modules that import 'vscode' without a real VS Code instance.
 */

const EventEmitter = require('events');

const mockConfig: Record<string, unknown> = {
  'devsense.cpuWarningThreshold': 80,
  'devsense.ramWarningThreshold': 85,
  'devsense.tempWarningThreshold': 80,
  'devsense.liteModeAutoTrigger': true,
  'devsense.showStatusBar': true,
  'devsense.enableNotifications': true,
  'devsense.updateInterval': 2000,
};

const vscode = {
  workspace: {
    getConfiguration: (_section?: string) => ({
      get: <T>(key: string, defaultValue?: T): T => {
        const fullKey = `devsense.${key}`;
        return (mockConfig[fullKey] ?? defaultValue) as T;
      },
      update: () => Promise.resolve(),
    }),
    workspaceFolders: [],
    onDidChangeConfiguration: () => ({ dispose: () => {} }),
  },
  window: {
    showInformationMessage: () => Promise.resolve(undefined),
    showWarningMessage: () => Promise.resolve(undefined),
    showErrorMessage: () => Promise.resolve(undefined),
    createStatusBarItem: () => ({
      text: '',
      color: undefined,
      backgroundColor: undefined,
      tooltip: '',
      command: '',
      show: () => {},
      hide: () => {},
      dispose: () => {},
    }),
  },
  commands: {
    executeCommand: () => Promise.resolve(),
    registerCommand: () => ({ dispose: () => {} }),
  },
  StatusBarAlignment: { Right: 2, Left: 1 },
  ThemeColor: class ThemeColor {
    id: string;
    constructor(id: string) { this.id = id; }
  },
  Uri: {
    joinPath: () => ({ fsPath: '', toString: () => '' }),
  },
  EventEmitter,
  // Allow overriding config values in tests
  __setConfig: (key: string, value: unknown) => {
    mockConfig[`devsense.${key}`] = value;
  },
  __resetConfig: () => {
    mockConfig['devsense.cpuWarningThreshold'] = 80;
    mockConfig['devsense.ramWarningThreshold'] = 85;
    mockConfig['devsense.tempWarningThreshold'] = 80;
    mockConfig['devsense.liteModeAutoTrigger'] = true;
    mockConfig['devsense.showStatusBar'] = true;
    mockConfig['devsense.enableNotifications'] = true;
    mockConfig['devsense.updateInterval'] = 2000;
  },
};

module.exports = vscode;
