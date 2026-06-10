const { execSync } = require('child_process');
const fs = require('fs');

const MAX_RUNS = 4;
const INTERVAL_MS = 60 * 60 * 1000; // 1 hour in milliseconds
const LOG_FILE = 'autopublish.log';

let currentRuns = 0;

function log(msg) {
    const time = new Date().toISOString();
    const formatted = `[${time}] ${msg}\n`;
    console.log(formatted.trim());
    fs.appendFileSync(LOG_FILE, formatted);
}

function runPublish() {
    currentRuns++;
    log(`--- Starting publish run ${currentRuns} of ${MAX_RUNS} ---`);
    try {
        log('Running publish-next.js...');
        execSync('node publish-next.js', { stdio: 'pipe' });
        
        log('Committing to git...');
        execSync('git commit -am "chore: automated version bump"', { stdio: 'pipe' });
        
        log(`Run ${currentRuns} completed successfully.`);
    } catch (e) {
        log(`Error during run ${currentRuns}: ${e.message}`);
        if (e.stdout) log(`STDOUT: ${e.stdout.toString()}`);
        if (e.stderr) log(`STDERR: ${e.stderr.toString()}`);
    }

    if (currentRuns >= MAX_RUNS) {
        log('Target reached. Stopping auto-publisher.');
        process.exit(0);
    } else {
        log(`Waiting 1 hour for run ${currentRuns + 1}...`);
    }
}

log(`Auto-publisher started. Will run ${MAX_RUNS} times, every 1 hour.`);
// Start the first run exactly 1 hour from now (or we could start immediately, but we just published 1.0.1 recently).
log('Waiting 1 hour for the first run...');
setInterval(runPublish, INTERVAL_MS);
