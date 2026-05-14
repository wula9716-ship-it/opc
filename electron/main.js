const { app, BrowserWindow, shell, Menu, nativeTheme, globalShortcut } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

// GPU 兼容：远程/无头环境下必须在 app ready 之前设置
app.disableHardwareAcceleration()
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('no-sandbox')
app.commandLine.appendSwitch('disable-gpu-compositing')
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('use-gl', 'swiftshader')

// ============ 配置 ============

const PORT = 3077 // 避免和开发端口冲突
const isDev = !app.isPackaged
const APP_TITLE = 'OPC OS — One Person Company'

let mainWindow = null
let nextProcess = null

// ============ 窗口创建 ============

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    title: APP_TITLE,
    backgroundColor: '#060614',
    show: false, // 等 ready-to-show 再显示，避免白屏闪烁
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  })

  // 去掉默认菜单栏（Windows 下的 File/Edit/View）
  Menu.setApplicationMenu(null)

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) {
      mainWindow.webContents.openDevTools({ mode: 'detach' })
    }
  })

  // Ctrl+Shift+I 打开/关闭控制台
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools()
      event.preventDefault()
    }
  })

  // 外部链接用默认浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}

// ============ Next.js 服务管理 ============

function startNextServer() {
  return new Promise((resolve, reject) => {
    const nextBin = path.join(__dirname, '..', 'node_modules', '.bin', 'next')
    const cwd = path.join(__dirname, '..')

    nextProcess = spawn(nextBin, ['start', '-p', String(PORT)], {
      cwd,
      shell: true,
      stdio: isDev ? 'inherit' : 'pipe',
      env: { ...process.env, NODE_ENV: 'production' },
    })

    nextProcess.on('error', (err) => {
      console.error('[Electron] Failed to start Next.js:', err)
      reject(err)
    })

    // 等待服务就绪
    let retries = 0
    const maxRetries = 30
    const checkReady = setInterval(async () => {
      retries++
      try {
        const res = await fetch(`http://localhost:${PORT}`)
        if (res.ok || res.status === 200 || res.status === 404) {
          clearInterval(checkReady)
          resolve()
        }
      } catch {
        if (retries >= maxRetries) {
          clearInterval(checkReady)
          reject(new Error('Next.js server failed to start'))
        }
      }
    }, 500)
  })
}

function stopNextServer() {
  if (nextProcess) {
    nextProcess.kill()
    nextProcess = null
  }
}

// ============ App 生命周期 ============

app.whenReady().then(async () => {
  createWindow()

  if (isDev) {
    // 开发模式：加载已有的 dev server
    mainWindow.loadURL('http://localhost:3000')
  } else {
    // 生产模式：启动 Next.js 服务
    try {
      await startNextServer()
      mainWindow.loadURL(`http://localhost:${PORT}`)
    } catch (err) {
      console.error('[Electron] Could not start Next.js server:', err)
      app.quit()
    }
  }
})

app.on('window-all-closed', () => {
  stopNextServer()
  app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
    if (isDev) {
      mainWindow.loadURL('http://localhost:3000')
    } else {
      mainWindow.loadURL(`http://localhost:${PORT}`)
    }
  }
})

// 优雅退出
app.on('before-quit', () => {
  stopNextServer()
})
