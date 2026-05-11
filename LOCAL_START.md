# ACE-Step UI 本機啟動說明

這份啟動方式適合本機端口常常被其他應用占用的情境。請優先使用 `start-smart.bat`，它會在每次啟動前先檢查端口，再把 ACE-Step Gradio/API、UI Backend、UI Frontend 配成同一組可用端口。

## 第一次使用

1. 確認已安裝 Node.js 18+ 與 uv。
2. 安裝 UI 依賴：

```bat
cd ace-step-ui
npm install
cd server
npm install
cd ..
```

3. 啟動整套 UI：

```bat
start-smart.bat
```

預設會從 `8001`、`3001`、`3000` 開始找可用端口。如果某個端口被占用，腳本會自動往後找下一個可用端口，並在畫面列出本次實際使用的端口。

## 指定 ACE-Step 路徑

如果 `ACE-Step-1.5` 沒有放在 `ace-step-ui` 旁邊，先設定 `ACESTEP_PATH`：

```bat
set ACESTEP_PATH=D:\Projects\ACE-STEP 1.5 LOCAL\ACE-Step-1.5
start-smart.bat
```

## 自訂起始端口

可以指定掃描起點：

```bat
start-smart.bat -ApiPortStart 8101 -BackendPortStart 3101 -FrontendPortStart 3200
```

如果只想先看端口規劃、不啟動服務：

```bat
start-smart.bat -PlanOnly
```

## 啟動後會開三個服務

- ACE-Step Gradio/API：供 UI 後端呼叫模型，透過 `uv run acestep --enable-api` 啟動。
- UI Backend：Express/SQLite 後端。
- UI Frontend：Vite/React 前端。

請使用腳本最後列出的 Frontend 網址，例如：

```text
http://localhost:3000
```

如果 `3000` 被占用，網址會變成腳本實際選到的端口。

## 注意事項

- 第一次啟動 ACE-Step 時，`uv run` 可能會同步 Python 依賴，模型也可能下載，時間會比較久。
- Python 相關環境與執行請一律使用 uv，例如 `uv sync`、`uv run ...`、`uv pip install ...`。
- 不要手動固定只開 `localhost:3000`；每次以 `start-smart.bat` 顯示的 Frontend 網址為準。
- 若要停止服務，關掉三個啟動視窗即可。
- 如果 Windows 防火牆跳出提示，允許 Node.js / Python 在私人網路通訊，LAN 裝置才比較容易連到 UI。
