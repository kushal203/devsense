# Changelog

All notable changes to DevSense will be documented here.

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
