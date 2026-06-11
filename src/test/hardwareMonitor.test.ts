import * as assert from 'assert';
import { HardwareMonitor, HardwareMetrics } from '../hardwareMonitor';

// vscode is mocked globally via setup.js (--require)

describe('HardwareMonitor', () => {

  describe('forceRefresh() — metrics shape', function () {
    this.timeout(60000);
    let metrics: HardwareMetrics;

    before(async function () {
      const monitor = new HardwareMonitor();
      let resolved = false;
      const p = new Promise<HardwareMetrics>((resolve) => {
        monitor.onData((m) => { if (!resolved) { resolved = true; resolve(m); } });
      });
      await monitor.start();
      metrics = await p;
      monitor.stop();
    });

    it('emits metrics with a numeric timestamp', () => {
      assert.ok(typeof metrics.timestamp === 'number' && metrics.timestamp > 0);
    });

    it('CPU usage is 0-100', () => {
      assert.ok(metrics.cpu.usage >= 0 && metrics.cpu.usage <= 100,
        `cpu.usage out of range: ${metrics.cpu.usage}`);
    });

    it('CPU model is a string', () => {
      assert.ok(typeof metrics.cpu.model === 'string');
    });

    it('CPU cores is an array', () => {
      assert.ok(Array.isArray(metrics.cpu.cores));
    });

    it('RAM usagePercent is 0-100', () => {
      assert.ok(metrics.ram.usagePercent >= 0 && metrics.ram.usagePercent <= 100,
        `ram.usagePercent: ${metrics.ram.usagePercent}`);
    });

    it('RAM total > 0', () => {
      assert.ok(metrics.ram.total > 0);
    });

    it('RAM used <= total', () => {
      assert.ok(metrics.ram.used <= metrics.ram.total);
    });

    it('Disk usagePercent is 0-100', () => {
      assert.ok(metrics.disk.usagePercent >= 0 && metrics.disk.usagePercent <= 100);
    });

    it('Network speeds are non-negative', () => {
      assert.ok(metrics.network.downloadSpeed >= 0);
      assert.ok(metrics.network.uploadSpeed >= 0);
    });

    it('Battery percent is 0-100', () => {
      assert.ok(metrics.battery.percent >= 0 && metrics.battery.percent <= 100);
    });

    it('GPU name is a string', () => {
      assert.ok(typeof metrics.gpu.name === 'string');
    });

    it('Uptime is a non-negative number', () => {
      assert.ok(typeof metrics.uptime === 'number' && metrics.uptime >= 0);
    });
  });

  describe('Event emitter behaviour', function () {
    this.timeout(60000);

    it('onData registers multiple listeners and all are called', async function () {
      const monitor = new HardwareMonitor();
      let count = 0;
      monitor.onData(() => count++);
      monitor.onData(() => count++);
      await monitor.forceRefresh();
      monitor.stop();
      assert.ok(count >= 2, `Expected >= 2 listener calls, got ${count}`);
    });

    it('stop() clears the polling interval without error', function () {
      const monitor = new HardwareMonitor();
      // start() begins polling — stop() should clear without throwing
      assert.doesNotThrow(() => monitor.stop());
    });

    it('stop() after start() does not throw', async function () {
      const monitor = new HardwareMonitor();
      let emitted = false;
      monitor.onData(() => { emitted = true; });
      await monitor.start();
      assert.doesNotThrow(() => monitor.stop());
      assert.ok(emitted, 'At least one emission should have occurred before stop');
    });
  });
});
