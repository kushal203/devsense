import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

type WebviewMessage = {
  type: string;
  [key: string]: unknown;
};

export class DashboardPanel {
  private static sidebarView: vscode.WebviewView | undefined;
  private static panel: vscode.WebviewPanel | undefined;
  private static messageHandlers: Array<(msg: WebviewMessage) => void> = [];
  private static context: vscode.ExtensionContext;

  static bindSidebar(webviewView: vscode.WebviewView, context: vscode.ExtensionContext): void {
    DashboardPanel.sidebarView = webviewView;
    DashboardPanel.context = context;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
    };

    webviewView.webview.html = DashboardPanel.getHtml(webviewView.webview, context);

    webviewView.webview.onDidReceiveMessage((msg: WebviewMessage) => {
      DashboardPanel.messageHandlers.forEach(h => h(msg));
    });

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        webviewView.webview.html = DashboardPanel.getHtml(webviewView.webview, context);
      }
    });
  }

  static createOrShow(context: vscode.ExtensionContext): void {
    DashboardPanel.context = context;
    // Focus sidebar instead of opening a panel
    vscode.commands.executeCommand('workbench.view.extension.devsense-container');
  }

  static postMessage(message: WebviewMessage): void {
    DashboardPanel.sidebarView?.webview.postMessage(message);
    DashboardPanel.panel?.webview.postMessage(message);
  }

  static onWebviewMessage(handler: (msg: WebviewMessage) => void): void {
    DashboardPanel.messageHandlers.push(handler);
  }

  private static getHtml(webview: vscode.Webview, context: vscode.ExtensionContext): string {
    const mediaPath = vscode.Uri.joinPath(context.extensionUri, 'media');
    const htmlPath = path.join(context.extensionUri.fsPath, 'media', 'dashboard.html');

    let html = fs.readFileSync(htmlPath, 'utf8');

    // Replace asset URIs with webview-safe URIs
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dashboard.js'));
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaPath, 'dashboard.css'));
    const nonce = DashboardPanel.getNonce();

    html = html
      .replace('{{CSS_URI}}', cssUri.toString())
      .replace('{{JS_URI}}', jsUri.toString())
      .replace(/{{NONCE}}/g, nonce);

    return html;
  }

  private static getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
