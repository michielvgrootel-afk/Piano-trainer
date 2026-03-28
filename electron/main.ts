import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { join, basename } from 'path';
import { execFile, ChildProcess } from 'child_process';
import { existsSync, readFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';

let mainWindow: BrowserWindow | null = null;
let activeOmrProcess: ChildProcess | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'Piano Trainer',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ===== Auto-Updater =====
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-downloaded', () => {
  if (!mainWindow) return;
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: 'Update downloaded. The app will restart to install it.',
    buttons: ['Restart Now', 'Later'],
    defaultId: 0,
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  console.error('Auto-updater error:', err);
});

app.whenReady().then(() => {
  createWindow();
  // Check for updates after a short delay (skip in dev)
  if (!process.env.VITE_DEV_SERVER_URL) {
    setTimeout(() => autoUpdater.checkForUpdates(), 3000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ===== IPC Handlers =====

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

/**
 * OMR Bridge: Convert PDF/image to MusicXML using Audiveris.
 *
 * Expects Audiveris to be available either:
 * 1. Bundled in resources/audiveris/ with a portable JRE in resources/jre/
 * 2. Installed on the system PATH as 'audiveris'
 *
 * Returns the MusicXML content as a string.
 */
ipcMain.handle('convert-pdf-to-musicxml', async (_event, fileData: ArrayBuffer, fileName: string): Promise<string> => {
  // Create temp directory for this conversion
  const tempDir = join(tmpdir(), `piano-trainer-omr-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });

  // Write the input file to temp
  const inputPath = join(tempDir, fileName);
  const fs = await import('fs/promises');
  await fs.writeFile(inputPath, Buffer.from(fileData));

  // Try to find Audiveris
  const appPath = app.getAppPath();
  const bundledJar = join(appPath, 'resources', 'audiveris', 'Audiveris.jar');
  const bundledJre = join(appPath, 'resources', 'jre', 'bin', process.platform === 'win32' ? 'java.exe' : 'java');

  let javaPath: string;
  let audiverisArgs: string[];

  if (existsSync(bundledJar) && existsSync(bundledJre)) {
    // Use bundled Audiveris + JRE
    javaPath = bundledJre;
    audiverisArgs = ['-jar', bundledJar, '-batch', '-export', '-output', tempDir, inputPath];
  } else {
    // Try system-installed Audiveris via Java
    javaPath = 'java';

    // Check if Audiveris jar exists in common locations
    const commonPaths = [
      join(app.getPath('home'), 'Audiveris', 'Audiveris.jar'),
      join(app.getPath('home'), '.local', 'share', 'audiveris', 'Audiveris.jar'),
      'C:\\Program Files\\Audiveris\\Audiveris.jar',
      'C:\\Program Files (x86)\\Audiveris\\Audiveris.jar',
    ];

    const foundJar = commonPaths.find((p) => existsSync(p));
    if (foundJar) {
      audiverisArgs = ['-jar', foundJar, '-batch', '-export', '-output', tempDir, inputPath];
    } else {
      // Last resort: try 'audiveris' command directly
      javaPath = 'audiveris';
      audiverisArgs = ['-batch', '-export', '-output', tempDir, inputPath];
    }
  }

  return new Promise((resolve, reject) => {
    // Kill any previous OMR process
    if (activeOmrProcess) {
      activeOmrProcess.kill();
      activeOmrProcess = null;
    }

    activeOmrProcess = execFile(javaPath, audiverisArgs, {
      timeout: 120000, // 2 minute timeout
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
    }, async (error, stdout, stderr) => {
      activeOmrProcess = null;

      if (error) {
        // Clean up temp dir
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

        if (error.message.includes('ENOENT')) {
          reject(new Error(
            'Audiveris not found. Please install Audiveris and Java, or place Audiveris.jar in the resources/audiveris/ directory.'
          ));
        } else {
          reject(new Error(`OMR conversion failed: ${stderr || error.message}`));
        }
        return;
      }

      // Find the output MusicXML file
      try {
        const files = await fs.readdir(tempDir);
        const mxlFile = files.find((f) => f.endsWith('.mxl') || f.endsWith('.musicxml') || f.endsWith('.xml'));

        if (!mxlFile) {
          await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
          reject(new Error('Audiveris did not produce a MusicXML output file.'));
          return;
        }

        const outputPath = join(tempDir, mxlFile);
        const content = await fs.readFile(outputPath, 'utf-8');

        // Clean up
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});

        resolve(content);
      } catch (readError) {
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        reject(new Error(`Failed to read OMR output: ${readError}`));
      }
    });
  });
});

/**
 * Show a native file open dialog.
 */
ipcMain.handle('show-open-dialog', async (_event, options: Electron.OpenDialogOptions) => {
  if (!mainWindow) return { canceled: true, filePaths: [] };
  return dialog.showOpenDialog(mainWindow, options);
});
