import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  convertPdfToMusicXml: (fileData: ArrayBuffer, fileName: string) =>
    ipcRenderer.invoke('convert-pdf-to-musicxml', fileData, fileName),
  showOpenDialog: (options: any) =>
    ipcRenderer.invoke('show-open-dialog', options),
});
