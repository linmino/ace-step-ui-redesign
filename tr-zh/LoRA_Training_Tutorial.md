# ACE-Step 1.5 LoRA 訓練教學

## 硬體需求

| 顯示記憶體 | 說明 |
|------|------|
| 16 GB（最低） | 通常可用，但處理較長歌曲時可能出現顯示記憶體不足 |
| 20 GB 及以上（推薦） | 可處理全曲長度，訓練時顯示記憶體佔用通常維持在 17 GB 左右 |

> **提示：** 在訓練開始之前的預處理階段，需要多次重啟 Gradio 以釋放顯示記憶體，具體時機會在後續步驟中說明。

## 免責宣告

本教學使用 **Nayutan星人 (NayutalieN)** 的專輯 *ナユタン星からの物體Y*（共 13 首歌曲）作為演示，訓練了 500 個 epoch（batch size 為 1）。**本教學僅用於理解 LoRA 微調技術的教育目的，請使用您的原創作品訓練 LoRA。**

作為開發者，我本人非常喜歡 Nayutan星人 的作品，因此選用了其中一張專輯作為示例。如果您是權利持有者並認為本教學侵犯了您的合法權益，請立即聯絡我們，我們將在收到有效通知後移除相關內容。

技術應當被合理合法地使用，請尊重藝術家的創作，不要做出**損害或傷害**原創藝術家的聲譽、權利或利益的行為。

---

## 資料準備

> **提示：** 對於程式指令碼操作部分，如果您不熟悉程式設計，可以將本文件交給 Claude Code / Codex CLI / Cursor / Copilot 等 AI 程式設計工具，讓它來幫助您完成。

### 概述

每首歌的訓練資料包含以下內容：

1. **音訊檔案** — 支援 `.mp3`、`.wav`、`.flac`、`.ogg`、`.opus` 格式
2. **歌詞** — 與音訊同名的 `.lyrics.txt` 檔案（也相容 `.txt`）
3. **標註資料** — 包含 `caption`、`bpm`、`keyscale`、`timesignature`、`language` 等元資訊

### 標註資料格式

如果您已擁有完整的標註資料，可以構造 JSON 檔案，與音訊、歌詞放置在同一目錄。檔案結構如下：

```
dataset/
├── song1.mp3               # 音訊
├── song1.lyrics.txt        # 歌詞
├── song1.json              # 標註（可選）
├── song1.caption.txt       # caption（可選，也可寫在 json 中）
├── song2.mp3
├── song2.lyrics.txt
├── song2.json
└── ...
```

JSON 檔案結構（所有欄位均為可選）：

```json
{
    "caption": "A high-energy J-pop track with synthesizer leads and fast tempo",
    "bpm": 190,
    "keyscale": "D major",
    "timesignature": "4",
    "language": "ja"
}
```

如果沒有標註資料，可以透過後續章節介紹的方案獲取。

---

### 歌詞

將歌詞儲存為與音訊同名的 `.lyrics.txt` 檔案，放置在相同目錄下。請確保歌詞內容的準確性。

掃描時的歌詞檔案查詢優先順序：

1. `{檔名}.lyrics.txt`（推薦）
2. `{檔名}.txt`（向後相容）

#### 歌詞轉錄

如果您沒有現成的歌詞文字，可以透過以下工具轉錄獲取：

| 工具 | 結構化標籤 | 準確性 | 使用難度 | 部署方式 |
|------|-----------|--------|---------|---------|
| [acestep-transcriber](https://huggingface.co/ACE-Step/acestep-transcriber) | 無 | 可能有錯別字 | 較高（需部署模型） | 自部署 |
| [Gemini](https://aistudio.google.com/) | 有 | 可能有錯別字 | 低 | 付費 API |
| [Whisper](https://github.com/openai/whisper) | 無 | 可能有錯別字 | 中等 | 自部署 / 付費 API |
| [ElevenLabs](https://elevenlabs.io/app/developers) | 無 | 可能有錯別字 | 中等 | 付費 API（有免費額度） |

本專案在 `scripts/lora_data_prepare/` 下提供了對應的轉錄指令碼：

- `whisper_transcription.py` — 呼叫 OpenAI Whisper API 轉錄
- `elevenlabs_transcription.py` — 呼叫 ElevenLabs Scribe API 轉錄

兩個指令碼均支援 `process_folder()` 方法批次處理整個資料夾。

#### 檢查與清洗（必須）

模型轉錄出來的歌詞可能包含錯別字，**必須人工檢查並修正**。

如果您使用的是 LRC 格式的歌詞，需要移除其中的時間戳。以下是一個簡單的清洗示例：

```python
import re

def clean_lrc_content(lines):
    """清洗 LRC 檔案內容，移除時間戳"""
    result = []
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # 移除時間戳 [mm:ss.x] [mm:ss.xx] [mm:ss.xxx]
        cleaned = re.sub(r"\[\d{2}:\d{2}\.\d{1,3}\]", "", line)
        result.append(cleaned)

    # 移除末尾空行
    while result and not result[-1]:
        result.pop()

    return result
```

#### 結構化標籤（非必須）

如果歌詞包含結構化標籤（如 `[Verse]`、`[Chorus]` 等），能夠幫助模型更好地學習歌曲結構。沒有結構化標籤也可以正常訓練。

> **提示：** 可以使用 [Gemini](https://aistudio.google.com/) 為已有歌詞新增結構化標籤。

示例：

```
[Intro]
La la la...

[Verse 1]
Walking down the empty street
Echoes dancing at my feet

[Chorus]
We are the stars tonight
Shining through the endless sky

[Bridge]
Close your eyes and feel the sound
```

---

### 自動標註

#### 1. 獲取 BPM 和 Key

使用 [Key-BPM-Finder](https://vocalremover.org/key-bpm-finder) 線上獲取 BPM 和調式標註：

1. 開啟網頁後點選 **Browse my files**，選擇待處理的音訊檔案（一次處理過多可能會卡住，建議分批處理後合併 CSV）。處理在本地完成，不會上傳至伺服器。
   ![key-bpm-finder-0.jpg](../pics/key-bpm-finder-0.jpg)

2. 處理完成後，點選 **Export CSV** 下載 CSV 檔案。
   ![key-bpm-finder-1.jpg](../pics/key-bpm-finder-1.jpg)

3. CSV 檔案內容示例：

   ```csv
   File,Artist,Title,BPM,Key,Camelot
   song1.wav,,,190,D major,10B
   song2.wav,,,128,A minor,8A
   ```

4. 將 CSV 檔案放置到資料集資料夾中。如需附加 caption 資料，可在 `Camelot` 列後新增一列。

#### 2. 獲取 Caption

可透過以下方式獲取歌曲的 caption 描述：

- **使用 acestep-5Hz-lm**（0.6B / 1.7B / 4B）— 在 Gradio UI 中透過 Auto Label 功能呼叫（見後續操作步驟）
- **使用 Gemini API** — 參考指令碼 `scripts/lora_data_prepare/gemini_caption.py`，支援 `process_folder()` 批次處理，會為每個音訊生成：
  - `{檔名}.lyrics.txt` — 歌詞
  - `{檔名}.caption.txt` — caption 描述

---

## 資料預處理

準備好資料後，即可使用 Gradio UI 進行資料檢查與預處理。

> **重要：** 如果使用啟動指令碼啟動，需要修改啟動參數以禁用服務預初始化：
>
> - **Windows** (`start_gradio_ui.bat`)：將 `if not defined INIT_SERVICE set INIT_SERVICE=--init_service true` 修改為 `if not defined INIT_SERVICE set INIT_SERVICE=--init_service false`
> - **Linux/macOS** (`start_gradio_ui.sh`)：將 `: "${INIT_SERVICE:=--init_service true}"` 修改為 `: "${INIT_SERVICE:=--init_service false}"`

啟動 Gradio UI（透過啟動指令碼或直接執行 `acestep/acestep_v15_pipeline.py`）。

### 步驟 1：載入模型

- **需要使用 LM 生成 caption 的情況：** 在初始化時勾選想要使用的 LM 模型（acestep-5Hz-lm-0.6B / 1.7B / 4B）。
  ![](../pics/00_select_model_to_load.jpg)

- **不需要使用 LM 的情況：** 不要勾選 LM 模型。
  ![](../pics/00_select_model_to_load_1.jpg)

### 步驟 2：載入資料

切換到 **LoRA Training** 選項卡，輸入資料集目錄路徑，點選 **Scan**。

掃描時會自動識別以下檔案：

| 檔案 | 說明 |
|------|------|
| `*.mp3` / `*.wav` / `*.flac` / ... | 音訊檔案 |
| `{檔名}.lyrics.txt`（或 `{檔名}.txt`） | 歌詞 |
| `{檔名}.caption.txt` | Caption 描述 |
| `{檔名}.json` | 標註後設資料（caption / bpm / keyscale / timesignature / language） |
| `*.csv` | 批次 BPM / Key 標註（由 Key-BPM-Finder 匯出） |

![](../pics/01_load_dataset_path.jpg)

### 步驟 3：預覽並調整資料集

- **Duration** — 自動從音訊檔案讀取
- **Lyrics** — 需要存在同名 `.lyrics.txt` 檔案（也相容 `.txt`）
- **Labeled** — 如果有 caption 則顯示 ✅，否則顯示 ❌
- **BPM / Key / Caption** — 從 JSON 或 CSV 檔案中載入
- 如果資料集並非全部為純音樂（Instrumental），請取消勾選 **All Instrumental**
- **Format Lyrics** 與 **Transcribe Lyrics** 功能當前暫時禁用（未接入 [acestep-transcriber](https://huggingface.co/ACE-Step/acestep-transcriber)，直接使用 LM 容易產生幻覺）
- 輸入 **Custom Trigger Tag**（當前效果尚不明顯，只要不選 `Replace Caption` 即可）
- **Genre Ratio** 表示使用 genre 替代 caption 的比例。由於當前 LM 生成的 genre 描述能力遠不及 caption，建議保持為 0

![](../pics/02_preview_dataset.jpg)

### 步驟 4：Auto Label Data

- 如果已有 caption，可跳過此步驟
- 如果資料缺少 caption，可透過 LM 推理生成
- 如果缺少 BPM / Key 等數值，請先使用 [Key-BPM-Finder](https://vocalremover.org/key-bpm-finder) 獲取，直接由 LM 生成會產生幻覺

![](../pics/03_label_data.jpg)

### 步驟 5：預覽並編輯資料

如有需要，可以逐條檢查並修改資料。**每條資料修改後請記得點選儲存。**

![](../pics/04_edit_data.jpg)

### 步驟 6：儲存資料集

輸入儲存路徑，將資料集儲存為 JSON 檔案。

![](../pics/05_save_dataset.jpg)

### 步驟 7：預處理生成 Tensor 檔案

> **注意：** 如果此前使用了 LM 生成 caption 且顯示記憶體不足，建議先重啟 Gradio 釋放顯示記憶體，重啟時**不要勾選 LM 模型**。重啟後，在輸入框中填入已儲存的 JSON 檔案路徑並載入。

輸入 Tensor 檔案的儲存路徑，點選開始預處理，等待生成完成。

![](../pics/06_preprocess_tensor.jpg)

---

## 訓練

> **注意：** 生成 Tensor 檔案後，同樣建議重啟 Gradio 以釋放顯示記憶體。

1. 切換到 **Train LoRA** 選項卡，輸入 Tensor 檔案路徑並載入資料集。
2. 如果您對訓練參數不熟悉，通常使用預設值即可。

### 參數參考

| 參數 | 說明 | 建議值 |
|------|------|--------|
| **Max Epochs** | 根據資料集大小調整 | 約 100 首歌 → 500 epoch；10–20 首歌 → 800 epoch（僅供參考） |
| **Batch Size** | 顯示記憶體充足時可適當增大 | 1（預設），顯示記憶體足夠的話 可嘗試 2 或 4 |
| **Save Every N Epochs** | Checkpoint 儲存間隔 | Max Epochs 較小時可設小一些，較大時可設大一些 |

> 以上數值僅供參考，請根據實際情況調整。

> **💡 推薦使用 LoKr：** LoKR 大幅提升了訓練效率，原本需要一小時的訓練現在只需 5 分鐘——速度提升超過 10 倍。這對於在消費級 GPU 上訓練尤為關鍵。您可以在 **Train LoKr** 選項卡中嘗試 LoKr 訓練，或使用 [Side-Step](https://github.com/koda-dernet/Side-Step) 工具包進行命令列 LoKr 訓練。詳見 [Training Guide](../sidestep/Training%20Guide.md)。

3. 點選 **Start Training**，等待訓練完成。

![](../pics/07_train.jpg)

---

## 使用 LoRA

1. 訓練完成後**重啟 Gradio**，重新載入模型（不要勾選 LM 模型）。
2. 模型初始化完成後，載入訓練好的 LoRA 權重。
   ![](../pics/08_load_lora.jpg)
3. 開始合成音樂。

恭喜！您已完成 LoRA 訓練的全部流程。

---

## 高階訓練：Side-Step

如果你需要更精細地控制 LoRA 訓練——包括修正的時間步取樣、LoKR 介面卡、命令列工作流、顯示記憶體最佳化和梯度敏感度分析——社群開發的 **[Side-Step](https://github.com/koda-dernet/Side-Step)** 工具包提供了高階替代方案。其文件已收錄在本倉庫的 `docs/sidestep/` 目錄下。

| 主題 | 說明 |
|------|------|
| [Getting Started](../sidestep/Getting%20Started.md) | 安裝、前置條件和首次執行設定 |
| [End-to-End Tutorial](../sidestep/End-to-End%20Tutorial.md) | 從原始音訊到生成的完整流程 |
| [Dataset Preparation](../sidestep/Dataset%20Preparation.md) | JSON 格式、音訊要求、後設資料欄位、自定義標籤 |
| [Training Guide](../sidestep/Training%20Guide.md) | LoRA vs LoKR、修正模式 vs 原始模式、超參數指南 |
| [Using Your Adapter](../sidestep/Using%20Your%20Adapter.md) | 輸出目錄結構、在 Gradio 中載入、LoKR 限制 |
| [VRAM Optimization Guide](../sidestep/VRAM%20Optimization%20Guide.md) | 顯示記憶體最佳化策略和 GPU 分級配置 |
| [Estimation Guide](../sidestep/Estimation%20Guide.md) | 梯度敏感度分析，用於針對性訓練 |
| [Shift and Timestep Sampling](../sidestep/Shift%20and%20Timestep%20Sampling.md) | 訓練時間步的工作原理，Side-Step 與內建訓練器的區別 |
| [Preset Management](../sidestep/Preset%20Management.md) | 內建預設、儲存/載入/匯入/匯出 |
| [The Settings Wizard](../sidestep/The%20Settings%20Wizard.md) | 完整的嚮導設定參考 |
| [Model Management](../sidestep/Model%20Management.md) | 檢查點結構和微調模型支援 |
| [Windows Notes](../sidestep/Windows%20Notes.md) | Windows 特定的設定和注意事項 |
