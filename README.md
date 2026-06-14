# ⚡ DevSense — VS Code System Monitor & Performance Dashboard

[![Open VSX Version](https://img.shields.io/open-vsx/v/devsense-team/devsense?label=Open%20VSX&color=4f7df4)](https://open-vsx.org/extension/devsense-team/devsense)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/devsense-team/devsense?color=22d3a4)](https://open-vsx.org/extension/devsense-team/devsense)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)](https://open-vsx.org/extension/devsense-team/devsense)

> **The only VS Code extension that gives you a real-time CPU monitor, RAM monitor, GPU monitor, temperature sensor, system health score, and process manager — all without leaving your editor.**

DevSense is a **VS Code system monitor** and **performance dashboard** built for developers who need to understand exactly what their machine is doing while they code, build, test, and deploy.

---

## 💡 Why Developers Love DevSense

Ever wondered **why VS Code is slow**, **why your build is taking forever**, or **why your laptop fan is screaming**? DevSense answers all of that — right inside your IDE.

- Running a heavy Docker build? **Watch CPU and RAM spike in real-time.**
- Laptop overheating during webpack? **See the temperature hit 85°C and get alerted.**
- Memory leak in your Node.js app? **Track RAM climbing steadily over time.**
- Slow CI/CD pipeline? **Correlate hardware spikes to your exact git commit.**

DevSense acts as a full **VS Code task manager** — no more Alt-Tab to Windows Task Manager or Activity Monitor. Your **hardware vitals**, **system health score**, **session peak stats**, and **process manager** are all one click away, permanently embedded in your IDE.

---

## 📸 Screenshots

### 📊 Live Hardware Dashboard
![DevSense Hardware Dashboard — VS Code System Monitor](https://raw.githubusercontent.com/kushal203/devsense/master/images/screenshot-dashboard.png)

### 📋 Process Manager — Kill runaway processes in one click
![DevSense Process Manager](https://raw.githubusercontent.com/kushal203/devsense/master/images/screenshot-processes.png)

### 🔴 Status Bar Vitals — Always visible hardware health
![DevSense Status Bar](https://raw.githubusercontent.com/kushal203/devsense/master/images/screenshot-statusbar.png)

---

## 🚀 Quick Start

**Step 1** — Install DevSense from [Open VSX Registry](https://open-vsx.org/extension/devsense-team/devsense)

```bash
# Install via CLI (VSCodium / Gitpod / Theia)
ovsx get devsense-team.devsense
```

**Step 2** — The **⚡ icon** appears in your Activity Bar instantly

**Step 3** — **Click the ⚡ icon** to open the live Hardware Dashboard

**Step 4** — Hardware vitals appear in your **Status Bar** automatically — no config needed!

---

## ✨ Full Feature List

### 🏆 System Health Score
A live animated **ring gauge (0–100)** that aggregates CPU, RAM, temperature, and GPU into one instant health number — color-coded green (Healthy) → yellow (Moderate) → orange (Stressed) → red (Critical). The fastest way to know if your machine is struggling.

### 📈 Session Peak Tracker
A compact strip showing the **highest CPU%, RAM%, Temperature, and GPU%** recorded since VS Code opened. Each new peak flashes to highlight it. Use the ↺ Reset button to benchmark builds and compare runs.

### 📊 Live Hardware Dashboard
A premium dark-themed sidebar panel with animated real-time charts:
- **CPU monitor** — usage %, clock speed (GHz), per-core breakdown chart
- **RAM monitor** — usage %, used/total GB, free GB indicator
- **GPU monitor** — usage %, VRAM used/total GB
- **Temperature sensor** — smart color-coded (🟢 safe → 🔴 critical)
- **Disk monitor** — read/write IOPS + free space
- **Network monitor** — live download/upload speed chart
- **Battery monitor** — level & charging status

### 🔴 Status Bar Vitals
Always-visible **hardware health in the VS Code status bar** — color-coded at a glance:
- 🟢 Normal &nbsp;|&nbsp; 🟡 Warning &nbsp;|&nbsp; 🔴 Critical

### ⚡ Smart Anomaly Detection
Fires **intelligent, actionable notifications** when:
- CPU > 80% sustained
- RAM > 85% used
- CPU temperature > 80°C
- GPU temperature > 85°C
- Battery < 15% and not charging

### 🧊 Lite Mode — Auto Performance Optimizer
When sustained stress is detected, DevSense automatically activates **Lite Mode** — suspending heavy extensions to free up resources. Auto-disables when stress resolves.

### 📋 Process Manager (VS Code Task Manager)
View **top CPU-consuming processes** directly inside VS Code. One click to terminate any runaway process — no need to open your OS task manager.

### 🔗 Git Spike Correlation
Every hardware spike is linked to your **current git commit** — trace **performance regressions directly to code changes**. Copy commit hash in one click 📋.

---

## 🆚 DevSense vs Other Tools

| Feature | DevSense | OS Task Manager | htop / btop |
|---------|----------|----------------|-------------|
| Inside VS Code | ✅ | ❌ | ❌ |
| Real-time charts (60s history) | ✅ | ❌ | ✅ |
| System Health Score | ✅ | ❌ | ❌ |
| Session Peak Tracker | ✅ | ❌ | ❌ |
| Git Spike Correlation | ✅ | ❌ | ❌ |
| Smart anomaly alerts | ✅ | ❌ | ❌ |
| Auto Lite Mode (resource saver) | ✅ | ❌ | ❌ |
| Status bar vitals | ✅ | ❌ | ❌ |
| VSCodium / Gitpod support | ✅ | N/A | N/A |

---

## 🎯 Use Cases for Developers

- **Web Developers**: Monitor CPU & RAM during Webpack/Vite builds in real-time
- **Backend Developers**: Track memory usage while debugging Node.js / Python servers
- **DevOps Engineers**: Watch system load during Docker builds and deployments
- **Data Scientists**: Monitor GPU VRAM usage while training ML models in VS Code
- **Game Developers**: Track GPU core usage and temperature during shader compilation
- **Mobile Developers**: Detect thermal throttling during Android/iOS simulator runs

---

## ⚙️ Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `devsense.updateInterval` | `2000` | Polling interval in ms (min 500) |
| `devsense.cpuWarningThreshold` | `80` | CPU % warning threshold |
| `devsense.ramWarningThreshold` | `85` | RAM % warning threshold |
| `devsense.tempWarningThreshold` | `80` | Temperature °C warning threshold |
| `devsense.liteModeAutoTrigger` | `true` | Auto-enable Lite Mode under stress |
| `devsense.showStatusBar` | `true` | Show hardware vitals in status bar |
| `devsense.enableNotifications` | `true` | Enable smart hardware notifications |

---

## 💻 Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| `DevSense: Open Hardware Dashboard` | Activity Bar ⚡ | Open the live dashboard |
| `DevSense: Toggle Lite Mode` | Dashboard header 🧊 | Toggle Lite Mode on/off |
| `DevSense: Open Process Manager` | Processes tab | View & kill processes |
| `DevSense: Refresh Hardware Data` | Dashboard header ↻ | Force a hardware refresh |

---

## ❓ Frequently Asked Questions

**Q: Does DevSense slow down VS Code?**
A: No. DevSense polls hardware data every 2 seconds (configurable) and uses minimal CPU. Lite Mode can automatically suspend heavy extensions when your system is under stress.

**Q: How is DevSense different from a VS Code resource usage extension?**
A: DevSense goes far beyond showing CPU% in a status bar. It provides full real-time history charts, a system health score, session peak tracking, process manager, anomaly alerts, and Git spike correlation — all in one integrated dashboard.

**Q: Does it work on VSCodium, Gitpod, or Eclipse Theia?**
A: Yes! DevSense is published on **Open VSX** and works natively on VSCodium, Gitpod, Eclipse Theia, and VS Code.

**Q: Does DevSense support GPU monitoring?**
A: Yes — if your system has an active GPU, DevSense automatically shows GPU usage %, VRAM usage, and a 60-second GPU history chart.

**Q: Can I see which process is using the most CPU inside VS Code?**
A: Yes! Open the **Process Manager** tab to view all running processes sorted by CPU usage. Kill any runaway process with one click.

**Q: How does Git Spike Correlation work?**
A: When a hardware anomaly is detected (CPU > 80%, RAM > 85%, or temperature > 80°C), DevSense records the current git commit hash, branch, and commit message — so you can trace performance issues to exact code changes.

---

## 🌍 Platform Support

| Platform | Status |
|----------|--------|
| ✅ Windows 10/11 | Fully supported |
| ✅ macOS 12+ | Fully supported |
| ✅ Linux (Ubuntu, Fedora, Arch) | Fully supported |

---

## 🔌 Compatible Editors

DevSense is natively available on **Open VSX** — no manual `.vsix` installation needed:

| Editor | Install Method |
|--------|---------------|
| **VS Code** | Open VSX or direct `.vsix` install |
| **VSCodium** | Extensions panel → search `DevSense` |
| **Gitpod** | Open VSX auto-sync |
| **Eclipse Theia** | Extensions panel → search `DevSense` |

---

## 📄 License

MIT © DevSense Team — [Open VSX Page](https://open-vsx.org/extension/devsense-team/devsense) | [GitHub](https://github.com/kushal203/devsense)
