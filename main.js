const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const userDataPath = app.getPath("userData");
const usedFlag = path.join(userDataPath, "used.flag");
console.log("UserData path:", userDataPath);
console.log("Used flag path:", usedFlag);

// check on startup
if (fs.existsSync(usedFlag)) {
  app.on("ready", () => {
    const { dialog } = require("electron");
    dialog.showErrorBox("Fehler", "Du kannst an dieser Studie nur einmal teilnehmen.");
    app.quit();
  });
}

console.log('Main process starting...');
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());

const createWindow = () => {
  console.log('Creating window...');

  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload script path:', preloadPath);
  console.log('Preload script exists:', fs.existsSync(preloadPath));

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: false,
      preload: preloadPath
    }
  });

  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }

  const indexPath = path.join(__dirname, 'index.html');
  console.log('Loading HTML from:', indexPath);
  console.log('HTML file exists:', fs.existsSync(indexPath));

  win.loadFile('index.html');

  win.webContents.on('did-finish-load', () => {
    console.log('Web contents finished loading');
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });
};

const nodemailer = require("nodemailer");

// configure your mail transporter
const transporter = nodemailer.createTransport({
  host: "securesmtp.t-online.de",
  port: 587,
  secure: false,
  auth: {
    user: "lansey74@t-online.de",
    pass: "Elan1974!" // App Password for T-Online
  },
  tls: {
    rejectUnauthorized: false
  }
});


app.whenReady().then(() => {
  console.log('App is ready, creating window...');
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') app.quit();
});

/**
 * Save test results (reaction times + questionnaire data)
 */
ipcMain.handle('save-test-results', async (event, results) => {
  try {
    // Extend header to include questionnaire fields + test details
    const header =
      'Code;Bereich;Alter;Jahre;Position;AktuelleLiga;StarterJetzt;HoechsteLiga;StarterDamals;StundenProWoche;Schauhaeufigkeit;VideoPath;UserChoice;ReactionTime\n';

    const rows = results
      .map(
        (r) =>
          `${r.code};${r.bereich};${r.age};${r.years};${r.position};${r.currentLeague};${r.starterNow};${r.highestLeague};${r.starterPast};${r.hours};${r.watchFrequency};${r.videoPath};${r.userChoice};${r.userTime.toFixed(
            3
          )}`
      )
      .join('\n') + '\n';
    
    const mailOptions = {
      from: '"Study App" <maik01.trautmann@t-online.de>',
      to: "maik01.trautmann@t-online.de",
      subject: `Study Results from ${results[0].code}`,
      text: "See attached CSV for results.",
      attachments: [
        {
          filename: `${results[0].code}.csv`,
          content: header + rows
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    console.log("Results sent via email ✅");

    // lock app after successful send
    const userDataPath = app.getPath("userData");
    const usedFlag = path.join(userDataPath, "used.flag");
    fs.writeFileSync(usedFlag, "used");

    return { success: true, message: 'Test results saved successfully.' };
  } catch (err) {
    console.error('Error saving test results:', err);
    return { success: false, message: 'Error saving test results: ' + err.message };
  }
});
