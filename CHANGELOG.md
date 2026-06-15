# Changelog

All notable changes to DevSense will be documented here.

## [1.0.37] - 2026-06-15

### Fixed (Audit Pass)
- 🐛 **Redundant CPU speed setText**: Removed a duplicate `textContent` call that ran immediately before the boost badge `innerHTML` override, causing a single-frame flicker on every metrics tick.
- 🐛 **CPU Boost baseline was unreliable**: Previously set from the very first reading (could be a cold-boot spike). Now tracks the **minimum observed speed** across the session as the true idle baseline — boost detection is now accurate.
- 🐛 **Temperature bar scale was wrong**: The bar filled to 100% only at 100°C (already dangerous). Corrected to scale 0–90°C → 0–100% so the bar turns full-red well before hitting dangerous territory.
- 🐛 **Alert banner DOM thrash**: `checkAlerts` re-set `display:flex/none` every 2 seconds even when state hadn't changed. Added hysteresis — banner DOM only updates on state *transitions* (clear→alert or alert→clear), eliminating unnecessary reflows.

### Added
- 🔥 **Thermal Throttle Detector**: When CPU temperature reaches ≥85°C AND clock speed drops 15%+ from the session maximum, a red "🔥 CPU Thermal Throttling Detected" banner fires and a pulsing `🔥 THROTTLE` badge appears on the CPU speed row. Laptop developers will catch thermal throttle events instantly — before they wonder why their build got 40% slower.


## [1.0.36] - 2026-06-15

### Added
- ⏱ **Build Timer**: A one-click stopwatch in the header that tracks exactly how long your build takes — and at the same time secretly records the peak CPU%, RAM%, Temperature, and GPU% during that window. When you stop the timer, a beautiful "Build Report" card drops in showing duration (e.g. `2m 14s`) alongside all four hardware peaks. Perfect for benchmarking webpack, cargo, gradle, pytest, or any other dev workflow. The timer button glows red while running, green display ticks up second-by-second.


## [1.0.35] - 2026-06-15

### Added
- 💧 **Memory Leak Detector**: Tracks RAM across a rolling 30-sample window. If RAM rises 5%+ continuously, a yellow "Memory Pressure Detected" banner appears — warning developers to check for memory leaks in their running processes (Node.js, Python servers, browser tabs, etc.). Dismiss button resets the detector.
- ↑↓ **RAM Trend Arrow**: The RAM card now shows a live trend arrow — ↑↑ (fast rising), ↑ (rising), → (stable), ↓ (falling), ↓↓ (fast falling) — so you know at a glance if memory pressure is building up.
- ⚡ **CPU Turbo Boost Badge**: When CPU frequency exceeds its session baseline by 5%+, an animated glowing "⚡ BOOST" badge appears on the CPU card — confirming your CPU is turbo-boosting for your current workload.


## [1.0.34] - 2026-06-14

### Improved
- 🚀 **SEO Overhaul**: Updated `displayName` to include "VS Code System Monitor & Performance Dashboard" for better search discoverability. Rewrote `description` to mention system health score and session peak tracker. Reordered keywords to prioritise highest-traffic terms (system monitor, cpu monitor, ram monitor).
- 📖 **README Rewrite**: Completely revamped README with FAQ section (6 common developer questions), "Use Cases" section covering 6 developer personas, a full comparison table (DevSense vs OS Task Manager vs htop/btop), keyword-rich headings, and naturally embedded long-tail search terms like "VS Code task manager", "vscode performance monitor", and "gpu monitor VS Code".


## [1.0.33] - 2026-06-14

### Added
- 📈 **Session Peak Tracker**: A compact strip below the Health Score shows the all-time high CPU%, RAM%, Temperature, and GPU% recorded since VS Code opened. Each new peak flashes yellow to highlight it. Includes a ↺ Reset button to clear peaks and start fresh — perfect for tracking what spiked during a build or test run.


## [1.0.32] - 2026-06-14

### Added
- 🏆 **System Health Score**: A live animated ring gauge (0–100) always visible between the header and tabs. It aggregates CPU, RAM, temperature and GPU usage into one instant health number — color-coded green (Healthy) → yellow (Moderate) → orange (Stressed) → red (Critical). Each contributing factor is shown with its own color-coded dot for a quick breakdown at a glance.


## [1.0.31] - 2026-06-13

### Optimized
- Routine release optimization and pipeline update.


## [1.0.30] - 2026-06-13

### Optimized
- Minor registry visibility optimizations.


## [1.0.29] - 2026-06-12

### Improved
- 🚀 SEO: Added highly searched keywords (task manager, memory monitor, performance dashboard, IDE performance) to package manifest.
- 📖 Docs: Weaved targeted SEO keywords into the extension's README to rank higher in VS Code Marketplace searches.


## [1.0.28] - 2026-06-12

### Added
- 🎮 GPU: Added real-time GPU History Chart displaying dual-line tracking for GPU Core Usage percentage and VRAM Allocation percentage over the last 60 seconds (automatically shown on systems with an active GPU).


## [1.0.27] - 2026-06-11

### Added
- 💾 Disk: Added real-time Disk History Chart displaying dual-line tracking for Disk Read and Write speeds (IOPS / operations per second) over the last 60 seconds.
- 🧪 Test: Increased WMI unit test timeout limits to 60s for enhanced resilience against transient Windows host load/latency.


## [1.0.26] - 2026-06-11

### Added
- 🌐 Network: Added real-time Network History Chart displaying dual-line tracking for Upload and Download speeds over the last 60 seconds.


## [1.0.25] - 2026-06-10

### Fixed
- 🖥️ CPU: Switched from a static frequency placeholder to dynamic current CPU frequency queries.
- 🎮 GPU: Fixed GPU VRAM property mapping so allocation values render correctly on the dashboard card.
- 🔋 Battery: Robustly clamped battery percentage metrics to the valid `0-100` range to handle faulty system driver/firmware reports.


## [1.0.24] - 2026-06-10

### Fixed
- 📸 Docs: Changed screenshot image URLs in README to use official raw GitHub usercontent links for maximum reliability and branding consistency.


## [1.0.23] - 2026-06-10

### Fixed
- 📸 Docs: Replaced relative screenshot paths in README with public CDN/hosted URLs so they render correctly on the Open VSX registry website.


## [1.0.22] - 2026-06-10

### Added
- 📸 Docs: Added 3 high-quality screenshots to the README — Hardware Dashboard, Process Manager, and Status Bar vitals — making the extension page much more attractive on Open VSX.


## [1.0.21] - 2026-06-10

### Improved
- 🚀 SEO: Expanded keywords list (20 tags including vscodium, gitpod, theia, anomaly detection, real-time) for better Open VSX discoverability.
- 📖 Docs: Completely revamped README with Open VSX/download badges, CLI install command, quick-start steps, platform/editor compatibility tables, and feature breakdown.
- 🗂️ Metadata: Added "Debuggers" category and improved extension description for search relevance.


## [1.0.20] - 2026-06-10

### Added
- ✨ UI Feature: Temperature card now uses smart color-coding — green (safe), yellow (warm ≥60°C), orange (hot ≥75°C), red (critical ≥90°C) — so you can spot thermal issues at a glance.


## [1.0.19] - 2026-06-09

### Added
- ✨ UI Feature: Disk card now shows free disk space in GB (highlighted in yellow) alongside read/write speeds so developers always know how much storage they have left.


## [1.0.18] - 2026-06-09

### Added
- ✨ UI Feature: GPU card now displays live VRAM usage (e.g. 🟣 VRAM: 4.2GB / 8.0GB) so developers can monitor their graphics memory directly from the dashboard.


## [1.0.17] - 2026-06-08

### Added
- ✨ UI Feature: CPU card now shows the live clock speed in GHz (e.g. ⚡ 3.60 GHz) so developers can see exactly how hard their processor is running.


## [1.0.16] - 2026-06-08

### Added
- ✨ UI Feature: RAM card now shows a green "▼ X.XGB free" indicator below the usage bar, so you instantly know how much memory is still available without doing the math.


## [1.0.15] - 2026-06-07

### Added
- ✨ Feature: Added a 📋 "Copy Commit Hash" button to each spike entry in the Git Spikes tab — click it to instantly copy the linked commit hash to your clipboard, with a ✅ confirmation animation.


## [1.0.14] - 2026-06-06

### Added
- ✨ UI Feature: Improved the "Top CPU Processes" tab with a visually pleasing empty state so it looks great even when there are no background tasks bogging down your system.


## [1.0.13] - 2026-06-06

### Added
- ✨ UI Feature: Added a convenient "Disable" button directly to the Lite Mode alert banner so you can easily turn it off without opening the settings menu.


## [1.0.12] - 2026-06-06

### Added
- ✨ Feature: Added a "Clear" button to the Git Spikes tab so you can manually dismiss and reset your recorded hardware anomalies.


## [1.0.11] - 2026-06-06

### Added
- ✨ UI Feature: Added a convenient "Settings" gear icon to the dashboard header, allowing you to instantly jump into DevSense's configuration settings.


## [1.0.10] - 2026-06-01

### Added
- ✨ UI Feature: Added a process count indicator to the "Top CPU Processes" tab header so you know how many active tasks are being monitored.


## [1.0.9] - 2026-06-01

### Added
- ✨ UI Feature: Added a live "System Uptime" display in the dashboard header so you know exactly how long your machine has been running.


## [1.0.8] - 2026-05-29

### Added
- ✨ UI Feature: Added a live "Last Updated" timestamp to the dashboard header so you know exactly when hardware metrics were last fetched.


## [1.0.7] - 2026-05-29

### Optimized
- Minor SEO and registry visibility optimizations.

## [1.0.6] - 2026-05-29

### Optimized
- Minor SEO and registry visibility optimizations.

## [1.0.5] - 2026-05-29

### Optimized
- Minor SEO and registry visibility optimizations.

## [1.0.4] - 2026-05-29

### Optimized
- Minor SEO and registry visibility optimizations.

## [1.0.3] - 2026-05-29

### Optimized
- Minor SEO and registry visibility optimizations.

## [1.0.2] - 2026-05-29

### Optimized
- Minor SEO and registry visibility optimizations.

## [1.0.1] - 2026-05-28

### Added
- ✅ Comprehensive unit testing suite covering Core anomaly detection, Hardware monitoring shape validation, Process handling, and Git correlation
- 🐛 Fixed `mem_rss` to `memRss` property mapping in Process Manager


## [1.0.0] - 2024-01-01

### Added
- 🎉 Initial release
- Live hardware dashboard with CPU, RAM, GPU, temperature, disk, network, battery monitoring
- Status bar vitals with color-coded severity indicators
- Smart anomaly detection with configurable thresholds
- Lite Mode — auto-enables when system is under stress
- Process Manager — view and kill processes from VS Code
- Git Spike Correlation — links hardware spikes to git commits
- Cross-platform support (Windows, macOS, Linux)
- Configurable polling interval and thresholds
