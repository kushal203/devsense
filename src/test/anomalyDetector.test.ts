import * as assert from 'assert';

// vscode is mocked via setup.ts (loaded via --require in mocha)
import { AnomalyDetector } from '../anomalyDetector';
import { HardwareMetrics } from '../hardwareMonitor';

function makeMetrics(overrides: Partial<HardwareMetrics> = {}): HardwareMetrics {
  return {
    timestamp: Date.now(),
    cpu: { usage: 10, temp: 40, cores: [10, 10], speed: 3.2, model: 'Test CPU' },
    ram: { used: 4e9, total: 16e9, usagePercent: 25, available: 12e9 },
    gpu: { name: 'GPU', usage: 20, temp: 50, memUsed: 2048, memTotal: 8192 },
    disk: { readSpeed: 10, writeSpeed: 5, usagePercent: 40 },
    network: { downloadSpeed: 100, uploadSpeed: 50 },
    battery: { hasBattery: false, percent: 100, isCharging: true, timeRemaining: -1 },
    uptime: 3600,
    ...overrides,
  };
}

describe('AnomalyDetector', () => {

  describe('CPU detection', () => {
    it('no anomaly below threshold (79%)', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ cpu: { usage: 79, temp: 40, cores: [], speed: 3.2, model: 'CPU' } });
      assert.strictEqual(d.analyze(m).filter(a => a.type === 'cpu').length, 0);
    });

    it('WARNING at threshold (80%)', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ cpu: { usage: 80, temp: 40, cores: [], speed: 3.2, model: 'CPU' } });
      const a = d.analyze(m).find(a => a.type === 'cpu');
      assert.ok(a, 'Expected CPU anomaly');
      assert.strictEqual(a!.severity, 'warning');
    });

    it('CRITICAL at 95%+', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ cpu: { usage: 95, temp: 40, cores: [], speed: 3.2, model: 'CPU' } });
      const a = d.analyze(m).find(a => a.type === 'cpu');
      assert.ok(a);
      assert.strictEqual(a!.severity, 'critical');
    });

    it('anomaly has correct value and threshold', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ cpu: { usage: 88, temp: 40, cores: [], speed: 3.2, model: 'CPU' } });
      const a = d.analyze(m).find(a => a.type === 'cpu');
      assert.ok(a);
      assert.strictEqual(a!.value, 88);
      assert.strictEqual(a!.threshold, 80);
    });

    it('anomaly includes a non-empty suggestion', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ cpu: { usage: 85, temp: 40, cores: [], speed: 3.2, model: 'CPU' } });
      const a = d.analyze(m).find(a => a.type === 'cpu');
      assert.ok(a!.suggestion.length > 0);
    });

    it('cooldown prevents immediate repeat notification', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ cpu: { usage: 90, temp: 40, cores: [], speed: 3.2, model: 'CPU' } });
      const first = d.analyze(m).filter(a => a.type === 'cpu').length;
      const second = d.analyze(m).filter(a => a.type === 'cpu').length;
      assert.strictEqual(first, 1, 'First call should fire');
      assert.strictEqual(second, 0, 'Second call within cooldown suppressed');
    });
  });

  describe('RAM detection', () => {
    it('no anomaly at 84%', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ ram: { used: 13.4e9, total: 16e9, usagePercent: 84, available: 2.6e9 } });
      assert.strictEqual(d.analyze(m).filter(a => a.type === 'ram').length, 0);
    });

    it('WARNING at 85%', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ ram: { used: 13.6e9, total: 16e9, usagePercent: 85, available: 2.4e9 } });
      const a = d.analyze(m).find(a => a.type === 'ram');
      assert.ok(a);
      assert.strictEqual(a!.severity, 'warning');
    });

    it('CRITICAL at 95%', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ ram: { used: 15.2e9, total: 16e9, usagePercent: 95, available: 0.8e9 } });
      const a = d.analyze(m).find(a => a.type === 'ram');
      assert.ok(a);
      assert.strictEqual(a!.severity, 'critical');
    });
  });

  describe('Temperature detection', () => {
    it('no anomaly when temp is -1 (unavailable)', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ cpu: { usage: 10, temp: -1, cores: [], speed: 3.2, model: 'CPU' } });
      assert.strictEqual(d.analyze(m).filter(a => a.type === 'temp').length, 0);
    });

    it('no anomaly at 79°C', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ cpu: { usage: 10, temp: 79, cores: [], speed: 3.2, model: 'CPU' } });
      assert.strictEqual(d.analyze(m).filter(a => a.type === 'temp').length, 0);
    });

    it('WARNING at 80°C', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ cpu: { usage: 10, temp: 80, cores: [], speed: 3.2, model: 'CPU' } });
      const a = d.analyze(m).find(a => a.type === 'temp');
      assert.ok(a);
      assert.strictEqual(a!.severity, 'warning');
    });

    it('CRITICAL at 90°C', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ cpu: { usage: 10, temp: 90, cores: [], speed: 3.2, model: 'CPU' } });
      const a = d.analyze(m).find(a => a.type === 'temp');
      assert.ok(a);
      assert.strictEqual(a!.severity, 'critical');
    });
  });

  describe('Battery detection', () => {
    it('no anomaly when hasBattery is false', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ battery: { hasBattery: false, percent: 5, isCharging: false, timeRemaining: -1 } });
      assert.strictEqual(d.analyze(m).filter(a => a.type === 'battery').length, 0);
    });

    it('no anomaly when charging (even at 5%)', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ battery: { hasBattery: true, percent: 5, isCharging: true, timeRemaining: -1 } });
      assert.strictEqual(d.analyze(m).filter(a => a.type === 'battery').length, 0);
    });

    it('WARNING at 15% not charging', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ battery: { hasBattery: true, percent: 15, isCharging: false, timeRemaining: 20 } });
      const a = d.analyze(m).find(a => a.type === 'battery');
      assert.ok(a);
      assert.strictEqual(a!.severity, 'warning');
    });

    it('CRITICAL at 5% not charging', () => {
      const d = new AnomalyDetector();
      const m = makeMetrics({ battery: { hasBattery: true, percent: 5, isCharging: false, timeRemaining: 5 } });
      const a = d.analyze(m).find(a => a.type === 'battery');
      assert.ok(a);
      assert.strictEqual(a!.severity, 'critical');
    });
  });

  describe('isSystemUnderStress()', () => {
    it('returns false when all normal', () => {
      const d = new AnomalyDetector();
      assert.strictEqual(d.isSystemUnderStress(makeMetrics()), false);
    });

    it('returns true when CPU high', () => {
      const d = new AnomalyDetector();
      assert.strictEqual(d.isSystemUnderStress(
        makeMetrics({ cpu: { usage: 85, temp: 40, cores: [], speed: 3.2, model: 'CPU' } })
      ), true);
    });

    it('returns true when RAM high', () => {
      const d = new AnomalyDetector();
      assert.strictEqual(d.isSystemUnderStress(
        makeMetrics({ ram: { used: 14e9, total: 16e9, usagePercent: 90, available: 2e9 } })
      ), true);
    });

    it('returns true when temp high', () => {
      const d = new AnomalyDetector();
      assert.strictEqual(d.isSystemUnderStress(
        makeMetrics({ cpu: { usage: 10, temp: 85, cores: [], speed: 3.2, model: 'CPU' } })
      ), true);
    });
  });
});
