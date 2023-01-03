const {app, BrowserWindow} = require('electron');

function creatMainWindow(){
    const mainWindow = new BrowserWindow({
        title: "ImageShrink",
        width: 500,
        height: 600,
    });
}

app.on('ready', creatMainWindow)