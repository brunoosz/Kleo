'use strict'

const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld(
  'kleoNativo',
  Object.freeze({
    plataforma: 'electron',
    sistema: process.platform,
    mostrarJanela: () => ipcRenderer.send('kleo:mostrar-janela'),
    selo: n => ipcRenderer.send('kleo:selo', Math.max(0, Math.min(999, Math.floor(Number(n) || 0)))),
  }),
)
