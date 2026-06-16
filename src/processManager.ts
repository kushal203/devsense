import * as si from 'systeminformation';

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;       // %
  mem: number;       // MB
  memPercent: number; // %
  command: string;
  started: string;
}

export interface PortInfo {
  port: number;
  protocol: string;
  pid: number;
  processName: string;
}

export class ProcessManager {
  async getOpenPorts(): Promise<PortInfo[]> {
    try {
      const [connections, procs] = await Promise.all([
        si.networkConnections(),
        si.processes()
      ]);

      const listenPorts = connections.filter(c => c.state === 'LISTEN' && c.localPort);
      const uniquePorts = new Map<number, PortInfo>();

      for (const conn of listenPorts) {
        const portNum = parseInt(conn.localPort, 10);
        if (isNaN(portNum) || uniquePorts.has(portNum)) continue;

        const proc = procs.list.find(p => p.pid === conn.pid);
        uniquePorts.set(portNum, {
          port: portNum,
          protocol: conn.protocol.toUpperCase(),
          pid: conn.pid,
          processName: proc ? proc.name : (conn.pid > 0 ? 'System Process' : 'Unknown')
        });
      }

      return Array.from(uniquePorts.values()).sort((a, b) => a.port - b.port);
    } catch (err) {
      console.error('[DevSense] Failed to get open ports:', err);
      return [];
    }
  }

  async getTopProcesses(limit: number = 20): Promise<ProcessInfo[]> {
    try {
      const procs = await si.processes();
      const list = procs.list || [];

      return list
        .filter(p => p.pid > 0 && p.name)
        .sort((a, b) => (b.cpu ?? 0) - (a.cpu ?? 0))
        .slice(0, limit)
        .map(p => ({
          pid: p.pid,
          name: p.name || 'Unknown',
          cpu: Math.round((p.cpu ?? 0) * 10) / 10,
          mem: Math.round((p.memRss ?? 0) / 1024 / 1024),
          memPercent: Math.round((p.mem ?? 0) * 10) / 10,
          command: p.command || p.name || '',
          started: p.started || ''
        }));
    } catch (err) {
      console.error('[DevSense] Failed to get processes:', err);
      return [];
    }
  }

  async killProcess(pid: number): Promise<boolean> {
    try {
      process.kill(pid);
      return true;
    } catch (err) {
      // Try platform-specific kill
      const { exec } = require('child_process');
      const platform = process.platform;
      const cmd = platform === 'win32'
        ? `taskkill /F /PID ${pid}`
        : `kill -9 ${pid}`;

      return new Promise<boolean>((resolve) => {
        exec(cmd, (error: Error | null) => {
          resolve(!error);
        });
      });
    }
  }
}
