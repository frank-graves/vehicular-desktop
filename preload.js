const { contextBridge, ipcRenderer } = require('electron');

// Exponemos una API segura al frontend
contextBridge.exposeInMainWorld('desktopAPI', {
    saveToken: (token) => ipcRenderer.invoke('save-token', token),
    hasToken: () => ipcRenderer.invoke('has-token'),
    consultarTodo: (placa, dni) => ipcRenderer.invoke('consultar-todo', placa, dni),
    getHistorial: () => ipcRenderer.invoke('get-historial')
});
