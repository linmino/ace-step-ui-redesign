# ACE-Step OpenRouter API 文件

> 相容 OpenAI Chat Completions 格式的 AI 音樂生成介面

**Base URL:** `http://{host}:{port}` (預設 `http://127.0.0.1:8002`)

---

## 目錄

- [認證](#認證)
- [介面列表](#介面列表)
  - [POST /v1/chat/completions - 生成音樂](#1-生成音樂)
  - [GET /v1/models - 模型列表](#2-模型列表)
  - [GET /health - 健康檢查](#3-健康檢查)
- [輸入模式](#輸入模式)
- [音訊輸入](#音訊輸入)
- [流式響應](#流式響應)
- [完整示例](#完整示例)
- [錯誤碼](#錯誤碼)

---

## 認證

如果服務端配置了 API Key（環境變數 `OPENROUTER_API_KEY` 或啟動參數 `--api-key`），所有請求需在 Header 中攜帶：

```
Authorization: Bearer <your-api-key>
```

未配置 API Key 時無需認證。

---

## 介面列表

### 1. 生成音樂

**POST** `/v1/chat/completions`

透過聊天訊息生成音樂，返回音訊資料和 LM 生成的元資訊。

#### 請求參數

| 欄位 | 型別 | 必填 | 預設值 | 說明 |
|---|---|---|---|---|
| `model` | string | 否 | 自動 | 模型 ID（從 `/v1/models` 獲取） |
| `messages` | array | **是** | - | 聊天訊息列表，見 [輸入模式](#輸入模式) |
| `stream` | boolean | 否 | `false` | 是否啟用流式返回，見 [流式響應](#流式響應) |
| `audio_config` | object | 否 | `null` | 音訊生成配置，見下方 |
| `temperature` | float | 否 | `0.85` | LM 取樣溫度 |
| `top_p` | float | 否 | `0.9` | LM nucleus sampling |
| `seed` | int \| string | 否 | `null` | 隨機種子。`batch_size > 1` 時可用逗號分隔指定多個，如 `"42,123,456"` |
| `lyrics` | string | 否 | `""` | 直接傳入歌詞（優先順序高於 messages 中解析的歌詞），此時 messages 文字作為 prompt |
| `sample_mode` | boolean | 否 | `false` | 啟用 LLM sample 模式，messages 文字作為 sample_query 由 LLM 自動生成 prompt/lyrics |
| `thinking` | boolean | 否 | `false` | 是否啟用 LLM thinking 模式（更深度推理） |
| `use_format` | boolean | 否 | `false` | 當使用者提供 prompt/lyrics 時，是否先透過 LLM 格式化增強 |
| `use_cot_caption` | boolean | 否 | `true` | 是否透過 CoT 改寫/增強音樂描述 |
| `use_cot_language` | boolean | 否 | `true` | 是否透過 CoT 自動檢測歌詞語言 |
| `guidance_scale` | float | 否 | `7.0` | Classifier-free guidance scale |
| `batch_size` | int | 否 | `1` | 生成音訊數量 |
| `task_type` | string | 否 | `"text2music"` | 任務型別，見 [音訊輸入](#音訊輸入) |
| `repainting_start` | float | 否 | `0.0` | repaint 區域起始位置（秒） |
| `repainting_end` | float | 否 | `null` | repaint 區域結束位置（秒） |
| `audio_cover_strength` | float | 否 | `1.0` | cover 強度 (0.0~1.0) |

#### audio_config 物件

| 欄位 | 型別 | 預設值 | 說明 |
|---|---|---|---|
| `duration` | float | `null` | 音訊時長（秒），不傳由 LM 自動決定 |
| `bpm` | integer | `null` | 每分鐘節拍數，不傳由 LM 自動決定 |
| `vocal_language` | string | `"en"` | 歌詞語言程式碼（如 `"zh"`, `"en"`, `"ja"`） |
| `instrumental` | boolean | `null` | 是否為純器樂（無人聲）。不傳時根據歌詞自動判斷 |
| `format` | string | `"mp3"` | 輸出音訊格式 |
| `key_scale` | string | `null` | 調號（如 `"C major"`） |
| `time_signature` | string | `null` | 拍號（如 `"4/4"`） |

> **messages 文字含義取決於模式：**
> - 設定了 `lyrics` → messages 文字 = caption
> - 設定了 `sample_mode: true` → messages 文字 = sample_query（交給 LLM 生成一切）
> - 均未設定 → 自動檢測：有標籤走標籤模式，像歌詞走歌詞模式，否則作為 caption 直接傳入生成

#### messages 格式

支援純文字和多模態（文字 + 音訊）兩種格式：

**純文字：**

```json
{
  "messages": [
    {"role": "user", "content": "你的輸入內容"}
  ]
}
```

**多模態（含音訊輸入）：**

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "翻唱這首歌"},
        {
          "type": "input_audio",
          "input_audio": {
            "data": "<base64 音訊資料>",
            "format": "mp3"
          }
        }
      ]
    }
  ]
}
```

---

#### 非流式響應 (`stream: false`)

```json
{
  "id": "chatcmpl-a1b2c3d4e5f6g7h8",
  "object": "chat.completion",
  "created": 1706688000,
  "model": "acemusic/acestep-v15-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "## Metadata\n**Caption:** Upbeat pop song...\n**BPM:** 120\n**Duration:** 30s\n**Key:** C major\n\n## Lyrics\n[Verse 1]\nHello world...",
        "audio": [
          {
            "type": "audio_url",
            "audio_url": {
              "url": "data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAA..."
            }
          }
        ]
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 100,
    "total_tokens": 110
  }
}
```

**響應欄位說明：**

| 欄位 | 說明 |
|---|---|
| `choices[0].message.content` | LM 生成的文字資訊，包含 Metadata（Caption/BPM/Duration/Key/Time Signature/Language）和 Lyrics。如果 LM 未參與，返回 `"Music generated successfully."` |
| `choices[0].message.audio` | 音訊資料陣列，每項包含 `type` (`"audio_url"`) 和 `audio_url.url`（Base64 Data URL，格式 `data:audio/mpeg;base64,...`） |
| `choices[0].finish_reason` | `"stop"` 表示正常完成 |

**音訊解碼格式：**

`audio_url.url` 值為 Data URL 格式：`data:audio/mpeg;base64,<base64_data>`

客戶端提取 base64 資料部分後解碼即可得到 MP3 檔案：

```python
import base64

url = response["choices"][0]["message"]["audio"][0]["audio_url"]["url"]
# 去掉 "data:audio/mpeg;base64," 前綴
b64_data = url.split(",", 1)[1]
audio_bytes = base64.b64decode(b64_data)

with open("output.mp3", "wb") as f:
    f.write(audio_bytes)
```

```javascript
const url = response.choices[0].message.audio[0].audio_url.url;
const b64Data = url.split(",")[1];
const audioBytes = atob(b64Data);
// 或直接用於 <audio> 標籤
const audio = new Audio(url);
audio.play();
```

---

### 2. 模型列表

**GET** `/v1/models`

返回可用模型資訊。

#### 響應

```json
{
  "data": [
    {
      "id": "acemusic/acestep-v15-turbo",
      "name": "ACE-Step",
      "created": 1706688000,
      "description": "High-performance text-to-music generation model. Supports multiple styles, lyrics input, and various audio durations.",
      "input_modalities": ["text", "audio"],
      "output_modalities": ["audio", "text"],
      "context_length": 4096,
      "pricing": {"prompt": "0", "completion": "0", "request": "0"},
      "supported_sampling_parameters": ["temperature", "top_p"]
    }
  ]
}
```

---

### 3. 健康檢查

**GET** `/health`

#### 響應

```json
{
  "status": "ok",
  "service": "ACE-Step OpenRouter API",
  "version": "1.0"
}
```

---

## 輸入模式

系統根據 `messages` 中最後一條 `user` 訊息的內容自動選擇輸入模式。也可透過 `lyrics` 或 `sample_mode` 欄位顯式指定。

### 模式 1: 標籤模式（推薦）

使用 `<prompt>` 和 `<lyrics>` 標籤明確指定音樂描述和歌詞：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "<prompt>A gentle acoustic ballad in C major, female vocal</prompt>\n<lyrics>[Verse 1]\nSunlight through the window\nA brand new day begins\n\n[Chorus]\nWe are the dreamers\nWe are the light</lyrics>"
    }
  ],
  "audio_config": {
    "duration": 30,
    "vocal_language": "en"
  }
}
```

- `<prompt>...</prompt>` — 音樂風格/場景描述（即 caption）
- `<lyrics>...</lyrics>` — 歌詞內容
- 兩個標籤可以只傳其中一個
- 當 `use_format: true` 時，LLM 會自動增強 prompt 和 lyrics

### 模式 2: 自然語言模式（Sample 模式）

直接用自然語言描述想要的音樂，系統自動透過 LLM 生成 prompt 和 lyrics：

```json
{
  "messages": [
    {"role": "user", "content": "幫我生成一首歡快的中文流行歌曲，關於夏天和旅行"}
  ],
  "sample_mode": true,
  "audio_config": {
    "vocal_language": "zh"
  }
}
```

觸發條件：`sample_mode: true`，或訊息內容不包含標籤且不像歌詞時自動觸發。

### 模式 3: 純歌詞模式

直接傳入帶結構標記的歌詞，系統自動識別：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "[Verse 1]\nWalking down the street\nFeeling the beat\n\n[Chorus]\nDance with me tonight\nUnder the moonlight"
    }
  ],
  "audio_config": {"duration": 30}
}
```

觸發條件：訊息內容包含 `[Verse]`、`[Chorus]` 等標記，或有多行短文字結構。

### 模式 4: 歌詞 + Prompt 分離

透過 `lyrics` 欄位直接傳入歌詞，messages 文字自動作為 prompt：

```json
{
  "messages": [
    {"role": "user", "content": "Energetic EDM with heavy bass drops"}
  ],
  "lyrics": "[Verse 1]\nFeel the rhythm in your soul\nLet the music take control\n\n[Drop]\n(instrumental break)",
  "audio_config": {
    "bpm": 128,
    "duration": 60
  }
}
```

### 器樂模式

設定 `audio_config.instrumental: true`：

```json
{
  "messages": [
    {"role": "user", "content": "<prompt>Epic orchestral cinematic score, dramatic and powerful</prompt>"}
  ],
  "audio_config": {
    "instrumental": true,
    "duration": 30
  }
}
```

---

## 音訊輸入

支援透過多模態 messages 傳入音訊檔案（base64 編碼），用於 cover、repaint 等任務。

### task_type 型別

| task_type | 說明 | 需要音訊輸入 |
|---|---|---|
| `text2music` | 文字生成音樂（預設） | 可選（作為 reference） |
| `cover` | 翻唱/風格遷移 | 需要 src_audio |
| `repaint` | 局部重繪 | 需要 src_audio |
| `lego` | 音訊拼接 | 需要 src_audio |
| `extract` | 音訊提取 | 需要 src_audio |
| `complete` | 音訊續寫 | 需要 src_audio |

### 音訊路由規則

多個 `input_audio` 塊按順序路由到不同參數（類似多圖片上傳）：

| task_type | audio[0] | audio[1] |
|---|---|---|
| `text2music` | reference_audio（風格參考） | - |
| `cover/repaint/lego/extract/complete` | src_audio（待編輯音訊） | reference_audio（可選風格參考） |

### 音訊輸入示例

**Cover 任務（翻唱）：**

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "<prompt>Jazz style cover with saxophone</prompt>"},
        {
          "type": "input_audio",
          "input_audio": {"data": "<base64 原始音訊>", "format": "mp3"}
        }
      ]
    }
  ],
  "task_type": "cover",
  "audio_cover_strength": 0.8,
  "audio_config": {"duration": 30}
}
```

**Repaint 任務（局部重繪）：**

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {"type": "text", "text": "<prompt>Replace with guitar solo</prompt>"},
        {
          "type": "input_audio",
          "input_audio": {"data": "<base64 原始音訊>", "format": "mp3"}
        }
      ]
    }
  ],
  "task_type": "repaint",
  "repainting_start": 10.0,
  "repainting_end": 20.0,
  "audio_config": {"duration": 30}
}
```

---

## 流式響應

設定 `"stream": true` 啟用 SSE（Server-Sent Events）流式返回。

### 事件格式

每個事件以 `data: ` 開頭，後跟 JSON，以雙換行 `\n\n` 結尾：

```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1706688000,"model":"acemusic/acestep-v15-turbo","choices":[{"index":0,"delta":{...},"finish_reason":null}]}

```

### 流式事件順序

| 階段 | delta 內容 | 說明 |
|---|---|---|
| 1. 初始化 | `{"role":"assistant","content":""}` | 建立連線 |
| 2. LM 內容 | `{"content":"\n\n## Metadata\n..."}` | LM 參與時推送 metadata 和 lyrics |
| 3. 心跳 | `{"content":"."}` | 音訊生成期間每 2 秒傳送，保持連線 |
| 4. 音訊資料 | `{"audio":[{"type":"audio_url","audio_url":{"url":"data:..."}}]}` | 音訊 base64 |
| 5. 結束 | `finish_reason: "stop"` | 生成完成 |
| 6. 終止 | `data: [DONE]` | 流結束標記 |

### 流式響應示例

```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1706688000,"model":"acemusic/acestep-v15-turbo","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1706688000,"model":"acemusic/acestep-v15-turbo","choices":[{"index":0,"delta":{"content":"\n\n## Metadata\n**Caption:** Upbeat pop\n**BPM:** 120"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1706688000,"model":"acemusic/acestep-v15-turbo","choices":[{"index":0,"delta":{"content":"."},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1706688000,"model":"acemusic/acestep-v15-turbo","choices":[{"index":0,"delta":{"audio":[{"type":"audio_url","audio_url":{"url":"data:audio/mpeg;base64,..."}}]},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1706688000,"model":"acemusic/acestep-v15-turbo","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]

```

### 客戶端處理流式響應

```python
import json
import httpx

with httpx.stream("POST", "http://127.0.0.1:8002/v1/chat/completions", json={
    "messages": [{"role": "user", "content": "生成一首輕快的吉他曲"}],
    "sample_mode": True,
    "stream": True,
    "audio_config": {"instrumental": True}
}) as response:
    content_parts = []
    audio_url = None

    for line in response.iter_lines():
        if not line or not line.startswith("data: "):
            continue
        if line == "data: [DONE]":
            break

        chunk = json.loads(line[6:])
        delta = chunk["choices"][0]["delta"]

        if "content" in delta and delta["content"]:
            content_parts.append(delta["content"])

        if "audio" in delta and delta["audio"]:
            audio_url = delta["audio"][0]["audio_url"]["url"]

        if chunk["choices"][0].get("finish_reason") == "stop":
            print("Generation complete!")

    print("Content:", "".join(content_parts))
    if audio_url:
        import base64
        b64_data = audio_url.split(",", 1)[1]
        with open("output.mp3", "wb") as f:
            f.write(base64.b64decode(b64_data))
```

```javascript
const response = await fetch("http://127.0.0.1:8002/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    messages: [{ role: "user", content: "生成一首輕快的吉他曲" }],
    sample_mode: true,
    stream: true,
    audio_config: { instrumental: true }
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let audioUrl = null;
let content = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value);
  for (const line of text.split("\n")) {
    if (!line.startsWith("data: ") || line === "data: [DONE]") continue;

    const chunk = JSON.parse(line.slice(6));
    const delta = chunk.choices[0].delta;

    if (delta.content) content += delta.content;
    if (delta.audio) audioUrl = delta.audio[0].audio_url.url;
  }
}

// audioUrl 可直接用於 <audio src="...">
```

---

## 完整示例

### 示例 1: 自然語言生成（最簡用法）

```bash
curl -X POST http://127.0.0.1:8002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "一首溫柔的中文民謠，關於故鄉和回憶"}
    ],
    "sample_mode": true,
    "audio_config": {"vocal_language": "zh"}
  }'
```

### 示例 2: 標籤模式 + 指定參數

```bash
curl -X POST http://127.0.0.1:8002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "<prompt>Energetic EDM track with heavy bass drops and synth leads</prompt><lyrics>[Verse 1]\nFeel the rhythm in your soul\nLet the music take control\n\n[Drop]\n(instrumental break)</lyrics>"
      }
    ],
    "audio_config": {
      "bpm": 128,
      "duration": 60,
      "vocal_language": "en"
    }
  }'
```

### 示例 3: 純器樂 + 關閉 LM 增強

```bash
curl -X POST http://127.0.0.1:8002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "<prompt>Peaceful piano solo, slow tempo, jazz harmony</prompt>"
      }
    ],
    "use_cot_caption": false,
    "audio_config": {
      "instrumental": true,
      "duration": 45
    }
  }'
```

### 示例 4: 流式請求

```bash
curl -X POST http://127.0.0.1:8002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -N \
  -d '{
    "messages": [
      {"role": "user", "content": "Generate a happy birthday song"}
    ],
    "sample_mode": true,
    "stream": true
  }'
```

### 示例 5: 多種子批次生成

```bash
curl -X POST http://127.0.0.1:8002/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "<prompt>Lo-fi hip hop beat</prompt>"}
    ],
    "batch_size": 3,
    "seed": "42,123,456",
    "audio_config": {
      "instrumental": true,
      "duration": 30
    }
  }'
```

---

## 錯誤碼

| HTTP 狀態碼 | 說明 |
|---|---|
| 400 | 請求格式錯誤或缺少有效輸入 |
| 401 | API Key 缺失或無效 |
| 429 | 服務繁忙，佇列已滿 |
| 500 | 音樂生成過程中發生內部錯誤 |
| 503 | 模型尚未初始化完成 |
| 504 | 生成超時 |

錯誤響應格式：

```json
{
  "detail": "錯誤描述資訊"
}
```

---

## 環境變數配置

以下環境變數可用於配置服務端（供運維參考）：

| 變數名 | 預設值 | 說明 |
|---|---|---|
| `OPENROUTER_API_KEY` | 無 | API 認證金鑰 |
| `OPENROUTER_HOST` | `127.0.0.1` | 監聽地址 |
| `OPENROUTER_PORT` | `8002` | 監聽埠 |
| `ACESTEP_CONFIG_PATH` | `acestep-v15-turbo` | DiT 模型配置路徑 |
| `ACESTEP_DEVICE` | `auto` | 推理裝置 |
| `ACESTEP_LM_MODEL_PATH` | `acestep-5Hz-lm-0.6B` | LLM 模型路徑 |
| `ACESTEP_LM_BACKEND` | `vllm` | LLM 推理後端 |
| `ACESTEP_QUEUE_MAXSIZE` | `200` | 任務佇列最大容量 |
| `ACESTEP_GENERATION_TIMEOUT` | `600` | 非流式請求超時（秒） |
