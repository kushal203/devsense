import * as vscode from 'vscode';
import * as cp from 'child_process';
import { Anomaly } from './anomalyDetector';
import { HardwareMetrics } from './hardwareMonitor';

export interface HardwareSpike {
  timestamp: number;
  anomalies: Anomaly[];
  metrics: Partial<HardwareMetrics>;
  commitHash?: string;
  commitMessage?: string;
  commitAuthor?: string;
  branch?: string;
}

export class GitCorrelator {
  private recentSpikes: HardwareSpike[] = [];
  private readonly MAX_SPIKES = 50;

  async recordSpikeWithCommit(anomalies: Anomaly[], metrics: HardwareMetrics): Promise<void> {
    const spike: HardwareSpike = {
      timestamp: Date.now(),
      anomalies,
      metrics: {
        cpu: metrics.cpu,
        ram: metrics.ram,
        gpu: metrics.gpu
      }
    };

    // Try to get current git commit info
    const gitInfo = await this.getCurrentCommit();
    if (gitInfo) {
      spike.commitHash = gitInfo.hash;
      spike.commitMessage = gitInfo.message;
      spike.commitAuthor = gitInfo.author;
      spike.branch = gitInfo.branch;
    }

    this.recentSpikes.unshift(spike);
    if (this.recentSpikes.length > this.MAX_SPIKES) {
      this.recentSpikes = this.recentSpikes.slice(0, this.MAX_SPIKES);
    }
  }

  getRecentSpikes(): HardwareSpike[] {
    return this.recentSpikes;
  }

  clearSpikes(): void {
    this.recentSpikes = [];
  }

  private async getCurrentCommit(): Promise<{
    hash: string;
    message: string;
    author: string;
    branch: string;
  } | null> {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri?.fsPath;
      if (!workspaceFolder) { return null; }

      const [hash, message, author, branch] = await Promise.all([
        this.runGit('rev-parse --short HEAD', workspaceFolder),
        this.runGit('log -1 --pretty=%s', workspaceFolder),
        this.runGit('log -1 --pretty=%an', workspaceFolder),
        this.runGit('branch --show-current', workspaceFolder)
      ]);

      return { hash, message, author, branch };
    } catch (_) {
      return null;
    }
  }

  private runGit(args: string, cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cp.exec(`git ${args}`, { cwd }, (err, stdout) => {
        if (err) { reject(err); }
        else { resolve(stdout.trim()); }
      });
    });
  }
}
