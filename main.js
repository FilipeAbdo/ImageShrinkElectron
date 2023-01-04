const path = require('path')
const os = require('os')
const {app, BrowserWindow, Menu, ipcMain, shell} = require('electron');
const imagemin = require('imagemin');
const imageminJpegPlugin = require('imagemin-mozjpeg');
const imageminPngPlugin = require('imagemin-pngquant')
const slash = require('slash');
const log = require('electron-log');

process.env.NODE_ENV = 'production'

const isDev = (process.env.NODE_ENV !== 'production')? true:false;
const isMac = process.platform === 'darwin'? true:false;

let mainWindow;
let aboutWindow;

function creatMainWindow(){
    mainWindow = new BrowserWindow({
        title: "ImageShrink",
        width: 415,
        height: 640,
        icon: './assets/icons/Icon_256x256.png',
        resizable: isDev? true:false,
        alwaysOnTop: isDev? true:false,
        frame: true,
        minWidth: 415,
        minHeight: 640,
        backgroundColor: 'gainsboro',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    if(isDev === true){
        mainWindow.setPosition(3107,496, false)
        mainWindow.maximize();
        mainWindow.openDevTools();        
    }else{
        mainWindow.setMaximumSize(mainWindow.getBounds().width + 10, mainWindow.getBounds().height + 30)
    }

    mainWindow.loadFile('./app/index.html')
    mainWindow.setAlwaysOnTop(true)
    mainWindow.on('ready-to-show', () =>{
        mainWindow.setAlwaysOnTop(false)
        mainWindow.show()
    })
}

function creatAboutWindow(){
    aboutWindow = new BrowserWindow({
        title: "ImageShrink",
        width: 300,
        height: 210,
        icon: './assets/icons/Icon_256x256.png',
        resizable: isDev? true:false,
        backgroundColor: '#363636',
    });

    aboutWindow.loadFile('./app/about.html')
    aboutWindow.setMenuBarVisibility(false)
}

app.on('ready', () => {
    creatMainWindow()

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on('closed', ()=>{mainWindow = null})
})

const menu = [
    ...(isMac===true? [{
            label: app.name,
            submenu: [
                {
                    label: 'About',
                    click: creatAboutWindow,
                }
            ]
        }] : []),
    {
        role: 'fileMenu',
    },
    ...(isDev===true? [
        {
            label: 'Developer',
            submenu: [
                { role:  'reload'},
                { role:  'forcereload'},
                { type:  'separator'},
                { role:  'toggledevtools'},
            ]
        }
    ]:[]),
    ...(isMac == false ?
        [
            {
            label: "Help",
            submenu:[
                {
                    label: "About",
                    click: creatAboutWindow,
                }
            ]
        }]: []),
]

ipcMain.on('image:minimize', (e, options) => {
    options.dest = path.join(os.homedir(), 'imageShrink')
    if(isDev === true) console.log(options)
    shrinkImage(options)
});

async function shrinkImage({ imgPath, quality, dest, openFolder }){
    try{
        const pngQuality = quality/100;
        const files = await imagemin([slash(imgPath)], {
            destination: dest,
            plugins: [
                imageminJpegPlugin({quality: quality}),
                imageminPngPlugin({
                    quality: [pngQuality, pngQuality]
                }),
            ]
        })
        log.info(files)
        if(isDev === true) console.log(files)
        if(openFolder === true) shell.openPath(dest)

        mainWindow.webContents.send('image:done')
    } catch(err){
        console.log(err)
        log.error(err)
    }
}

app.on('win-all-closed', () => {
    if (isMac === false){
        app.quit();
    }
});

log.transports.file.resolvePath = () => path.join(__dirname, 'logs/main.log');

app.on('activate', () => {
    if(BrowserWindow.getAllWindows().length === 0){
        creatMainWindow();
    }
})