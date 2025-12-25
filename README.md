# 📝 Context Notes

**Context Notes** is a lightweight, privacy-focused Chrome extension that lets you attach sticky notes to specific web pages or entire websites. Never forget why you bookmarked a page or where you left off.

<p align="center">
  <img src="icon.png" alt="Context Notes Logo" width="128"/>
</p>

## ✨ Features

- **🎯 Context-Aware**: 
  - **Page Scope**: Attach notes to a specific URL (e.g., a specific article).
  - **Site Scope**: Attach notes to an entire domain (e.g., reminders for `github.com`).
- **✍️ Rich Text Editor**: Format your notes with **Bold**, *Italics*, Underline, and Lists (Bullet/Numbered).
- **💾 Auto-Save**: No need to click save. Your notes are saved automatically as you type.
- **🌑 Dark Mode Support**: Seamlessly adapts to your system's color theme.
- **👀 Live Indicator**: A subtle floating icon (📝) appears on pages where you have saved notes, so you never miss them.
- **🗂️ Note Manager**: View, manage, and navigate to all your saved notes from a single "All Notes" view.
- **🔒 Privacy First**: All data is stored locally in your browser (`chrome.storage.local`). No cloud sync, no tracking, no data leaves your device.

## 🚀 Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked**.
5. Select the folder containing these files.
6. Pin the **Context Notes** icon to your toolbar for easy access!

## 📖 Usage

1. **Open the Extension**: Click the Context Notes icon on any webpage.
2. **Choose Scope**:
   - Select **This Page** for notes specific to the current URL.
   - Select **Entire Site** for notes relevant to the whole domain.
3. **Write & Format**: Use the toolbar to format your text.
4. **Relax**: Your notes are saved automatically.
5. **Check All Notes**: Click the menu button (☰) in the popup to see a list of all your saved notes.

## 🛠️ Tech Stack

- **Manifest V3**: Compliant with the latest Chrome Extension standards.
- **Vanilla JS**: Lightweight, fast, and dependency-free.
- **Chrome Storage API**: For secure local data persistence.

## 📄 Privacy

**Context Notes** respects your privacy.
- We do **not** collect, store, or transmit your data to any external servers.
- All notes are stored exclusively on your local machine using the browser's storage capabilities.

## 📝 License

This project is licensed under the MIT License.
