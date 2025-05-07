import { app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ipcMain } from "electron";
import si from "systeminformation";
import os from "os";
import fs from "fs";
const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// >> get system stats
ipcMain.handle("get-system-stats", async () => {
  const cpu = await si.currentLoad();
  const mem = await si.mem();

  return {
    cpuUsage: cpu.currentLoad,
    totalMem: mem.total,
    usedMem: mem.used,
  };
});

// >> get disk info
ipcMain.handle("get-disk-info", async () => {
  try {
    const data = await si.fsSize();
    const root = data[0];
    return {
      total: root.size,
      used: root.used,
      available: root.size - root.used,
      mount: root.mount,
    };
  } catch (err) {
    console.error("Disk info failed:", err);
    return { error: true };
  }
});
ipcMain.handle("get-folder-file-counts", async () => {
  const baseDir = path.join(os.homedir());
  const folders = ["Downloads", "Documents", "Pictures", "Music"];

  const counts = {};
  for (const folder of folders) {
    const fullPath = path.join(baseDir, folder);
    try {
      const files = fs.readdirSync(fullPath, { withFileTypes: true });
      counts[folder] = files.filter((f) => f.isFile()).length;
    } catch (error) {
      counts[folder] = 0;
    }
  }
  return counts;
});
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
