const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./src/db');
const cryptoStore = require('./src/crypto');
const api = require('./src/api');

function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 760,
        backgroundColor: '#121214',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    win.setMenuBarVisibility(false); // Ocultar menú superior para parecer nativo
    win.loadFile('frontend/index.html');
}

app.whenReady().then(async () => {
    await db.init();

    // Configurar los escuchadores IPC (puente entre el Frontend y el Backend Node)
    ipcMain.handle('save-token', (event, token) => {
        cryptoStore.setToken(token);
        return true;
    });

    ipcMain.handle('has-token', () => {
        return cryptoStore.hasToken();
    });

    ipcMain.handle('consultar-todo', async (event, placa, dni) => {
        return await api.consultarTodo(placa, dni);
    });

    ipcMain.handle('get-historial', () => {
        return db.getHistorial();
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
