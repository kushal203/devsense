'use strict';
/**
 * VS Code API mock for unit tests (CommonJS).
 */

const mockConfig = {
  'devsense.cpuWarningThreshold': 80,
  'devsense.ramWarningThreshold': 85,
  'devsense.tempWarningThreshold': 80,
  'devsense.liteModeAutoTrigger': true,
  'devsense.showStatusBar': true,
  'devsense.enableNotifications': true,
  'devsense.updateInterval': 2000,
};

module.exports = {
  workspace: {
    getConfiguration: (_section) => ({
      get: (key, defaultValue) => {
        const fullKey = `devsense.${key}`;
        return fullKey in mockConfig ? mockConfig[fullKey] : defaultValue;
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
      text: '', color: undefined, backgroundColor: undefined,
      tooltip: '', command: '',
      show: () => {}, hide: () => {}, dispose: () => {},
    }),
  },
  commands: {
    executeCommand: () => Promise.resolve(),
    registerCommand: () => ({ dispose: () => {} }),
  },
  StatusBarAlignment: { Right: 2, Left: 1 },
  ThemeColor: class ThemeColor {
    constructor(id) { this.id = id; }
  },
  Uri: { joinPath: () => ({ fsPath: '', toString: () => '' }) },
  // Test helpers
  __setConfig: (key, value) => { mockConfig[`devsense.${key}`] = value; },
  __resetConfig: () => {
    mockConfig['devsense.cpuWarningThreshold'] = 80;
    mockConfig['devsense.ramWarningThreshold'] = 85;
    mockConfig['devsense.tempWarningThreshold'] = 80;
  },
};
