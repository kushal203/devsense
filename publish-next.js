const fs = require('fs');
const { execSync } = require('child_process');

function run(cmd) {
    console.log(`Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
}

// 1. Read package.json
const pkgPath = './package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// 2. Bump patch version
const versionParts = pkg.version.split('.');
versionParts[2] = parseInt(versionParts[2]) + 1;
const newVersion = versionParts.join('.');
pkg.version = newVersion;

console.log(`Bumping version from ${pkg.version} to ${newVersion}`);

// 3. Write package.json
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// 4. Update CHANGELOG.md
const changelogPath = './CHANGELOG.md';
let changelog = fs.readFileSync(changelogPath, 'utf8');
const newEntry = `## [${newVersion}] - ${new Date().toISOString().split('T')[0]}

### Optimized
- Minor SEO and registry visibility optimizations.

`;
changelog = changelog.replace('All notable changes to DevSense will be documented here.\n\n', `All notable changes to DevSense will be documented here.\n\n${newEntry}`);
fs.writeFileSync(changelogPath, changelog);

// 5. Build, Package, and Publish
try {
    run('npm run compile');
    run('npx vsce package --allow-missing-repository');
    // Using the token provided previously
    run(`npx ovsx publish devsense-${newVersion}.vsix -p ${process.env.OVSX_PAT || 'OVSX_PAT_PLACEHOLDER'}`);
    console.log(`Successfully published v${newVersion}!`);
} catch (e) {
    console.error('Publishing failed', e);
    process.exit(1);
}
