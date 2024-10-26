const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const isDev = require('electron-is-dev');
const yaml = require('js-yaml');
const { fileURLToPath } = require('url');



function createWindow() {
  console.log('Creating window...');
  const preloadPath = path.join(__dirname, 'preload.js');
  console.log('Preload script path:', preloadPath);

  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath
    }
  });

  if (isDev) {
    console.log('Loading development URL');
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    console.log('Loading production build');
    win.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
  }

  win.webContents.on('did-finish-load', () => {
    console.log('Window finished loading');
  });
}

app.whenReady().then(() => {
  console.log('App is ready');
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
// Function to get Hyperledger version
function getHyperledgerVersion() {
  return new Promise((resolve, reject) => {
    exec('peer version', (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
      } else if (stderr) {
        reject(`Error: ${stderr}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

ipcMain.handle('get-hyperledger-version', async () => {
  try {
    const version = await getHyperledgerVersion();
    return { success: true, version };
  } catch (error) {
    return { success: false, message: error };
  }
});

// Function to get ledger info
function getLedgerInfo() {
  return new Promise((resolve, reject) => {
    exec('peer channel getinfo -c mychannel', (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
      } else if (stderr) {
        reject(`Error: ${stderr}`);
      } else {
        const info = JSON.parse(stdout);
        resolve(info);
      }
    });
  });
}

// Handle IPC request from renderer
ipcMain.handle('get-ledger-info', async () => {
  try {
    const ledgerInfo = await getLedgerInfo();
    return { success: true, ledgerInfo };
  } catch (error) {
    return { success: false, message: error };
  }
});

// Handle folder and YAML file creation
ipcMain.handle('create-folder', async (event, { folderName, parentDir, organizations }) => {
  console.log('Received create-folder request:', folderName, 'in', parentDir);
  const folderPath = path.join(parentDir, folderName);
  
  try {
    // Step 1: Create the folder
    await fs.mkdir(folderPath);
    console.log('Folder created successfully');

    // Step 2: Generate the YAML files
    await generateYAMLFiles(folderPath, organizations);

    
    return {
      success: true,
      message: `Folder "${folderName}" and YAML files created successfully.`,
      details: {
        path: folderPath,
        parentDir: parentDir
      }
    };
  } catch (error) {
    console.error('Error creating folder or files:', error);
    return {
      success: false,
      message: `Error creating folder or files: ${error.message}`,
      details: {
        errorCode: error.code,
        errorStack: error.stack,
        parentDir: parentDir
      }
    };
  }
});


// Function to generate YAML files based on user input
async function generateYAMLFiles(directory, organizations) {
  try {
    // 1. Generate configtx.yaml
    const configtx = {
      Organizations: organizations.map((org) => ({
        Name: org.name,
        ID: `${org.mspID}`,
        MSPDir: `crypto-config/peerOrganizations/${org.domain}/msp`,
        Policies: {
          Readers: { Type: 'Signature', Rule: `OR('${org.mspID}.member')` },
          Writers: { Type: 'Signature', Rule: `OR('${org.mspID}.member')` },
          Admins: { Type: 'Signature', Rule: `OR('${org.mspID}.admin')` },
        }
      }))
    };
    const configtxFilePath = path.join(directory, 'configtx.yaml');
    await fs.writeFile(configtxFilePath, yaml.dump(configtx));

    // 2. Generate docker-compose.yaml
    const services = {};
    organizations.forEach((org) => {
      const peerName = `peer0.${org.domain}`;
      services[peerName] = {
        container_name: peerName,
        image: 'hyperledger/fabric-peer',
        environment: [
          `CORE_PEER_ID=${peerName}`,
          `CORE_PEER_ADDRESS=${peerName}:7051`,
          `CORE_PEER_LOCALMSPID=${org.mspID}`,
          "CORE_PEER_TLS_ENABLED=true"
        ],
        ports: ["7051:7051"],
        networks: ['byfn']
      };
    });
    const dockerComposeFilePath = path.join(directory, 'docker-compose.yaml');
    await fs.writeFile(dockerComposeFilePath, yaml.dump({ services }));

    // 3. Generate crypto-config.yaml
    const cryptoConfig = {
      PeerOrgs: organizations.map((org) => ({
        Name: org.name,
        Domain: org.domain,
        Template: { Count: 1 },
        Users: { Count: 1 }
      }))
    };
    const cryptoConfigFilePath = path.join(directory, 'crypto-config.yaml');
    await fs.writeFile(cryptoConfigFilePath, yaml.dump(cryptoConfig));

    console.log('YAML files created successfully in', directory);
  } catch (error) {
    console.error('Error creating YAML files:', error);
    throw error;
  }
}



ipcMain.handle('open-directory-dialog', async (event) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  
  if (result.canceled) {
    return { canceled: true };
  } else {
    return { canceled: false, filePath: result.filePaths[0] };
  }
});

// Change ES `export` to CommonJS `module.exports`
module.exports = { createWindow };
