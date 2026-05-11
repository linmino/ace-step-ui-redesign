# ACE-Step API 客戶端文件

**Language / 語言 / 言語:** [English](../en/API.md) | [繁體中文](API.md) | [日本語](../ja/API.md)

---

本服務提供基於 HTTP 的非同步音樂生成 API。

**基本工作流程**：
1. 呼叫 `POST /release_task` 提交任務並獲取 `task_id`。
2. 呼叫 `POST /query_result` 批次查詢任務狀態，直到 `status` 為 `1`（成功）或 `2`（失敗）。
3. 透過結果中返回的 `GET /v1/audio?path=...` URL 下載音訊檔案。

---

## 目錄

- [認證](#1-認證)
- [響應格式](#2-響應格式)
- [任務狀態說明](#3-任務狀態說明)
- [建立生成任務](#4-建立生成任務)
- [批次查詢任務結果](#5-批次查詢任務結果)
- [格式化輸入](#6-格式化輸入)
- [獲取隨機樣本](#7-獲取隨機樣本)
- [列出可用模型](#8-列出可用模型)
- [伺服器統計](#9-伺服器統計)
- [下載音訊檔案](#10-下載音訊檔案)
- [健康檢查](#11-健康檢查)
- [環境變數](#12-環境變數)

---

## 1. 認證

API 支援可選的 API Key 認證。啟用後，必須在請求中提供有效的金鑰。

### 認證方式

支援兩種認證方式：

**方式 A：請求體中的 ai_token**

```json
{
  "ai_token": "your-api-key",
  "prompt": "歡快的流行歌曲",
  ...
}
```

**方式 B：Authorization 頭**

```bash
curl -X POST http://localhost:8001/release_task \
  -H 'Authorization: Bearer your-api-key' \
  -H 'Content-Type: application/json' \
  -d '{"prompt": "歡快的流行歌曲"}'
```

### 配置 API Key

透過環境變數或命令列參數設定：

```bash
# 環境變數
export ACESTEP_API_KEY=your-secret-key

# 或命令列參數
python -m acestep.api_server --api-key your-secret-key
```

---

## 2. 響應格式

所有 API 響應使用統一的包裝格式：

```json
{
  "data": { ... },
  "code": 200,
  "error": null,
  "timestamp": 1700000000000,
  "extra": null
}
```

| 欄位 | 型別 | 說明 |
| :--- | :--- | :--- |
| `data` | any | 實際響應資料 |
| `code` | int | 狀態碼（200=成功）|
| `error` | string | 錯誤資訊（成功時為 null）|
| `timestamp` | int | 響應時間戳（毫秒）|
| `extra` | any | 額外資訊（通常為 null）|

---

## 3. 任務狀態說明

任務狀態（`status`）使用整數表示：

| 狀態碼 | 狀態名 | 說明 |
| :--- | :--- | :--- |
| `0` | queued/running | 任務排隊中或執行中 |
| `1` | succeeded | 生成成功，結果已就緒 |
| `2` | failed | 生成失敗 |

---

## 4. 建立生成任務

### 4.1 API 定義

- **URL**：`/release_task`
- **方法**：`POST`
- **Content-Type**：`application/json`、`multipart/form-data` 或 `application/x-www-form-urlencoded`

### 4.2 請求參數

#### 參數命名約定

API 支援大多數參數的 **snake_case** 和 **camelCase** 命名。例如：
- `audio_duration` / `duration` / `audioDuration`
- `key_scale` / `keyscale` / `keyScale`
- `time_signature` / `timesignature` / `timeSignature`
- `sample_query` / `sampleQuery` / `description` / `desc`
- `use_format` / `useFormat` / `format`

此外，後設資料可以透過巢狀物件傳遞（`metas`、`metadata` 或 `user_metadata`）。

#### 方法 A：JSON 請求（application/json）

適用於僅傳遞文字參數，或引用伺服器上已存在的音訊檔案路徑。

**基本參數**：

| 參數名 | 型別 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `prompt` | string | `""` | 音樂描述提示詞（別名：`caption`）|
| `lyrics` | string | `""` | 歌詞內容 |
| `thinking` | bool | `false` | 是否使用 5Hz LM 生成音訊程式碼（lm-dit 行為）|
| `vocal_language` | string | `"en"` | 歌詞語言（en、zh、ja 等）|
| `audio_format` | string | `"mp3"` | 輸出格式（mp3、wav、flac）|

**樣本/描述模式參數**：

| 參數名 | 型別 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `sample_mode` | bool | `false` | 啟用隨機樣本生成模式（透過 LM 自動生成 caption/lyrics/metas）|
| `sample_query` | string | `""` | 用於樣本生成的自然語言描述（例如"一首柔和的孟加拉情歌"）。別名：`description`、`desc` |
| `use_format` | bool | `false` | 使用 LM 增強/格式化提供的 caption 和 lyrics。別名：`format` |

**多模型支援**：

| 參數名 | 型別 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `model` | string | null | 選擇使用哪個 DiT 模型（例如 `"acestep-v15-turbo"`、`"acestep-v15-turbo-shift3"`）。使用 `/v1/models` 列出可用模型。如果未指定，使用預設模型。|

**thinking 語義（重要）**：

- `thinking=false`：
  - 伺服器**不會**使用 5Hz LM 生成 `audio_code_string`。
  - DiT 以 **text2music** 模式執行，**忽略**任何提供的 `audio_code_string`。
- `thinking=true`：
  - 伺服器將使用 5Hz LM 生成 `audio_code_string`（lm-dit 行為）。
  - DiT 使用 LM 生成的程式碼執行，以增強音樂品質。

**後設資料自動補全（條件性）**：

當 `use_cot_caption=true` 或 `use_cot_language=true` 或後設資料欄位缺失時，伺服器可能會呼叫 5Hz LM 根據 `caption`/`lyrics` 填充缺失的欄位：

- `bpm`
- `key_scale`
- `time_signature`
- `audio_duration`

使用者提供的值始終優先；LM 只填充空/缺失的欄位。

**音樂屬性參數**：

| 參數名 | 型別 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `bpm` | int | null | 指定節奏（BPM），範圍 30-300 |
| `key_scale` | string | `""` | 調性（例如"C Major"、"Am"）。別名：`keyscale`、`keyScale` |
| `time_signature` | string | `""` | 拍號（2、3、4、6 分別表示 2/4、3/4、4/4、6/8）。別名：`timesignature`、`timeSignature` |
| `audio_duration` | float | null | 生成時長（秒），範圍 10-600。別名：`duration`、`target_duration` |

**音訊程式碼（可選）**：

| 參數名 | 型別 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `audio_code_string` | string 或 string[] | `""` | 用於 `llm_dit` 的音訊語義令牌（5Hz）。別名：`audioCodeString` |

**生成控制參數**：

| 參數名 | 型別 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `inference_steps` | int | `8` | 推理步數。Turbo 模型：1-20（推薦 8）。Base 模型：1-200（推薦 32-64）|
| `guidance_scale` | float | `7.0` | 提示引導係數。僅對 base 模型有效 |
| `use_random_seed` | bool | `true` | 是否使用隨機種子 |
| `seed` | int | `-1` | 指定種子（當 use_random_seed=false 時）|
| `batch_size` | int | `2` | 批次生成數量（最多 8）|

**高階 DiT 參數**：

| 參數名 | 型別 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `shift` | float | `3.0` | 時間步偏移因子（範圍 1.0-5.0）。僅對 base 模型有效，對 turbo 模型無效 |
| `infer_method` | string | `"ode"` | 擴散推理方法：`"ode"`（Euler，更快）或 `"sde"`（隨機）|
| `timesteps` | string | null | 自定義時間步，逗號分隔值（例如 `"0.97,0.76,0.615,0.5,0.395,0.28,0.18,0.085,0"`）。覆蓋 `inference_steps` 和 `shift` |
| `use_adg` | bool | `false` | 使用自適應雙引導（僅 base 模型）|
| `cfg_interval_start` | float | `0.0` | CFG 應用起始比例（0.0-1.0）|
| `cfg_interval_end` | float | `1.0` | CFG 應用結束比例（0.0-1.0）|

**5Hz LM 參數（可選，伺服器端）**：

這些參數控制 5Hz LM 取樣，用於後設資料自動補全和（當 `thinking=true` 時）程式碼生成。

| 參數名 | 型別 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `lm_model_path` | string | null | 5Hz LM 檢查點目錄名（例如 `acestep-5Hz-lm-0.6B`）|
| `lm_backend` | string | `"vllm"` | `vllm` 或 `pt` |
| `lm_temperature` | float | `0.85` | 取樣溫度 |
| `lm_cfg_scale` | float | `2.5` | CFG 比例（>1 啟用 CFG）|
| `lm_negative_prompt` | string | `"NO USER INPUT"` | CFG 使用的負面提示 |
| `lm_top_k` | int | null | Top-k（0/null 禁用）|
| `lm_top_p` | float | `0.9` | Top-p（>=1 將被視為禁用）|
| `lm_repetition_penalty` | float | `1.0` | 重複懲罰 |

**LM CoT（思維鏈）參數**：

| 參數名 | 型別 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `use_cot_caption` | bool | `true` | 讓 LM 透過 CoT 推理重寫/增強輸入 caption。別名：`cot_caption`、`cot-caption` |
| `use_cot_language` | bool | `true` | 讓 LM 透過 CoT 檢測人聲語言。別名：`cot_language`、`cot-language` |
| `constrained_decoding` | bool | `true` | 啟用基於 FSM 的約束解碼以獲得結構化 LM 輸出。別名：`constrainedDecoding`、`constrained` |
| `constrained_decoding_debug` | bool | `false` | 啟用約束解碼的除錯日誌 |
| `allow_lm_batch` | bool | `true` | 允許 LM 批次處理以提高效率 |

**編輯/參考音訊參數**（需要伺服器上的絕對路徑）：

| 參數名 | 型別 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `reference_audio_path` | string | null | 參考音訊路徑（風格遷移）|
| `src_audio_path` | string | null | 源音訊路徑（重繪/翻唱）|
| `task_type` | string | `"text2music"` | 任務型別：`text2music`、`cover`、`repaint`、`lego`、`extract`、`complete` |
| `instruction` | string | auto | 編輯指令（如未提供則根據 task_type 自動生成）|
| `repainting_start` | float | `0.0` | 重繪開始時間（秒）|
| `repainting_end` | float | null | 重繪結束時間（秒），-1 表示音訊末尾 |
| `audio_cover_strength` | float | `1.0` | 翻唱強度（0.0-1.0）。風格遷移使用較小值（0.2）|

#### 方法 B：檔案上傳（multipart/form-data）

當需要上傳本地音訊檔案作為參考或源音訊時使用。

除了支援上述所有欄位作為表單欄位外，還支援以下檔案欄位：

- `reference_audio` 或 `ref_audio`：（檔案）上傳參考音訊檔案
- `src_audio` 或 `ctx_audio`：（檔案）上傳源音訊檔案

> **注意**：上傳檔案後，相應的 `_path` 參數將被自動忽略，系統將使用上傳後的臨時檔案路徑。

### 4.3 響應示例

```json
{
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "queued",
    "queue_position": 1
  },
  "code": 200,
  "error": null,
  "timestamp": 1700000000000,
  "extra": null
}
```

### 4.4 使用示例（cURL）

**基本 JSON 方法**：

```bash
curl -X POST http://localhost:8001/release_task \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "歡快的流行歌曲",
    "lyrics": "你好世界",
    "inference_steps": 8
  }'
```

**使用 thinking=true（LM 生成程式碼 + 填充缺失後設資料）**：

```bash
curl -X POST http://localhost:8001/release_task \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "歡快的流行歌曲",
    "lyrics": "你好世界",
    "thinking": true,
    "lm_temperature": 0.85,
    "lm_cfg_scale": 2.5
  }'
```

**描述驅動生成（sample_query）**：

```bash
curl -X POST http://localhost:8001/release_task \
  -H 'Content-Type: application/json' \
  -d '{
    "sample_query": "一首適合安靜夜晚的柔和孟加拉情歌",
    "thinking": true
  }'
```

**使用格式增強（use_format=true）**：

```bash
curl -X POST http://localhost:8001/release_task \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "流行搖滾",
    "lyrics": "[Verse 1]\n走在街上...",
    "use_format": true,
    "thinking": true
  }'
```

**選擇特定模型**：

```bash
curl -X POST http://localhost:8001/release_task \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "電子舞曲",
    "model": "acestep-v15-turbo",
    "thinking": true
  }'
```

**使用自定義時間步**：

```bash
curl -X POST http://localhost:8001/release_task \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "爵士鋼琴三重奏",
    "timesteps": "0.97,0.76,0.615,0.5,0.395,0.28,0.18,0.085,0",
    "thinking": true
  }'
```

**檔案上傳方法**：

```bash
curl -X POST http://localhost:8001/release_task \
  -F "prompt=重新混音這首歌" \
  -F "src_audio=@/path/to/local/song.mp3" \
  -F "task_type=repaint"
```

---

## 5. 批次查詢任務結果

### 5.1 API 定義

- **URL**：`/query_result`
- **方法**：`POST`
- **Content-Type**：`application/json` 或 `application/x-www-form-urlencoded`

### 5.2 請求參數

| 參數名 | 型別 | 說明 |
| :--- | :--- | :--- |
| `task_id_list` | string (JSON array) 或 array | 要查詢的任務 ID 列表 |

### 5.3 響應示例

```json
{
  "data": [
    {
      "task_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": 1,
      "result": "[{\"file\": \"/v1/audio?path=...\", \"wave\": \"\", \"status\": 1, \"create_time\": 1700000000, \"env\": \"development\", \"prompt\": \"歡快的流行歌曲\", \"lyrics\": \"你好世界\", \"metas\": {\"bpm\": 120, \"duration\": 30, \"genres\": \"\", \"keyscale\": \"C Major\", \"timesignature\": \"4\"}, \"generation_info\": \"...\", \"seed_value\": \"12345,67890\", \"lm_model\": \"acestep-5Hz-lm-0.6B\", \"dit_model\": \"acestep-v15-turbo\"}]"
    }
  ],
  "code": 200,
  "error": null,
  "timestamp": 1700000000000,
  "extra": null
}
```

**結果欄位說明**（result 為 JSON 字串，解析後包含）：

| 欄位 | 型別 | 說明 |
| :--- | :--- | :--- |
| `file` | string | 音訊檔案 URL（配合 `/v1/audio` 端點使用）|
| `wave` | string | 波形資料（通常為空）|
| `status` | int | 狀態碼（0=進行中，1=成功，2=失敗）|
| `create_time` | int | 建立時間（Unix 時間戳）|
| `env` | string | 環境標識 |
| `prompt` | string | 使用的提示詞 |
| `lyrics` | string | 使用的歌詞 |
| `metas` | object | 後設資料（bpm、duration、genres、keyscale、timesignature）|
| `generation_info` | string | 生成資訊摘要 |
| `seed_value` | string | 使用的種子值（逗號分隔）|
| `lm_model` | string | 使用的 LM 模型名稱 |
| `dit_model` | string | 使用的 DiT 模型名稱 |

### 5.4 使用示例

```bash
curl -X POST http://localhost:8001/query_result \
  -H 'Content-Type: application/json' \
  -d '{
    "task_id_list": ["550e8400-e29b-41d4-a716-446655440000"]
  }'
```

---

## 6. 格式化輸入

### 6.1 API 定義

- **URL**：`/format_input`
- **方法**：`POST`

此端點使用 LLM 增強和格式化使用者提供的 caption 和 lyrics。

### 6.2 請求參數

| 參數名 | 型別 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `prompt` | string | `""` | 音樂描述提示詞 |
| `lyrics` | string | `""` | 歌詞內容 |
| `temperature` | float | `0.85` | LM 取樣溫度 |
| `param_obj` | string (JSON) | `"{}"` | 包含後設資料的 JSON 物件（duration、bpm、key、time_signature、language）|

### 6.3 響應示例

```json
{
  "data": {
    "caption": "增強後的音樂描述",
    "lyrics": "格式化後的歌詞...",
    "bpm": 120,
    "key_scale": "C Major",
    "time_signature": "4",
    "duration": 180,
    "vocal_language": "zh"
  },
  "code": 200,
  "error": null,
  "timestamp": 1700000000000,
  "extra": null
}
```

### 6.4 使用示例

```bash
curl -X POST http://localhost:8001/format_input \
  -H 'Content-Type: application/json' \
  -d '{
    "prompt": "流行搖滾",
    "lyrics": "在街上漫步",
    "param_obj": "{\"duration\": 180, \"language\": \"zh\"}"
  }'
```

---

## 7. 獲取隨機樣本

### 7.1 API 定義

- **URL**：`/create_random_sample`
- **方法**：`POST`

此端點從預載入的示例資料中返回隨機樣本參數，用於表單填充。

### 7.2 請求參數

| 參數名 | 型別 | 預設值 | 說明 |
| :--- | :--- | :--- | :--- |
| `sample_type` | string | `"simple_mode"` | 樣本型別：`"simple_mode"` 或 `"custom_mode"` |

### 7.3 響應示例

```json
{
  "data": {
    "caption": "輕快的流行歌曲，帶有吉他伴奏",
    "lyrics": "[Verse 1]\n陽光灑在臉上...",
    "bpm": 120,
    "key_scale": "G Major",
    "time_signature": "4",
    "duration": 180,
    "vocal_language": "zh"
  },
  "code": 200,
  "error": null,
  "timestamp": 1700000000000,
  "extra": null
}
```

### 7.4 使用示例

```bash
curl -X POST http://localhost:8001/create_random_sample \
  -H 'Content-Type: application/json' \
  -d '{"sample_type": "simple_mode"}'
```

---

## 8. 列出可用模型

### 8.1 API 定義

- **URL**：`/v1/models`
- **方法**：`GET`

返回伺服器上載入的可用 DiT 模型列表。

### 8.2 響應示例

```json
{
  "data": {
    "models": [
      {
        "name": "acestep-v15-turbo",
        "is_default": true
      },
      {
        "name": "acestep-v15-turbo-shift3",
        "is_default": false
      }
    ],
    "default_model": "acestep-v15-turbo"
  },
  "code": 200,
  "error": null,
  "timestamp": 1700000000000,
  "extra": null
}
```

### 8.3 使用示例

```bash
curl http://localhost:8001/v1/models
```

---

## 9. 伺服器統計

### 9.1 API 定義

- **URL**：`/v1/stats`
- **方法**：`GET`

返回伺服器執行統計資訊。

### 9.2 響應示例

```json
{
  "data": {
    "jobs": {
      "total": 100,
      "queued": 5,
      "running": 1,
      "succeeded": 90,
      "failed": 4
    },
    "queue_size": 5,
    "queue_maxsize": 200,
    "avg_job_seconds": 8.5
  },
  "code": 200,
  "error": null,
  "timestamp": 1700000000000,
  "extra": null
}
```

### 9.3 使用示例

```bash
curl http://localhost:8001/v1/stats
```

---

## 10. 下載音訊檔案

### 10.1 API 定義

- **URL**：`/v1/audio`
- **方法**：`GET`

透過路徑下載生成的音訊檔案。

### 10.2 請求參數

| 參數名 | 型別 | 說明 |
| :--- | :--- | :--- |
| `path` | string | URL 編碼的音訊檔案路徑 |

### 10.3 使用示例

```bash
# 使用任務結果中的 URL 下載
curl "http://localhost:8001/v1/audio?path=%2Ftmp%2Fapi_audio%2Fabc123.mp3" -o output.mp3
```

---

## 11. 健康檢查

### 11.1 API 定義

- **URL**：`/health`
- **方法**：`GET`

返回服務健康狀態。

### 11.2 響應示例

```json
{
  "data": {
    "status": "ok",
    "service": "ACE-Step API",
    "version": "1.0"
  },
  "code": 200,
  "error": null,
  "timestamp": 1700000000000,
  "extra": null
}
```

---

## 12. 環境變數

API 伺服器可以透過環境變數進行配置：

### 伺服器配置

| 變數 | 預設值 | 說明 |
| :--- | :--- | :--- |
| `ACESTEP_API_HOST` | `127.0.0.1` | 伺服器繫結主機 |
| `ACESTEP_API_PORT` | `8001` | 伺服器繫結埠 |
| `ACESTEP_API_KEY` | （空）| API 認證金鑰（空則禁用認證）|
| `ACESTEP_API_WORKERS` | `1` | API 工作執行緒數 |

### 模型配置

| 變數 | 預設值 | 說明 |
| :--- | :--- | :--- |
| `ACESTEP_CONFIG_PATH` | `acestep-v15-turbo` | 主 DiT 模型路徑 |
| `ACESTEP_CONFIG_PATH2` | （空）| 輔助 DiT 模型路徑（可選）|
| `ACESTEP_CONFIG_PATH3` | （空）| 第三個 DiT 模型路徑（可選）|
| `ACESTEP_DEVICE` | `auto` | 模型載入裝置 |
| `ACESTEP_USE_FLASH_ATTENTION` | `true` | 啟用 flash attention |
| `ACESTEP_OFFLOAD_TO_CPU` | `false` | 空閒時將模型卸載到 CPU |
| `ACESTEP_OFFLOAD_DIT_TO_CPU` | `false` | 專門將 DiT 卸載到 CPU |

### LM 配置

| 變數 | 預設值 | 說明 |
| :--- | :--- | :--- |
| `ACESTEP_INIT_LLM` | auto | 是否在啟動時初始化 LM（auto 根據 GPU 自動決定）|
| `ACESTEP_LM_MODEL_PATH` | `acestep-5Hz-lm-0.6B` | 預設 5Hz LM 模型 |
| `ACESTEP_LM_BACKEND` | `vllm` | LM 後端（vllm 或 pt）|
| `ACESTEP_LM_DEVICE` | （與 ACESTEP_DEVICE 相同）| LM 裝置 |
| `ACESTEP_LM_OFFLOAD_TO_CPU` | `false` | 將 LM 卸載到 CPU |

### 佇列配置

| 變數 | 預設值 | 說明 |
| :--- | :--- | :--- |
| `ACESTEP_QUEUE_MAXSIZE` | `200` | 最大佇列大小 |
| `ACESTEP_QUEUE_WORKERS` | `1` | 佇列工作者數量 |
| `ACESTEP_AVG_JOB_SECONDS` | `5.0` | 初始平均任務持續時間估算 |
| `ACESTEP_AVG_WINDOW` | `50` | 平均任務時間計算視窗 |

### 快取配置

| 變數 | 預設值 | 說明 |
| :--- | :--- | :--- |
| `ACESTEP_TMPDIR` | `.cache/acestep/tmp` | 臨時檔案目錄 |
| `TRITON_CACHE_DIR` | `.cache/acestep/triton` | Triton 快取目錄 |
| `TORCHINDUCTOR_CACHE_DIR` | `.cache/acestep/torchinductor` | TorchInductor 快取目錄 |

---

## 錯誤處理

**HTTP 狀態碼**：

- `200`：成功
- `400`：無效請求（錯誤的 JSON、缺少欄位）
- `401`：未授權（缺少或無效的 API Key）
- `404`：資源未找到
- `415`：不支援的 Content-Type
- `429`：伺服器繁忙（佇列已滿）
- `500`：內部伺服器錯誤

**錯誤響應格式**：

```json
{
  "detail": "描述問題的錯誤訊息"
}
```

---

## 最佳實踐

1. **使用 `thinking=true`** 以獲得 LM 增強生成的最佳品質結果。

2. **使用 `sample_query`/`description`** 從自然語言描述快速生成。

3. **使用 `use_format=true`** 當你有 caption/lyrics 但希望 LM 增強它們時。

4. **批次查詢任務狀態** 使用 `/query_result` 端點一次查詢多個任務。

5. **檢查 `/v1/stats`** 響應來了解伺服器負載和平均任務時間。

6. **使用多模型支援** 透過設定 `ACESTEP_CONFIG_PATH2` 和 `ACESTEP_CONFIG_PATH3` 環境變數，然後透過 `model` 參數選擇。

7. **生產環境** 中，設定 `ACESTEP_API_KEY` 以啟用認證，保護 API 安全。

8. **低顯示記憶體環境** 中，啟用 `ACESTEP_OFFLOAD_TO_CPU=true` 以支援更長的音訊生成。
