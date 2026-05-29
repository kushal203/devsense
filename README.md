# ⚡ DevSense — Hardware Intelligence for VS Code

> **Real-time hardware monitoring built into your IDE. Nothing like this exists.**

DevSense transforms VS Code into a hardware-aware development environment. It monitors your machine's CPU, RAM, GPU, temperature, disk, and network in real-time — and intelligently adapts your workflow when your system is under stress.

---

## ✨ Features

### 📊 Live Hardware Dashboard
A premium dark-themed sidebar panel with real-time charts for:
- CPU usage with per-core breakdown
- RAM usage and availability
- GPU usage and temperature
- CPU temperature
- Disk read/write speeds
- Network download/upload speeds
- Battery level and charging status

### 🔴 Status Bar Vitals
Always-visible hardware health in VS Code's status bar — color-coded:
- 🟢 Normal  |  🟡 Warning  |  🔴 Critical

### ⚡ Smart Anomaly Detection
DevSense monitors thresholds and fires **intelligent, actionable notifications** when:
- CPU > 80% sustained
- RAM > 85% used
- CPU temperature > 80°C
- GPU temperature > 85°C
- Battery < 15% and not charging

### 🧊 Lite Mode
When your system is under sustained stress (3+ consecutive high readings), DevSense automatically activates **Lite Mode** — suspending heavy extensions to free up resources. Auto-disables when stress resolves.

### 📋 Process Manager
View the **top CPU-consuming processes** on your machine directly in VS Code. One click to kill any process.

### 🔗 Git Spike Correlation
Every hardware spike is recorded and linked to your **current git commit** — so you can trace performance regressions directly to code changes.

---

## 🚀 Getting Started

1. Install DevSense from the VS Code Marketplace
2. The ⚡ icon appears in the Activity Bar
3. Click it to open the Hardware Dashboard
4. Hardware metrics appear in the Status Bar immediately

---

## ⚙️ Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `devsense.updateInterval` | `2000` | Polling interval in ms |
| `devsense.cpuWarningThreshold` | `80` | CPU % warning threshold |
| `devsense.ramWarningThreshold` | `85` | RAM % warning threshold |
| `devsense.tempWarningThreshold` | `80` | Temperature °C warning threshold |
| `devsense.liteModeAutoTrigger` | `true` | Auto-enable Lite Mode under stress |
| `devsense.showStatusBar` | `true` | Show status bar vitals |
| `devsense.enableNotifications` | `true` | Enable smart notifications |

---

## 💻 Commands

| Command | Description |
|---------|-------------|
| `DevSense: Open Hardware Dashboard` | Open the dashboard panel |
| `DevSense: Toggle Lite Mode` | Toggle Lite Mode on/off |
| `DevSense: Open Process Manager` | View and kill processes |
| `DevSense: Refresh Hardware Data` | Force a hardware refresh |

---

## 🌍 Platform Support

✅ **Windows** | ✅ **macOS** | ✅ **Linux**

---

## 📄 License

MIT © DevSense Team
