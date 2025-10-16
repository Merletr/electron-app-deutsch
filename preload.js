const { contextBridge, ipcRenderer } = require('electron');
const path = require("path");
const fs = require("fs");

console.log('Preload script starting...');

try {
  contextBridge.exposeInMainWorld('electron', {
    lockApp: () => ipcRenderer.invoke("lock-app"),
    // Resolve correct path whether running from asar or unpacked
    resolveAssetPath: (relPath) => {
      console.log('Resolving asset path for:', relPath);
      try {
        // In production, process.resourcesPath points to the packaged resources folder
        const prodPath = path.join(process.resourcesPath, "assets", relPath);
        console.log('Checking production path:', prodPath);
        
        if (fs.existsSync(prodPath)) {
          const result = `file://${prodPath}`;
          console.log('Using production path:', result);
          return result;
        }
        
        // Fallback for dev mode (relative to project root)
        const devPath = path.join(__dirname, "assets", relPath);
        console.log('Checking dev path:', devPath);
        
        if (fs.existsSync(devPath)) {
          const result = `file://${devPath}`;
          console.log('Using dev path:', result);
          return result;
        }
        
        // If neither exists, try relative to app directory
        const appPath = path.join(process.cwd(), "assets", relPath);
        console.log('Checking app path:', appPath);
        
        const result = `file://${appPath}`;
        console.log('Using app path (fallback):', result);
        return result;
        
      } catch (error) {
        console.error('Error resolving asset path:', error);
        // Return a fallback path
        return `file://${path.join(__dirname, "assets", relPath)}`;
      }
    },
    
    // save data
    saveData: (data) => {
      console.log('saveData called with:', data);
      return ipcRenderer.invoke('save-data', data);
    },
    
    saveTestResults: (results) => {
      console.log('saveTestResults called with', results.length, 'results');
      return ipcRenderer.invoke('save-test-results', results);
    }
  });
  
  console.log('Preload script completed successfully - electron APIs exposed');
  
} catch (error) {
  console.error('Error in preload script:', error);
}