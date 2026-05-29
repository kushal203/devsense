import * as assert from 'assert';
import { ProcessManager } from '../processManager';

describe('ProcessManager', () => {
  let manager: ProcessManager;
  beforeEach(() => { manager = new ProcessManager(); });

  describe('getTopProcesses()', () => {
    it('returns an array', async () => {
      const procs = await manager.getTopProcesses(5);
      assert.ok(Array.isArray(procs));
    });

    it('respects limit of 5', async () => {
      const procs = await manager.getTopProcesses(5);
      assert.ok(procs.length <= 5, `Got ${procs.length}, expected <= 5`);
    });

    it('default limit is 20', async () => {
      const procs = await manager.getTopProcesses();
      assert.ok(procs.length <= 20);
    });

    it('each process has required fields', async () => {
      const procs = await manager.getTopProcesses(3);
      for (const p of procs) {
        assert.ok(typeof p.pid === 'number' && p.pid > 0, `Invalid pid: ${p.pid}`);
        assert.ok(typeof p.name === 'string' && p.name.length > 0, `Invalid name: ${p.name}`);
        assert.ok(typeof p.cpu === 'number', `cpu not a number: ${p.cpu}`);
        assert.ok(typeof p.mem === 'number', `mem not a number: ${p.mem}`);
      }
    });

    it('cpu values are 0-100', async () => {
      const procs = await manager.getTopProcesses(10);
      for (const p of procs) {
        assert.ok(p.cpu >= 0 && p.cpu <= 100, `cpu out of range: ${p.cpu}`);
      }
    });

    it('mem values are non-negative', async () => {
      const procs = await manager.getTopProcesses(10);
      for (const p of procs) {
        assert.ok(p.mem >= 0, `mem negative: ${p.mem}`);
      }
    });

    it('sorted by CPU descending', async () => {
      const procs = await manager.getTopProcesses(10);
      for (let i = 1; i < procs.length; i++) {
        assert.ok(procs[i - 1].cpu >= procs[i].cpu,
          `Index ${i-1} (${procs[i-1].cpu}%) should be >= index ${i} (${procs[i].cpu}%)`);
      }
    });

    it('memPercent is 0-100', async () => {
      const procs = await manager.getTopProcesses(5);
      for (const p of procs) {
        assert.ok(p.memPercent >= 0 && p.memPercent <= 100, `memPercent: ${p.memPercent}`);
      }
    });
  });

  describe('killProcess()', () => {
    it('returns false for non-existent PID (9999999)', async () => {
      const result = await manager.killProcess(9999999);
      assert.strictEqual(result, false);
    });

    it('returns a boolean', async () => {
      const result = await manager.killProcess(9999998);
      assert.ok(typeof result === 'boolean');
    });
  });
});
