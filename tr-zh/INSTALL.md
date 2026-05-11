# ACE-Step 1.5 安裝指南

**Language / 語言 / 言語:** [English](../en/INSTALL.md) | [繁體中文](INSTALL.md) | [日本語](../ja/INSTALL.md)

---

## 目錄

- [環境要求](#環境要求)
- [快速開始（全平台）](#快速開始全平台)
- [啟動指令碼](#-啟動指令碼)
- [Windows 便攜包](#-windows-便攜包)
- [AMD / ROCm 顯示卡](#amd--rocm-顯示卡)
- [Intel 顯示卡](#intel-顯示卡)
- [僅 CPU 模式](#僅-cpu-模式)
- [Linux 注意事項](#linux-注意事項)
- [環境變數 (.env)](#環境變數-env)
- [命令列參數](#命令列參數)
- [模型下載](#-模型下載)
- [如何選擇模型？](#-如何選擇模型)
- [開發](#開發)

---

## 環境要求

| 專案 | 要求 |
|------|------|
| Python | 3.11-3.12（正式版，非預發布版）<br>**注意：** Windows 上的 ROCm 需要 Python 3.12 |
| GPU | 推薦 CUDA GPU；也支援 MPS / ROCm / Intel XPU / CPU |
| 顯示記憶體 | 僅 DiT 模式 ≥4GB；LLM+DiT ≥6GB |
| 磁碟 | 核心模型約 10GB |

---

## 快速開始（全平台）

### 1. 安裝 uv（包管理器）

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### 2. 克隆 & 安裝

```bash
git clone https://github.com/ACE-Step/ACE-Step-1.5.git
cd ACE-Step-1.5
uv sync
```

### 3. 啟動

**Gradio 網頁介面（推薦）：**

```bash
uv run acestep
```

**REST API 伺服器：**

```bash
uv run acestep-api
```

**直接使用 Python**（Conda / venv / 系統 Python）：

```bash
# 先啟用你的環境，然後：
python acestep/acestep_v15_pipeline.py          # Gradio UI
python acestep/api_server.py                     # REST API
```

> 首次執行時模型會自動下載。開啟 http://localhost:7860（Gradio）或 http://localhost:8001（API）。

---

## 🚀 啟動指令碼

為所有平台提供開箱即用的啟動指令碼。這些指令碼會自動處理環境檢測、依賴安裝和應用啟動。所有指令碼預設在啟動時檢查更新（可配置）。

### 可用指令碼

| 平台 | 指令碼 | 說明 |
|------|------|------|
| **Windows** | `start_gradio_ui.bat` | 啟動 Gradio 網頁介面（CUDA） |
| **Windows** | `start_api_server.bat` | 啟動 REST API 伺服器（CUDA） |
| **Windows** | `start_gradio_ui_rocm.bat` | 啟動 Gradio 網頁介面（AMD ROCm） |
| **Windows** | `start_api_server_rocm.bat` | 啟動 REST API 伺服器（AMD ROCm） |
| **Linux** | `start_gradio_ui.sh` | 啟動 Gradio 網頁介面（CUDA） |
| **Linux** | `start_api_server.sh` | 啟動 REST API 伺服器（CUDA） |
| **macOS** | `start_gradio_ui_macos.sh` | 啟動 Gradio 網頁介面（MLX） |
| **macOS** | `start_api_server_macos.sh` | 啟動 REST API 伺服器（MLX） |

### Windows

```bash
# 啟動 Gradio 網頁介面（NVIDIA CUDA）
start_gradio_ui.bat

# 啟動 REST API 伺服器（NVIDIA CUDA）
start_api_server.bat

# 啟動 Gradio 網頁介面（AMD ROCm）
start_gradio_ui_rocm.bat

# 啟動 REST API 伺服器（AMD ROCm）
start_api_server_rocm.bat
```

> **ROCm 使用者：** ROCm 指令碼（`start_gradio_ui_rocm.bat`、`start_api_server_rocm.bat`）會自動設定 `HSA_OVERRIDE_GFX_VERSION`、`ACESTEP_LM_BACKEND=pt`、`MIOPEN_FIND_MODE=FAST` 及其他 ROCm 相關環境變數。這些指令碼使用獨立的 `venv_rocm` 虛擬環境，以避免 CUDA/ROCm wheel 衝突。

### Linux

```bash
# 首次使用需新增執行權限
chmod +x start_gradio_ui.sh start_api_server.sh

# 啟動 Gradio 網頁介面
./start_gradio_ui.sh

# 啟動 REST API 伺服器
./start_api_server.sh
```

> **注意：** 需要透過系統包管理器安裝 Git（`sudo apt install git`、`sudo yum install git`、`sudo pacman -S git`）。

### macOS（Apple Silicon / MLX）

macOS 指令碼使用 **MLX 後端**，提供原生 Apple Silicon 加速（M1/M2/M3/M4）。

```bash
# 首次使用需新增執行權限
chmod +x start_gradio_ui_macos.sh start_api_server_macos.sh

# 啟動 Gradio 網頁介面（MLX 後端）
./start_gradio_ui_macos.sh

# 啟動 REST API 伺服器（MLX 後端）
./start_api_server_macos.sh
```

macOS 指令碼會自動設定 `ACESTEP_LM_BACKEND=mlx` 和 `--backend mlx` 以啟用原生 Apple Silicon 加速，在非 arm64 機器上則回退到 PyTorch 後端。

> **注意：** 透過 `xcode-select --install` 或 `brew install git` 安裝 Git。

### 指令碼功能

- 啟動時自動檢查更新（預設啟用，可配置）
- 自動環境檢測（便攜 Python 或 uv）
- 自動安裝 `uv`（如需要）
- 可配置下載源（HuggingFace/ModelScope）
- 可自定義模型和參數

### 如何修改配置

所有可配置選項均定義為每個指令碼頂部的變數。如需自定義，請用文字編輯器開啟指令碼並修改變數值。

**示例：將介面語言改為中文並使用 1.7B LM 模型**

<table>
<tr><th>Windows (.bat)</th><th>Linux / macOS (.sh)</th></tr>
<tr><td>

在 `start_gradio_ui.bat` 中找到以下行：
```batch
set LANGUAGE=en
set LM_MODEL_PATH=--lm_model_path acestep-5Hz-lm-0.6B
```
修改為：
```batch
set LANGUAGE=zh
set LM_MODEL_PATH=--lm_model_path acestep-5Hz-lm-1.7B
```

</td><td>

在 `start_gradio_ui.sh` 中找到以下行：
```bash
LANGUAGE="en"
LM_MODEL_PATH="--lm_model_path acestep-5Hz-lm-0.6B"
```
修改為：
```bash
LANGUAGE="zh"
LM_MODEL_PATH="--lm_model_path acestep-5Hz-lm-1.7B"
```

</td></tr>
</table>

**示例：禁用啟動時更新檢查**

<table>
<tr><th>Windows (.bat)</th><th>Linux / macOS (.sh)</th></tr>
<tr><td>

```batch
REM set CHECK_UPDATE=true
set CHECK_UPDATE=false
```

</td><td>

```bash
# CHECK_UPDATE="true"
CHECK_UPDATE="false"
```

</td></tr>
</table>

**示例：啟用已註釋的選項** —— 刪除註釋前綴（.bat 用 `REM`，.sh 用 `#`）：

<table>
<tr><th>Windows (.bat)</th><th>Linux / macOS (.sh)</th></tr>
<tr><td>

修改前：
```batch
REM set SHARE=--share
```
修改後：
```batch
set SHARE=--share
```

</td><td>

修改前：
```bash
# SHARE="--share"
```
修改後：
```bash
SHARE="--share"
```

</td></tr>
</table>

**常用可配置選項：**

| 選項 | Gradio UI | API 伺服器 | 說明 |
|------|:---------:|:----------:|------|
| `LANGUAGE` | ✅ | — | 介面語言：`en`、`zh`、`he`、`ja` |
| `PORT` | ✅ | ✅ | 服務埠（預設：7860 / 8001） |
| `SERVER_NAME` / `HOST` | ✅ | ✅ | 繫結地址（`127.0.0.1` 或 `0.0.0.0`） |
| `CHECK_UPDATE` | ✅ | ✅ | 啟動時更新檢查（`true` / `false`） |
| `CONFIG_PATH` | ✅ | — | DiT 模型（`acestep-v15-turbo` 等） |
| `LM_MODEL_PATH` | ✅ | ✅ | LM 模型（`acestep-5Hz-lm-0.6B` / `1.7B` / `4B`） |
| `DOWNLOAD_SOURCE` | ✅ | ✅ | 下載源（`huggingface` / `modelscope`） |
| `SHARE` | ✅ | — | 建立公開 Gradio 連結 |
| `INIT_LLM` | ✅ | — | 強制啟用/禁用 LLM（`true` / `false` / `auto`） |
| `OFFLOAD_TO_CPU` | ✅ | — | 低顯示記憶體 GPU 的 CPU 卸載 |

### 更新與維護工具

| 指令碼（Windows） | 指令碼（Linux/macOS） | 用途 |
|------------------|----------------------|------|
| `check_update.bat` | `check_update.sh` | 從 GitHub 檢查並更新 |
| `merge_config.bat` | `merge_config.sh` | 更新後合併備份的配置 |
| `install_uv.bat` | `install_uv.sh` | 安裝 uv 包管理器 |
| `quick_test.bat` | `quick_test.sh` | 測試環境配置 |

**更新工作流：**

```bash
# Windows                          # Linux / macOS
check_update.bat                    ./check_update.sh
merge_config.bat                    ./merge_config.sh
```

---

## 🪟 Windows 便攜包

為 Windows 使用者提供了預裝依賴的便攜包：

1. 下載並解壓：[ACE-Step-1.5.7z](https://files.acemusic.ai/acemusic/win/ACE-Step-1.5.7z)
2. 包含 `python_embedded`，所有依賴已預裝
3. **要求：** CUDA 12.8

### 快速啟動指令碼

| 指令碼 | 說明 |
|------|------|
| `start_gradio_ui.bat` | 啟動 Gradio 網頁介面 |
| `start_api_server.bat` | 啟動 REST API 伺服器 |

兩個指令碼均支援自動環境檢測、自動安裝 `uv`、可配置下載源、可選 Git 更新檢查、可自定義模型和參數。

### 配置

**`start_gradio_ui.bat`：**

```batch
REM 介面語言 (en, zh, he, ja)
set LANGUAGE=zh

REM 下載源 (auto, huggingface, modelscope)
set DOWNLOAD_SOURCE=--download-source modelscope

REM Git 更新檢查 (true/false)
set CHECK_UPDATE=true

REM 模型配置
set CONFIG_PATH=--config_path acestep-v15-turbo
set LM_MODEL_PATH=--lm_model_path acestep-5Hz-lm-1.7B
```

### 更新與維護

| 指令碼 | 用途 |
|------|------|
| `check_update.bat` | 從 GitHub 檢查並更新 |
| `merge_config.bat` | 更新後合併備份的配置 |
| `install_uv.bat` | 安裝 uv 包管理器 |
| `quick_test.bat` | 測試環境配置 |

---

## AMD / ROCm 顯示卡

> ⚠️ `uv run acestep` 會安裝 CUDA PyTorch wheels，可能覆蓋已有的 ROCm 環境。

### 推薦工作流

```bash
# 1. 建立並啟用虛擬環境
python -m venv .venv
source .venv/bin/activate

# 2. 安裝 ROCm 相容的 PyTorch
pip install torch --index-url https://download.pytorch.org/whl/rocm6.0

# 3. 安裝 ACE-Step
pip install -e .

# 4. 啟動服務
python -m acestep.acestep_v15_pipeline --port 7680
```

### GPU 檢測問題排查

如果顯示 "No GPU detected, running on CPU"：

1. 執行診斷工具：`python scripts/check_gpu.py`
2. RDNA3 GPU 設定 `HSA_OVERRIDE_GFX_VERSION`：

| GPU | 值 |
|-----|---|
| RX 7900 XT/XTX, RX 9070 XT | `export HSA_OVERRIDE_GFX_VERSION=11.0.0` |
| RX 7800 XT, RX 7700 XT | `export HSA_OVERRIDE_GFX_VERSION=11.0.1` |
| RX 7600 | `export HSA_OVERRIDE_GFX_VERSION=11.0.2` |

3. Windows 上使用 `start_gradio_ui_rocm.bat` / `start_api_server_rocm.bat`
4. 驗證 ROCm 安裝：`rocm-smi`

### Linux（cachy-os / RDNA4）

詳見 [ACE-Step1.5-Rocm-Manual-Linux.md](../en/ACE-Step1.5-Rocm-Manual-Linux.md)

---

## Intel 顯示卡

| 專案 | 詳情 |
|------|------|
| 測試裝置 | Windows 筆記本，Ultra 9 285H 整合顯示卡 |
| 卸載 | 預設禁用 |
| 編譯與量化 | 預設啟用 |
| LLM 推理 | 支援（已測試 `acestep-5Hz-lm-0.6B`） |
| nanovllm 加速 | Intel GPU 暫不支援 |
| 測試環境 | PyTorch 2.8.0（[Intel Extension for PyTorch](https://pytorch-extension.intel.com/?request=platform)） |

> 注意：生成超過 2 分鐘的音訊時，LLM 推理速度可能下降。Intel 獨立顯示卡預計可用但尚未測試。

---

## 僅 CPU 模式

ACE-Step 可以在 CPU 上執行**僅推理**，但速度會顯著變慢。

- 不推薦在 CPU 上訓練（包括 LoRA）。
- 低顯示記憶體系統可使用 DiT-only 模式（禁用 LLM）。

如果沒有 GPU，建議：
- 使用雲 GPU 服務
- 僅執行推理工作流
- 使用 `ACESTEP_INIT_LLM=false` 啟用 DiT-only 模式

---

## Linux 注意事項

### Python 3.11 預發布版問題

部分 Linux 發行版（包括 Ubuntu）自帶 Python 3.11.0rc1 預發布版，可能導致 vLLM 後端出現段錯誤。

**建議：** 使用穩定版 Python（≥ 3.11.12）。Ubuntu 上可透過 deadsnakes PPA 安裝。

如無法升級 Python，使用 PyTorch 後端：

```bash
uv run acestep --backend pt
```

---

## 環境變數 (.env)

```bash
cp .env.example .env   # 複製並編輯
```

### 關鍵變數

| 變數 | 取值 | 說明 |
|------|------|------|
| `ACESTEP_INIT_LLM` | `auto` / `true` / `false` | LLM 初始化模式 |
| `ACESTEP_CONFIG_PATH` | 模型名稱 | DiT 模型路徑 |
| `ACESTEP_LM_MODEL_PATH` | 模型名稱 | LM 模型路徑 |
| `ACESTEP_DOWNLOAD_SOURCE` | `auto` / `huggingface` / `modelscope` | 下載源 |
| `ACESTEP_API_KEY` | 字串 | API 認證金鑰 |

### LLM 初始化 (`ACESTEP_INIT_LLM`)

處理流程：`GPU 檢測 → ACESTEP_INIT_LLM 覆蓋 → 模型載入`

| 值 | 行為 |
|----|------|
| `auto`（或空） | 使用 GPU 自動檢測結果（推薦） |
| `true` / `1` / `yes` | 強制啟用 LLM（可能導致 OOM） |
| `false` / `0` / `no` | 強制禁用，純 DiT 模式 |

**示例 `.env`：**

```bash
# 自動模式（推薦）
ACESTEP_INIT_LLM=auto

# 低顯示記憶體 GPU 強制啟用
ACESTEP_INIT_LLM=true
ACESTEP_LM_MODEL_PATH=acestep-5Hz-lm-0.6B

# 禁用 LLM 加速生成
ACESTEP_INIT_LLM=false
```

---

## 命令列參數

### Gradio UI (`acestep`)

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `--port` | 7860 | 服務埠 |
| `--server-name` | 127.0.0.1 | 服務地址（使用 `0.0.0.0` 開放網路訪問） |
| `--share` | false | 建立公開 Gradio 連結 |
| `--language` | en | 介面語言：`en`、`zh`、`he`、`ja` |
| `--init_service` | false | 啟動時自動初始化模型 |
| `--init_llm` | auto | LLM 初始化：`true` / `false` / 省略為自動 |
| `--config_path` | auto | DiT 模型（如 `acestep-v15-turbo`） |
| `--lm_model_path` | auto | LM 模型（如 `acestep-5Hz-lm-1.7B`） |
| `--offload_to_cpu` | auto | CPU 卸載（顯示記憶體 < 20GB 時自動啟用） |
| `--download-source` | auto | 模型源：`auto` / `huggingface` / `modelscope` |
| `--enable-api` | false | 同時啟用 REST API 端點 |

**示例：**

```bash
# 公開訪問 + 中文介面
uv run acestep --server-name 0.0.0.0 --share --language zh

# 啟動時預初始化模型
uv run acestep --init_service true --config_path acestep-v15-turbo

# 使用 ModelScope 下載
uv run acestep --download-source modelscope
```

---

## 📥 模型下載

首次執行時模型會從 [HuggingFace](https://huggingface.co/ACE-Step/Ace-Step1.5) 或 [ModelScope](https://modelscope.cn/organization/ACE-Step) 自動下載。

### CLI 下載

```bash
uv run acestep-download                              # 下載主模型
uv run acestep-download --all                         # 下載所有模型
uv run acestep-download --download-source modelscope  # 從 ModelScope 下載
uv run acestep-download --model acestep-v15-sft       # 指定模型
uv run acestep-download --list                        # 列出所有可用模型
```

### 手動下載 (huggingface-cli)

```bash
# 主模型
huggingface-cli download ACE-Step/Ace-Step1.5 --local-dir ./checkpoints

# 可選模型
huggingface-cli download ACE-Step/acestep-5Hz-lm-0.6B --local-dir ./checkpoints/acestep-5Hz-lm-0.6B
huggingface-cli download ACE-Step/acestep-5Hz-lm-4B --local-dir ./checkpoints/acestep-5Hz-lm-4B
```

### 共享模型目錄

如果你有多個 ACE-Step 安裝（例如訓練器、不同版本），可以共享同一個模型目錄以避免重複下載、節省磁碟空間：

```bash
# 新增到 shell 配置檔案（~/.bashrc、~/.zshrc 等）
export ACESTEP_CHECKPOINTS_DIR=~/ace-step-models
```

所有安裝將使用相同的模型檔案。也可以在 `.env` 檔案中設定。

### 可用模型

| 模型 | 說明 | HuggingFace |
|------|------|-------------|
| **Ace-Step1.5**（主模型） | 核心：vae, Qwen3-Embedding-0.6B, acestep-v15-turbo, acestep-5Hz-lm-1.7B | [連結](https://huggingface.co/ACE-Step/Ace-Step1.5) |
| acestep-5Hz-lm-0.6B | 輕量 LM（0.6B 參數） | [連結](https://huggingface.co/ACE-Step/acestep-5Hz-lm-0.6B) |
| acestep-5Hz-lm-4B | 大型 LM（4B 參數） | [連結](https://huggingface.co/ACE-Step/acestep-5Hz-lm-4B) |
| acestep-v15-base | 基礎 DiT 模型 | [連結](https://huggingface.co/ACE-Step/acestep-v15-base) |
| acestep-v15-sft | SFT DiT 模型 | [連結](https://huggingface.co/ACE-Step/acestep-v15-sft) |
| acestep-v15-turbo-shift1 | Turbo DiT（shift1） | [連結](https://huggingface.co/ACE-Step/acestep-v15-turbo-shift1) |
| acestep-v15-turbo-shift3 | Turbo DiT（shift3） | [連結](https://huggingface.co/ACE-Step/acestep-v15-turbo-shift3) |
| acestep-v15-turbo-continuous | Turbo DiT（continuous shift 1-5） | [連結](https://huggingface.co/ACE-Step/acestep-v15-turbo-continuous) |

---

## 💡 如何選擇模型？

ACE-Step 會自動適配你的 GPU 顯示記憶體。UI 會根據檢測到的 GPU 等級預配置所有設定（LM 模型、後端、卸載、量化）：

| GPU 顯示記憶體 | 推薦 DiT | 推薦 LM 模型 | 後端 | 說明 |
|----------|---------|--------------|------|------|
| **≤6GB** | 2B turbo | 無（僅 DiT） | — | 預設禁用 LM；INT8 量化 + 完全 CPU 卸載 |
| **6-8GB** | 2B turbo | `acestep-5Hz-lm-0.6B` | `pt` | 輕量 LM，PyTorch 後端 |
| **8-16GB** | 2B turbo/sft | `0.6B` / `1.7B` | `vllm` | 8-12GB 用 0.6B，12-16GB 用 1.7B |
| **16-20GB** | 2B sft 或 XL turbo | `acestep-5Hz-lm-1.7B` | `vllm` | XL 在 20GB 以下需要 CPU 卸載 |
| **20-24GB** | XL turbo/sft | `acestep-5Hz-lm-1.7B` | `vllm` | XL 無需卸載；可用 4B LM |
| **≥24GB** | XL sft（或 xl-base 用於 extract/lego/complete） | `acestep-5Hz-lm-4B` | `vllm` | 最佳品質，所有模型無需卸載 |

> 📖 詳細 GPU 相容性資訊（等級表、時長限制、批次大小、自適應 UI 預設設定、顯示記憶體最佳化），請參閱 [GPU 相容性指南](GPU_COMPATIBILITY.md)。

---

## 開發

```bash
# 新增依賴
uv add package-name
uv add --dev package-name

# 更新所有依賴
uv sync --upgrade
```
