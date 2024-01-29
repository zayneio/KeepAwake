const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startTimer: (args) => ipcRenderer.send('start-timer', args),
  stopTimer: () => ipcRenderer.send('stop-timer'),
  addTime: (args) => ipcRenderer.send('add-time', args),
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
});
