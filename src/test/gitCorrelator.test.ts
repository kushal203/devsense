import * as assert from 'assert';
import { GitCorrelator } from '../gitCorrelator';
import { Anomaly } from '../anomalyDetector';
import { HardwareMetrics } from '../hardwareMonitor';

function makeAnomaly(overrides: Partial<Anomaly> = {}): Anomaly {
  return {
    type: 'cpu', severity: 'warning', value: 85,
    threshold: 80, message: 'CPU at 85%', suggestion: 'Check processes',
    ...overrides,
  };
}

function makeMetrics(): HardwareMetrics {
  return {
    timestamp: Date.now(),
    cpu: { usage: 85, temp: 70, cores: [], speed: 3.2, model: 'CPU' },
    ram: { used: 8e9, total: 16e9, usagePercent: 50, available: 8e9 },
    gpu: { name: 'GPU', usage: 30, temp: 60, memUsed: 1024, memTotal: 8192 },
    disk: { readSpeed: 10, writeSpeed: 5, usagePercent: 40 },
    network: { downloadSpeed: 100, uploadSpeed: 50 },
    battery: { hasBattery: false, percent: 100, isCharging: true, timeRemaining: -1 },
    uptime: 3600,
  };
}

describe('GitCorrelator', () => {
  it('starts with empty spike list', () => {
    const c = new GitCorrelator();
    assert.strictEqual(c.getRecentSpikes().length, 0);
  });

  it('records a spike', async () => {
    const c = new GitCorrelator();
    await c.recordSpikeWithCommit([makeAnomaly()], makeMetrics());
    assert.strictEqual(c.getRecentSpikes().length, 1);
  });

  it('stores anomaly data correctly', async () => {
    const c = new GitCorrelator();
    await c.recordSpikeWithCommit([makeAnomaly({ type: 'ram', value: 92 })], makeMetrics());
    const spike = c.getRecentSpikes()[0];
    assert.strictEqual(spike.anomalies[0].type, 'ram');
    assert.strictEqual(spike.anomalies[0].value, 92);
  });

  it('stores multiple anomalies per spike', async () => {
    const c = new GitCorrelator();
    await c.recordSpikeWithCommit(
      [makeAnomaly({ type: 'cpu' }), makeAnomaly({ type: 'ram' }), makeAnomaly({ type: 'temp' })],
      makeMetrics()
    );
    assert.strictEqual(c.getRecentSpikes()[0].anomalies.length, 3);
  });

  it('most recent spike is first', async () => {
    const c = new GitCorrelator();
    await c.recordSpikeWithCommit([makeAnomaly({ type: 'cpu' })], makeMetrics());
    await new Promise(r => setTimeout(r, 5));
    await c.recordSpikeWithCommit([makeAnomaly({ type: 'ram' })], makeMetrics());
    const spikes = c.getRecentSpikes();
    assert.strictEqual(spikes[0].anomalies[0].type, 'ram');
    assert.strictEqual(spikes[1].anomalies[0].type, 'cpu');
  });

  it('caps history at 50 entries', async () => {
    const c = new GitCorrelator();
    for (let i = 0; i < 55; i++) {
      await c.recordSpikeWithCommit([makeAnomaly()], makeMetrics());
    }
    assert.ok(c.getRecentSpikes().length <= 50);
  });

  it('spike has a valid timestamp', async () => {
    const c = new GitCorrelator();
    const before = Date.now();
    await c.recordSpikeWithCommit([makeAnomaly()], makeMetrics());
    const after = Date.now();
    const ts = c.getRecentSpikes()[0].timestamp;
    assert.ok(ts >= before && ts <= after);
  });

  it('spike stores CPU metrics snapshot', async () => {
    const c = new GitCorrelator();
    const m = makeMetrics();
    m.cpu.usage = 99;
    await c.recordSpikeWithCommit([makeAnomaly()], m);
    assert.strictEqual(c.getRecentSpikes()[0].metrics.cpu!.usage, 99);
  });
});
