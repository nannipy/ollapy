console.log("--- MAIN.JS IS EXECUTING ---");

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process'); // Importa exec
const os = require('os'); // Importa il modulo os

let flaskProcess = null;
let mainWindow = null; // Riferimento alla finestra principale
let flaskReady = false; // Flag per indicare se Flask è pronto
let previousCpuInfo = os.cpus().map(cpu => cpu.times); // Inizializza con i tempi CPU attuali

function createWindow() {
  if (mainWindow) {
    return; // Evita di creare più finestre
  }
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    icon: path.join(__dirname, 'ollapy.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
    });

    if (os.platform() === 'darwin') {
      app.dock.setIcon(path.join(__dirname, 'ollapy-icon.png'));
    }


    mainWindow.loadURL('http://localhost:8001');

    // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Invia l'utilizzo di CPU e RAM al renderer ogni secondo
  setInterval(async () => { // Rendi la funzione async
    const currentCpuInfo = os.cpus().map(cpu => cpu.times);
    let totalIdle = 0;
    let totalTick = 0;

    for (let i = 0; i < currentCpuInfo.length; i++) {
      const idleDifference = currentCpuInfo[i].idle - previousCpuInfo[i].idle;
      const totalDifference = Object.values(currentCpuInfo[i]).reduce((acc, val) => acc + val, 0) - Object.values(previousCpuInfo[i]).reduce((acc, val) => acc + val, 0);

      totalIdle += idleDifference;
      totalTick += totalDifference;
    }

    const cpuUsage = 100 - (100 * totalIdle / totalTick);
    previousCpuInfo = currentCpuInfo; // Aggiorna per il prossimo ciclo


    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('system-info', {
        cpu: cpuUsage.toFixed(2)
      });
    }
  }, 1000);
}

app.whenReady().then(() => {
  const pythonPath = process.env.PYTHON_PATH || 'python3';
  const serverScriptPath = path.join(__dirname, 'server.py');

  // Check if Flask is installed
  const checkFlaskProcess = spawn(pythonPath, ['-c', 'import flask']);
  checkFlaskProcess.on('close', (code) => {
    if (code !== 0) {
      console.error(`Flask is not installed for ${pythonPath}. Please install it using: ${pythonPath} -m pip install Flask`);
      // Optionally, you can show an Electron dialog here to inform the user
      // dialog.showErrorBox('Flask Not Found', `Flask is not installed for ${pythonPath}. Please install it using: ${pythonPath} -m pip install Flask`);
      return;
    }

    console.log(`Attempting to spawn Flask server: ${pythonPath} ${serverScriptPath}`);
    flaskProcess = spawn(pythonPath, [serverScriptPath], {
      cwd: __dirname // Set the current working directory to the app's root
    });

    flaskProcess.stdout.on('data', (data) => {
      console.log(`Flask stdout: ${data}`);
    });

    flaskProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.error(`Flask stderr: ${output}`);
      if (!flaskReady && output.includes('* Running on http://127.0.0.1:8001')) {
        flaskReady = true;
        createWindow(); // Crea la finestra solo quando Flask è pronto
      }
    });

    flaskProcess.on('close', (code) => {
      console.log(`Flask process exited with code ${code}`);
      if (mainWindow) {
        mainWindow.destroy(); // Chiudi la finestra se Flask si chiude
        mainWindow = null;
      }
    });

    flaskProcess.on('error', (err) => {
      console.error(`Failed to start Flask process: ${err}`);
    });
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && flaskReady) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  // Kill the Flask process when the app closes
  if (flaskProcess) {
    flaskProcess.kill();
  }
});