@echo off
chcp 65001 >nul 2>&1
title OPC OS - One Person Company

echo.
echo  ========================================
echo    OPC OS - AI 一人公司操作系统
echo  ========================================
echo.

:: 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  错误: 未找到 Node.js
    echo  请先安装: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: 显示 Node 版本
for /f "tokens=*" %%i in ('node -v') do echo  Node.js: %%i
for /f "tokens=*" %%i in ('npm -v') do echo  npm: %%i
echo.

:: 复制到无中文路径避免编码问题
set "TARGET=C:\opc-os"
if not exist "%TARGET%\package.json" (
    echo  复制项目到 %TARGET% ...
    xcopy "%~dp0*" "%TARGET%\" /E /I /Y /Q >nul 2>&1
)

cd /d "%TARGET%"

echo  [1/2] 安装依赖...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo  npm install 失败！
    pause
    exit /b 1
)

echo.
echo  [2/2] 启动开发服务器...
echo.
echo  浏览器打开: http://localhost:3000
echo  按 Ctrl+C 停止服务器
echo.

call npm run dev
