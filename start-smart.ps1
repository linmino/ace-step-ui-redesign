param(
    [int]$ApiPortStart = 8001,
    [int]$BackendPortStart = 3001,
    [int]$FrontendPortStart = 3000,
    [string]$AceStepPath = $env:ACESTEP_PATH,
    [switch]$PlanOnly,
    [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"

function Test-PortAvailable {
    param(
        [Parameter(Mandatory = $true)]
        [int]$Port
    )

    $listener = $null
    try {
        $address = [System.Net.IPAddress]::Parse("127.0.0.1")
        $listener = [System.Net.Sockets.TcpListener]::new($address, $Port)
        $listener.Start()
        return $true
    }
    catch {
        return $false
    }
    finally {
        if ($null -ne $listener) {
            $listener.Stop()
        }
    }
}

function Get-AvailablePort {
    param(
        [Parameter(Mandatory = $true)]
        [int]$StartPort,
        [Parameter(Mandatory = $true)]
        [string]$Label,
        [int[]]$ReservedPorts = @()
    )

    for ($port = $StartPort; $port -lt ($StartPort + 200); $port++) {
        if ($ReservedPorts -contains $port) {
            continue
        }

        if (Test-PortAvailable -Port $port) {
            if ($port -ne $StartPort) {
                Write-Host "[Port] $Label 預設端口 $StartPort 已被占用，改用 $port"
            }
            else {
                Write-Host "[Port] $Label 使用 $port"
            }
            return $port
        }
    }

    throw "找不到可用的 $Label 端口，已掃描 $StartPort 到 $($StartPort + 199)。"
}

function Assert-Command {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$InstallHint
    )

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "找不到 $Name。$InstallHint"
    }
}

function Quote-ForPowerShell {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    return "'" + ($Value -replace "'", "''") + "'"
}

function Start-ServiceWindow {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Title,
        [Parameter(Mandatory = $true)]
        [string]$Command
    )

    $shell = if (Get-Command pwsh -ErrorAction SilentlyContinue) { "pwsh" } else { "powershell" }
    Start-Process -FilePath $shell -ArgumentList @(
        "-NoProfile",
        "-NoExit",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        "& { `$Host.UI.RawUI.WindowTitle = '$Title'; $Command }"
    )
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($AceStepPath)) {
    $AceStepPath = Join-Path $scriptDir "..\ACE-Step-1.5"
}

$resolvedAceStepPath = (Resolve-Path -LiteralPath $AceStepPath -ErrorAction SilentlyContinue)
if ($null -eq $resolvedAceStepPath) {
    throw "找不到 ACE-Step 目錄：$AceStepPath。請設定 ACESTEP_PATH，或把 ACE-Step-1.5 放在 ace-step-ui 旁邊。"
}
$resolvedAceStepPath = $resolvedAceStepPath.Path

Assert-Command -Name "node" -InstallHint "請先安裝 Node.js 18+。"
Assert-Command -Name "npm" -InstallHint "請確認 Node.js / npm 已加入 PATH。"
Assert-Command -Name "uv" -InstallHint "請先安裝 uv，Python 相關啟動會嚴格透過 uv run 執行。"

if (-not (Test-Path -LiteralPath (Join-Path $scriptDir "node_modules"))) {
    throw "找不到前端 node_modules。請先在 ace-step-ui 執行：npm install"
}

if (-not (Test-Path -LiteralPath (Join-Path $scriptDir "server\node_modules"))) {
    throw "找不到後端 node_modules。請先在 ace-step-ui\server 執行：npm install"
}

Write-Host "=================================="
Write-Host "  ACE-Step UI 智慧啟動"
Write-Host "=================================="
Write-Host ""
Write-Host "[Path] ACE-Step: $resolvedAceStepPath"
Write-Host ""

$apiPort = Get-AvailablePort -StartPort $ApiPortStart -Label "ACE-Step Gradio/API"
$backendPort = Get-AvailablePort -StartPort $BackendPortStart -Label "UI Backend" -ReservedPorts @($apiPort)
$frontendPort = Get-AvailablePort -StartPort $FrontendPortStart -Label "UI Frontend" -ReservedPorts @($apiPort, $backendPort)

$apiUrl = "http://127.0.0.1:$apiPort"
$backendUrl = "http://127.0.0.1:$backendPort"
$frontendUrl = "http://localhost:$frontendPort"

Write-Host ""
Write-Host "=================================="
Write-Host "  本次端口規劃"
Write-Host "=================================="
Write-Host "  ACE-Step Gradio/API: $apiUrl"
Write-Host "  UI Backend:          $backendUrl"
Write-Host "  UI Frontend:         $frontendUrl"
Write-Host ""

if ($PlanOnly) {
    Write-Host "PlanOnly 模式：只完成端口檢查與規劃，未啟動任何服務。"
    exit 0
}

$aceStepDirQuoted = Quote-ForPowerShell $resolvedAceStepPath
$uiDirQuoted = Quote-ForPowerShell $scriptDir
$serverDirQuoted = Quote-ForPowerShell (Join-Path $scriptDir "server")

$apiCommand = @(
    "Set-Location -LiteralPath $aceStepDirQuoted",
    "`$env:PORT = '$apiPort'",
    "`$env:SERVER_NAME = '127.0.0.1'",
    "uv run acestep --port $apiPort --server-name 127.0.0.1 --enable-api"
) -join "; "

$backendCommand = @(
    "Set-Location -LiteralPath $serverDirQuoted",
    "`$env:PORT = '$backendPort'",
    "`$env:NODE_ENV = 'development'",
    "`$env:ACESTEP_PATH = $(Quote-ForPowerShell $resolvedAceStepPath)",
    "`$env:ACESTEP_API_URL = '$apiUrl'",
    "`$env:FRONTEND_URL = '$frontendUrl'",
    "npm run dev"
) -join "; "

$frontendCommand = @(
    "Set-Location -LiteralPath $uiDirQuoted",
    "`$env:FRONTEND_PORT = '$frontendPort'",
    "`$env:VITE_BACKEND_URL = '$backendUrl'",
    "`$env:PORT = '$backendPort'",
    "npm run dev -- --host 0.0.0.0 --port $frontendPort"
) -join "; "

Write-Host "[1/3] 啟動 ACE-Step Gradio/API..."
Start-ServiceWindow -Title "ACE-Step Gradio API :$apiPort" -Command $apiCommand

Start-Sleep -Seconds 6

Write-Host "[2/3] 啟動 UI Backend..."
Start-ServiceWindow -Title "ACE-Step UI Backend :$backendPort" -Command $backendCommand

Start-Sleep -Seconds 3

Write-Host "[3/3] 啟動 UI Frontend..."
Start-ServiceWindow -Title "ACE-Step UI Frontend :$frontendPort" -Command $frontendCommand

Write-Host ""
Write-Host "啟動指令已送出。第一次跑 ACE-Step 時，uv 可能會安裝或同步依賴，模型也可能下載，請耐心等 Gradio/API 視窗完成初始化。"
Write-Host "前端網址：$frontendUrl"

if (-not $NoBrowser) {
    Start-Sleep -Seconds 2
    Start-Process $frontendUrl
}
