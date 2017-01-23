const {app, dialog, BrowserWindow, Menu, session} = require('electron')
const path = require('path')
const url = require('url')
var electronify = require('electronify-server');
electronify({
  command: 'node',
  options: {},
  url: 'http://127.0.0.1:8080/content/welcome.html',
  debug: true,
  window: {
  height: 768, 
  width: 1024, 
  'title-bar-style': 'default', 
  frame: true,       
  icon: 'favicon.ico',
      "node-integration": "iframe",
	    "closable" : true,
		"web-preferences": {
       "web-security": false }},
  ready: function(app){
    // application event listeners could be added here
	session.defaultSession.clearCache(function(){});
  },
  preLoad: function(app, window){
    // window event listeners could be added here

  },
  postLoad: function(app, window, error){
    // Error only exists if there was an error while loading
    // error == {
    //   event: event,
    //   errorCode: errorCode,
    //   errorDescription: errorDescription,
    //   validatedURL: validatedURL,
    //   isMainFrame: isMainFrame
    // }
    if (error) {
      console.log(error.errorCode, error.errorDescription, error.validatedURL);
    }

    // url finished loading
  },
  showDevTools: false
}).on('child-started', function(child) {
  // child process has started
  console.log('PID: ' + child.pid);

  // setup logging on child process
  child.stdout.on('data', console.log);
  child.stderr.on('data', console.log);

}).on('child-closed', function(app, stderr, stdout) {
  // the child process has finished

}).on('child-error', function(err, app) {
  // close electron if the child crashes
  app.quit();
});
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
//let win
//var page_title = ""
//function createWindow () {
//  // Create the browser window.
//  win = new BrowserWindow({
//      width: 1024,
//      height: 786,
//      icon: 'favicon.ico',
//      "node-integration": "iframe",
//	    "closable" : true,
//	  //frame: false,
//    //  "web-preferences": {
//    //    "web-security": false }
//    })
//  // and load the index.html of the app.
//  win.loadURL(url.format({
//    pathname: path.join(__dirname, 'content/index.html'),
//    protocol: 'file:',
//    slashes: true
//  }))
//
//
//  // Emitted when the window is closed.
//  win.on('closed', () => {
//    // Dereference the window object, usually you would store windows
//    // in an array if your app supports multi windows, this is the time
//    // when you should delete the corresponding element.
//	win.destroy()
//    win = null
//  })
//  win.on('before-quit', () => {
//	app.exit(0)
//  })
//  // title_str will give me page title. ex. "Pencil Code", "Pencil Code Editor"
//  // useful for deciding wether or not to have load/save enabled
//  win.on('page-title-updated', (e, title_str) => {
//    page_title = title_str
//    console.log(page_title)
//    if (page_title == "Pencil Code Editor")
//    {
//      for (i = 0; i < 3; i++)
//          menu.items[0].submenu.items[i].enabled = true;
//    }
//    else {
//        for (i = 0; i < 3; i++)
//          menu.items[0].submenu.items[i].enabled = false;
//    }
//  })
//}
//
//// This method will be called when Electron has finished
//// initialization and is ready to create browser windows.
//// Some APIs can only be used after this event occurs.
//app.on('ready', createWindow)
//
//// Quit when all windows are closed.
//app.on('window-all-closed', () => {
//  // On macOS it is common for applications and their menu bar
//  // to stay active until the user quits explicitly with Cmd + Q
//  if (process.platform !== 'darwin') {
//    app.quit()
//  }
//})
//app.on('activate', () => {
//  // On macOS it's common to re-create a window in the app when the
//  // dock icon is clicked and there are no other windows open.
//  if (win === null) {
//    createWindow()
//  }
//})
//
//// In this file you can include the rest of your app's specific main process
//// code. You can also put them in separate files and require them here.
////app.commandLine.appendSwitch('disable-web-security');
//app.on('before-quit', () => {
//	app.exit(0)
//})
//
//// creates menu
//const template = [
//  {
//    label: 'File',
//    submenu: [
//      {
//        label: 'New',
//        click (item, focusedWindow) {
//          console.log(focusedWindow.location.href)
//        }
//      },
//      {
//        label: 'Load',
//        click (item, focusedWindow) {
//			console.log(__dirname + '/editor.js')
//			var editor = require(__dirname + '/editor.js')
//			console.log(typeofeditor.this.pencilcode.view.getPaneEditorData("bravo"))
//        }
//      },
//      {
//        label: 'Save',
//        click(item, focusedWindow)  {
//          console.log(focusedWindow.location.href)
//        }
//      },
//      {
//        label: 'Exit',
//        click (item, focusedWindow) {
//          app.exit(0)
//        }
//      }
//    ]
//  },
//  {
//    label: 'Edit',
//    submenu: [
//      {
//        role: 'undo'
//      },
//      {
//        role: 'redo'
//      },
//      {
//        type: 'separator'
//      },
//      {
//        role: 'cut'
//      },
//      {
//        role: 'copy'
//      },
//      {
//        role: 'paste'
//      },
//      {
//        role: 'pasteandmatchstyle'
//      },
//      {
//        role: 'delete'
//      },
//      {
//        role: 'selectall'
//      }
//    ]
//  },
//  {
//    label: 'View',
//    submenu: [
//      {
//        label: 'Reload',
//        accelerator: 'CmdOrCtrl+R',
//        click (item, focusedWindow) {
//          if (focusedWindow) focusedWindow.reload()
//        }
//      },
//      { // TODO: Must remove this, only here for testing purposes
//        label: 'Toggle Developer Tools',
//        accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
//        click (item, focusedWindow) {
//          if (focusedWindow) focusedWindow.webContents.toggleDevTools()
//        }
//      },
//      {
//        type: 'separator'
//      },
//      {
//        role: 'resetzoom'
//      },
//      {
//        role: 'zoomin'
//      },
//      {
//        role: 'zoomout'
//      },
//      {
//        type: 'separator'
//      },
//      {
//        role: 'togglefullscreen'
//      }
//    ]
//  },
//  {
//    role: 'window',
//    submenu: [
//      {
//        role: 'minimize'
//      },
//      {
//        role: 'close'
//      }
//    ]
//  },
//  {
//    role: 'help',
//    submenu: [
//      {
//        // TODO: Add in the pencilcode guide here
//        label: 'Learn More',
//        click () { require('electron').shell.openExternal('http://electron.atom.io') }
//      }
//    ]
//  }
//]
//
//// for Mac
//if (process.platform === 'darwin') {
//  template.unshift({
//    label: app.getName(),
//    submenu: [
//      {
//        role: 'about'
//      },
//      {
//        type: 'separator'
//      },
//      {
//        role: 'services',
//        submenu: []
//      },
//      {
//        type: 'separator'
//      },
//      {
//        role: 'hide'
//      },
//      {
//        role: 'hideothers'
//      },
//      {
//        role: 'unhide'
//      },
//      {
//        type: 'separator'
//      },
//      {
//        role: 'quit'
//      }
//    ]
//  })
//  // Edit menu.
//  template[1].submenu.push(
//    {
//      type: 'separator'
//    },
//    {
//      label: 'Speech',
//      submenu: [
//        {
//          role: 'startspeaking'
//        },
//        {
//          role: 'stopspeaking'
//        }
//      ]
//    }
//  )
//  // Window menu.
//  template[3].submenu = [
//    {
//      label: 'Close',
//      accelerator: 'CmdOrCtrl+W',
//      role: 'close'
//    },
//    {
//      label: 'Minimize',
//      accelerator: 'CmdOrCtrl+M',
//      role: 'minimize'
//    },
//    {
//      label: 'Zoom',
//      role: 'zoom'
//    },
//    {
//      type: 'separator'
//    },
//    {
//      label: 'Bring All to Front',
//      role: 'front'
//    }
//  ]
//}
//
//
//
//// sets the menu to our template
//const menu = Menu.buildFromTemplate(template)
//Menu.setApplicationMenu(menu)
//