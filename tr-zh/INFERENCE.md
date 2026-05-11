# ACE-Step 推理 API 文件

**Language / 語言 / 言語:** [English](../en/INFERENCE.md) | [繁體中文](INFERENCE.md) | [日本語](../ja/INFERENCE.md)

---

本文件提供 ACE-Step 推理 API 的綜合文件，包括所有支援任務型別的參數規範。

## 目錄

- [快速開始](#快速開始)
- [API 概述](#api-概述)
- [GenerationParams 參數](#generationparams-參數)
- [GenerationConfig 參數](#generationconfig-參數)
- [任務型別](#任務型別)
- [輔助函式](#輔助函式)
- [完整示例](#完整示例)
- [最佳實踐](#最佳實踐)

---

## 快速開始

### 基本用法

```python
from acestep.handler import AceStepHandler
from acestep.llm_inference import LLMHandler
from acestep.inference import GenerationParams, GenerationConfig, generate_music

# 初始化處理器
dit_handler = AceStepHandler()
llm_handler = LLMHandler()

# 初始化服務
dit_handler.initialize_service(
    project_root="/path/to/project",
    config_path="acestep-v15-turbo",
    device="cuda"
)

llm_handler.initialize(
    checkpoint_dir="/path/to/checkpoints",
    lm_model_path="acestep-5Hz-lm-0.6B",
    backend="vllm",
    device="cuda"
)

# 配置生成參數
params = GenerationParams(
    caption="歡快的電子舞曲，重低音",
    bpm=128,
    duration=30,
)

# 配置生成設定
config = GenerationConfig(
    batch_size=2,
    audio_format="flac",
)

# 生成音樂
result = generate_music(dit_handler, llm_handler, params, config, save_dir="/path/to/output")

# 訪問結果
if result.success:
    for audio in result.audios:
        print(f"已生成：{audio['path']}")
        print(f"Key：{audio['key']}")
        print(f"Seed：{audio['params']['seed']}")
else:
    print(f"錯誤：{result.error}")
```

---

## API 概述

### 主要函式

#### generate_music

```python
def generate_music(
    dit_handler,
    llm_handler,
    params: GenerationParams,
    config: GenerationConfig,
    save_dir: Optional[str] = None,
    progress=None,
) -> GenerationResult
```

使用 ACE-Step 模型生成音樂的主函式。

#### understand_music

```python
def understand_music(
    llm_handler,
    audio_codes: str,
    temperature: float = 0.85,
    top_k: Optional[int] = None,
    top_p: Optional[float] = None,
    repetition_penalty: float = 1.0,
    use_constrained_decoding: bool = True,
    constrained_decoding_debug: bool = False,
) -> UnderstandResult
```

分析音訊語義程式碼並提取後設資料（caption、lyrics、BPM、調性等）。

#### create_sample

```python
def create_sample(
    llm_handler,
    query: str,
    instrumental: bool = False,
    vocal_language: Optional[str] = None,
    temperature: float = 0.85,
    top_k: Optional[int] = None,
    top_p: Optional[float] = None,
    repetition_penalty: float = 1.0,
    use_constrained_decoding: bool = True,
    constrained_decoding_debug: bool = False,
) -> CreateSampleResult
```

從自然語言描述生成完整的音樂樣本（caption、lyrics、後設資料）。

#### format_sample

```python
def format_sample(
    llm_handler,
    caption: str,
    lyrics: str,
    user_metadata: Optional[Dict[str, Any]] = None,
    temperature: float = 0.85,
    top_k: Optional[int] = None,
    top_p: Optional[float] = None,
    repetition_penalty: float = 1.0,
    use_constrained_decoding: bool = True,
    constrained_decoding_debug: bool = False,
) -> FormatSampleResult
```

格式化和增強使用者提供的 caption 和 lyrics，生成結構化後設資料。

### 配置物件

API 使用兩個配置資料類：

**GenerationParams** - 包含所有音樂生成參數：

```python
@dataclass
class GenerationParams:
    # 任務和指令
    task_type: str = "text2music"
    instruction: str = "Fill the audio semantic mask based on the given conditions:"
    
    # 音訊上傳
    reference_audio: Optional[str] = None
    src_audio: Optional[str] = None
    
    # LM 程式碼提示
    audio_codes: str = ""
    
    # 文字輸入
    caption: str = ""
    lyrics: str = ""
    instrumental: bool = False
    
    # 後設資料
    vocal_language: str = "unknown"
    bpm: Optional[int] = None
    keyscale: str = ""
    timesignature: str = ""
    duration: float = -1.0
    
    # 高階設定
    inference_steps: int = 8
    seed: int = -1
    guidance_scale: float = 7.0
    use_adg: bool = False
    cfg_interval_start: float = 0.0
    cfg_interval_end: float = 1.0
    shift: float = 1.0                    # 新增：時間步偏移因子
    infer_method: str = "ode"             # 新增：擴散推理方法
    timesteps: Optional[List[float]] = None  # 新增：自定義時間步
    
    repainting_start: float = 0.0
    repainting_end: float = -1
    audio_cover_strength: float = 1.0
    
    # 5Hz 語言模型參數
    thinking: bool = True
    lm_temperature: float = 0.85
    lm_cfg_scale: float = 2.0
    lm_top_k: int = 0
    lm_top_p: float = 0.9
    lm_negative_prompt: str = "NO USER INPUT"
    use_cot_metas: bool = True
    use_cot_caption: bool = True
    use_cot_lyrics: bool = False
    use_cot_language: bool = True
    use_constrained_decoding: bool = True
    
    # CoT 生成的值（由 LM 自動填充）
    cot_bpm: Optional[int] = None
    cot_keyscale: str = ""
    cot_timesignature: str = ""
    cot_duration: Optional[float] = None
    cot_vocal_language: str = "unknown"
    cot_caption: str = ""
    cot_lyrics: str = ""
```

**GenerationConfig** - 包含批處理和輸出配置：

```python
@dataclass
class GenerationConfig:
    batch_size: int = 2
    allow_lm_batch: bool = False
    use_random_seed: bool = True
    seeds: Optional[List[int]] = None
    lm_batch_chunk_size: int = 8
    constrained_decoding_debug: bool = False
    audio_format: str = "flac"
```

### 結果物件

**GenerationResult** - 音樂生成結果：

```python
@dataclass
class GenerationResult:
    # 音訊輸出
    audios: List[Dict[str, Any]]  # 音訊字典列表
    
    # 生成資訊
    status_message: str           # 生成狀態訊息
    extra_outputs: Dict[str, Any] # 額外輸出（latents、masks、lm_metadata、time_costs）
    
    # 成功狀態
    success: bool                 # 生成是否成功
    error: Optional[str]          # 失敗時的錯誤訊息
```

**音訊字典結構：**

`audios` 列表中的每個專案包含：

```python
{
    "path": str,           # 儲存的音訊檔案路徑
    "tensor": Tensor,      # 音訊張量 [channels, samples]，CPU，float32
    "key": str,            # 唯一音訊鍵（基於參數的 UUID）
    "sample_rate": int,    # 取樣率（預設：48000）
    "params": Dict,        # 此音訊的生成參數（包括 seed、audio_codes 等）
}
```

**UnderstandResult** - 音樂理解結果：

```python
@dataclass
class UnderstandResult:
    # 後設資料欄位
    caption: str = ""
    lyrics: str = ""
    bpm: Optional[int] = None
    duration: Optional[float] = None
    keyscale: str = ""
    language: str = ""
    timesignature: str = ""
    
    # 狀態
    status_message: str = ""
    success: bool = True
    error: Optional[str] = None
```

**CreateSampleResult** - 樣本建立結果：

```python
@dataclass
class CreateSampleResult:
    # 後設資料欄位
    caption: str = ""
    lyrics: str = ""
    bpm: Optional[int] = None
    duration: Optional[float] = None
    keyscale: str = ""
    language: str = ""
    timesignature: str = ""
    instrumental: bool = False
    
    # 狀態
    status_message: str = ""
    success: bool = True
    error: Optional[str] = None
```

**FormatSampleResult** - 樣本格式化結果：

```python
@dataclass
class FormatSampleResult:
    # 後設資料欄位
    caption: str = ""
    lyrics: str = ""
    bpm: Optional[int] = None
    duration: Optional[float] = None
    keyscale: str = ""
    language: str = ""
    timesignature: str = ""
    
    # 狀態
    status_message: str = ""
    success: bool = True
    error: Optional[str] = None
```

---

## GenerationParams 參數

### 文字輸入

| 參數 | 型別 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `caption` | `str` | `""` | 期望音樂的文字描述。可以是簡單提示如"放鬆的鋼琴音樂"，或包含風格、情緒、樂器等的詳細描述。最多 512 字元。|
| `lyrics` | `str` | `""` | 人聲音樂的歌詞文字。純音樂使用 `"[Instrumental]"`。支援多種語言。最多 4096 字元。|
| `instrumental` | `bool` | `False` | 如果為 True，無論歌詞如何都生成純音樂。|

### 音樂後設資料

| 參數 | 型別 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `bpm` | `Optional[int]` | `None` | 每分鐘節拍數（30-300）。`None` 啟用透過 LM 自動檢測。|
| `keyscale` | `str` | `""` | 音樂調性（例如"C Major"、"Am"、"F# minor"）。空字串啟用自動檢測。|
| `timesignature` | `str` | `""` | 拍號（2 表示 '2/4'，3 表示 '3/4'，4 表示 '4/4'，6 表示 '6/8'）。空字串啟用自動檢測。|
| `vocal_language` | `str` | `"unknown"` | 人聲語言程式碼（ISO 639-1）。支援：`"en"`、`"zh"`、`"ja"`、`"es"`、`"fr"` 等。使用 `"unknown"` 自動檢測。|
| `duration` | `float` | `-1.0` | 目標音訊長度（秒）（10-600）。如果 <= 0 或 None，模型根據歌詞長度自動選擇。|

### 生成參數

| 參數 | 型別 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `inference_steps` | `int` | `8` | 去噪步數。Turbo 模型：1-20（推薦 8）。Base 模型：1-200（推薦 32-64）。越高 = 品質越好但更慢。|
| `guidance_scale` | `float` | `7.0` | 無分類器引導比例（1.0-15.0）。較高的值增加對文字提示的遵循度。僅支援非 turbo 模型。典型範圍：5.0-9.0。|
| `seed` | `int` | `-1` | 用於可重複性的隨機種子。使用 `-1` 表示隨機種子，或任何正整數表示固定種子。|

### 高階 DiT 參數

| 參數 | 型別 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `use_adg` | `bool` | `False` | 使用自適應雙引導（僅 base 模型）。以速度為代價提高品質。|
| `cfg_interval_start` | `float` | `0.0` | CFG 應用起始比例（0.0-1.0）。控制何時開始應用無分類器引導。|
| `cfg_interval_end` | `float` | `1.0` | CFG 應用結束比例（0.0-1.0）。控制何時停止應用無分類器引導。|
| `shift` | `float` | `1.0` | 時間步偏移因子（範圍 1.0-5.0，預設 1.0）。當 != 1.0 時，對時間步應用 `t = shift * t / (1 + (shift - 1) * t)`。turbo 模型推薦 3.0。|
| `infer_method` | `str` | `"ode"` | 擴散推理方法。`"ode"`（Euler）更快且確定性。`"sde"`（隨機）可能產生不同的帶方差結果。|
| `timesteps` | `Optional[List[float]]` | `None` | 自定義時間步，從 1.0 到 0.0 的浮點數列表（例如 `[0.97, 0.76, 0.615, 0.5, 0.395, 0.28, 0.18, 0.085, 0]`）。如果提供，覆蓋 `inference_steps` 和 `shift`。|

### 任務特定參數

| 參數 | 型別 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `task_type` | `str` | `"text2music"` | 生成任務型別。詳見[任務型別](#任務型別)部分。|
| `instruction` | `str` | `"Fill the audio semantic mask based on the given conditions:"` | 任務特定指令提示。|
| `reference_audio` | `Optional[str]` | `None` | 用於風格遷移或續寫任務的參考音訊檔案路徑。|
| `src_audio` | `Optional[str]` | `None` | 用於音訊到音訊任務（cover、repaint 等）的源音訊檔案路徑。|
| `audio_codes` | `str` | `""` | 預提取的 5Hz 音訊語義程式碼字串。僅供高階使用。|
| `repainting_start` | `float` | `0.0` | 重繪開始時間（秒）（用於 repaint/lego 任務）。|
| `repainting_end` | `float` | `-1` | 重繪結束時間（秒）。使用 `-1` 表示音訊末尾。|
| `audio_cover_strength` | `float` | `1.0` | 音訊 cover/程式碼影響強度（0.0-1.0）。風格遷移任務設定較小值（0.2）。|

### 5Hz 語言模型參數

| 參數 | 型別 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `thinking` | `bool` | `True` | 啟用 5Hz 語言模型"思維鏈"推理用於語義/音樂後設資料和程式碼。|
| `lm_temperature` | `float` | `0.85` | LM 取樣溫度（0.0-2.0）。越高 = 更有創意/多樣，越低 = 更保守。|
| `lm_cfg_scale` | `float` | `2.0` | LM 無分類器引導比例。越高 = 更強的提示遵循度。|
| `lm_top_k` | `int` | `0` | LM top-k 取樣。`0` 禁用 top-k 過濾。典型值：40-100。|
| `lm_top_p` | `float` | `0.9` | LM 核取樣（0.0-1.0）。`1.0` 禁用核取樣。典型值：0.9-0.95。|
| `lm_negative_prompt` | `str` | `"NO USER INPUT"` | LM 引導的負面提示。幫助避免不想要的特徵。|
| `use_cot_metas` | `bool` | `True` | 使用 LM CoT 推理生成後設資料（BPM、調性、時長等）。|
| `use_cot_caption` | `bool` | `True` | 使用 LM CoT 推理最佳化使用者 caption。|
| `use_cot_language` | `bool` | `True` | 使用 LM CoT 推理檢測人聲語言。|
| `use_cot_lyrics` | `bool` | `False` | （保留供將來使用）使用 LM CoT 生成/最佳化歌詞。|
| `use_constrained_decoding` | `bool` | `True` | 啟用結構化 LM 輸出的約束解碼。|

### CoT 生成的值

這些欄位在啟用 CoT 推理時由 LM 自動填充：

| 參數 | 型別 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `cot_bpm` | `Optional[int]` | `None` | LM 生成的 BPM 值。|
| `cot_keyscale` | `str` | `""` | LM 生成的調性。|
| `cot_timesignature` | `str` | `""` | LM 生成的拍號。|
| `cot_duration` | `Optional[float]` | `None` | LM 生成的時長。|
| `cot_vocal_language` | `str` | `"unknown"` | LM 檢測的人聲語言。|
| `cot_caption` | `str` | `""` | LM 最佳化的 caption。|
| `cot_lyrics` | `str` | `""` | LM 生成/最佳化的歌詞。|

---

## GenerationConfig 參數

| 參數 | 型別 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `batch_size` | `int` | `2` | 並行生成的樣本數量（1-8）。較高的值需要更多 GPU 記憶體。|
| `allow_lm_batch` | `bool` | `False` | 允許 LM 批處理。當 `batch_size >= 2` 且 `thinking=True` 時更快。|
| `use_random_seed` | `bool` | `True` | 是否使用隨機種子。`True` 每次不同結果，`False` 可重複結果。|
| `seeds` | `Optional[List[int]]` | `None` | 批次生成的種子列表。如果提供的種子少於 batch_size，將用隨機種子填充。也可以是單個 int。|
| `lm_batch_chunk_size` | `int` | `8` | 每個 LM 推理塊的最大批處理大小（GPU 記憶體限制）。|
| `constrained_decoding_debug` | `bool` | `False` | 啟用約束解碼的除錯日誌。|
| `audio_format` | `str` | `"flac"` | 輸出音訊格式。選項：`"mp3"`、`"wav"`、`"flac"`。預設 FLAC 以快速儲存。|

---

## 任務型別

ACE-Step 支援 6 種不同的生成任務型別，每種都針對特定用例進行了最佳化。

### 1. Text2Music（預設）

**目的**：從文字描述和可選後設資料生成音樂。

**關鍵參數**：
```python
params = GenerationParams(
    task_type="text2music",
    caption="充滿活力的搖滾音樂，電吉他",
    lyrics="[Instrumental]",  # 或實際歌詞
    bpm=140,
    duration=30,
)
```

**必需**：
- `caption` 或 `lyrics`（至少一個）

**可選但推薦**：
- `bpm`：控制節奏
- `keyscale`：控制音樂調性
- `timesignature`：控制節拍結構
- `duration`：控制長度
- `vocal_language`：控制人聲特徵

**用例**：
- 從文字描述生成音樂
- 從提示建立伴奏
- 生成帶歌詞的歌曲

---

### 2. Cover

**目的**：轉換現有音訊，保持結構但改變風格/音色。

**關鍵參數**：
```python
params = GenerationParams(
    task_type="cover",
    src_audio="original_song.mp3",
    caption="爵士鋼琴版本",
    audio_cover_strength=0.8,  # 0.0-1.0
)
```

**必需**：
- `src_audio`：源音訊檔案路徑
- `caption`：期望風格/轉換的描述

**可選**：
- `audio_cover_strength`：控制原始音訊的影響
  - `1.0`：強烈保持原始結構
  - `0.5`：平衡轉換
  - `0.1`：寬鬆解讀
- `lyrics`：新歌詞（如果要更改人聲）

**用例**：
- 建立不同風格的翻唱
- 在保持旋律的同時更改樂器
- 風格轉換

---

### 3. Repaint

**目的**：重新生成音訊的特定時間段，保持其餘部分不變。

**關鍵參數**：
```python
params = GenerationParams(
    task_type="repaint",
    src_audio="original.mp3",
    repainting_start=10.0,  # 秒
    repainting_end=20.0,    # 秒
    caption="帶鋼琴獨奏的平滑過渡",
)
```

**必需**：
- `src_audio`：源音訊檔案路徑
- `repainting_start`：開始時間（秒）
- `repainting_end`：結束時間（秒）（使用 `-1` 表示檔案末尾）
- `caption`：重繪部分期望內容的描述

**用例**：
- 修復生成音樂的特定部分
- 為歌曲的某些部分新增變化
- 建立平滑過渡
- 替換有問題的片段

---

### 4. Lego（僅 Base 模型）

**目的**：在現有音訊的上下文中生成特定樂器軌道。

**關鍵參數**：
```python
params = GenerationParams(
    task_type="lego",
    src_audio="backing_track.mp3",
    instruction="Generate the guitar track based on the audio context:",
    caption="帶有藍調感覺的主音吉他旋律",
    repainting_start=0.0,
    repainting_end=-1,
)
```

**必需**：
- `src_audio`：源/伴奏音訊路徑
- `instruction`：必須指定軌道型別（例如"Generate the {TRACK_NAME} track..."）
- `caption`：期望軌道特徵的描述

**可用軌道**：
- `"vocals"`、`"backing_vocals"`、`"drums"`、`"bass"`、`"guitar"`、`"keyboard"`、
- `"percussion"`、`"strings"`、`"synth"`、`"fx"`、`"brass"`、`"woodwinds"`

**用例**：
- 新增特定樂器軌道
- 在伴奏軌道上疊加額外樂器
- 迭代建立多軌作品

---

### 5. Extract（僅 Base 模型）

**目的**：從混音音訊中提取/分離特定樂器軌道。

**關鍵參數**：
```python
params = GenerationParams(
    task_type="extract",
    src_audio="full_mix.mp3",
    instruction="Extract the vocals track from the audio:",
)
```

**必需**：
- `src_audio`：混音音訊檔案路徑
- `instruction`：必須指定要提取的軌道

**可用軌道**：與 Lego 任務相同

**用例**：
- 音軌分離
- 分離特定樂器
- 建立混音
- 分析單獨軌道

---

### 6. Complete（僅 Base 模型）

**目的**：用指定的樂器完成/擴充套件部分軌道。

**關鍵參數**：
```python
params = GenerationParams(
    task_type="complete",
    src_audio="incomplete_track.mp3",
    instruction="Complete the input track with drums, bass, guitar:",
    caption="搖滾風格完成",
)
```

**必需**：
- `src_audio`：不完整/部分軌道的路徑
- `instruction`：必須指定要新增的軌道
- `caption`：期望風格的描述

**用例**：
- 編排不完整的作品
- 新增伴奏軌道
- 自動完成音樂想法

---

## 輔助函式

### understand_music

分析音訊程式碼以提取音樂後設資料。

```python
from acestep.inference import understand_music

result = understand_music(
    llm_handler=llm_handler,
    audio_codes="<|audio_code_123|><|audio_code_456|>...",
    temperature=0.85,
    use_constrained_decoding=True,
)

if result.success:
    print(f"Caption：{result.caption}")
    print(f"歌詞：{result.lyrics}")
    print(f"BPM：{result.bpm}")
    print(f"調性：{result.keyscale}")
    print(f"時長：{result.duration}s")
    print(f"語言：{result.language}")
else:
    print(f"錯誤：{result.error}")
```

**用例**：
- 分析現有音樂
- 從音訊程式碼提取後設資料
- 逆向工程生成參數

---

### create_sample

從自然語言描述生成完整的音樂樣本。這是"簡單模式"/"靈感模式"功能。

```python
from acestep.inference import create_sample

result = create_sample(
    llm_handler=llm_handler,
    query="一首適合安靜夜晚的柔和孟加拉情歌",
    instrumental=False,
    vocal_language="bn",  # 可選：限制為孟加拉語
    temperature=0.85,
)

if result.success:
    print(f"Caption：{result.caption}")
    print(f"歌詞：{result.lyrics}")
    print(f"BPM：{result.bpm}")
    print(f"時長：{result.duration}s")
    print(f"調性：{result.keyscale}")
    print(f"是否純音樂：{result.instrumental}")
    
    # 與 generate_music 一起使用
    params = GenerationParams(
        caption=result.caption,
        lyrics=result.lyrics,
        bpm=result.bpm,
        duration=result.duration,
        keyscale=result.keyscale,
        vocal_language=result.language,
    )
else:
    print(f"錯誤：{result.error}")
```

**參數**：

| 參數 | 型別 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `query` | `str` | 必需 | 期望音樂的自然語言描述 |
| `instrumental` | `bool` | `False` | 是否生成純音樂 |
| `vocal_language` | `Optional[str]` | `None` | 將歌詞限制為特定語言（例如"en"、"zh"、"bn"）|
| `temperature` | `float` | `0.85` | 取樣溫度 |
| `top_k` | `Optional[int]` | `None` | Top-k 取樣（None 禁用）|
| `top_p` | `Optional[float]` | `None` | Top-p 取樣（None 禁用）|
| `repetition_penalty` | `float` | `1.0` | 重複懲罰 |
| `use_constrained_decoding` | `bool` | `True` | 使用基於 FSM 的約束解碼 |

---

### format_sample

格式化和增強使用者提供的 caption 和 lyrics，生成結構化後設資料。

```python
from acestep.inference import format_sample

result = format_sample(
    llm_handler=llm_handler,
    caption="拉丁流行，雷鬼音",
    lyrics="[Verse 1]\nBailando en la noche...",
    user_metadata={"bpm": 95},  # 可選：約束特定值
    temperature=0.85,
)

if result.success:
    print(f"增強後的 Caption：{result.caption}")
    print(f"格式化後的歌詞：{result.lyrics}")
    print(f"BPM：{result.bpm}")
    print(f"時長：{result.duration}s")
    print(f"調性：{result.keyscale}")
    print(f"檢測到的語言：{result.language}")
else:
    print(f"錯誤：{result.error}")
```

**參數**：

| 參數 | 型別 | 預設值 | 說明 |
|-----------|------|---------|-------------|
| `caption` | `str` | 必需 | 使用者的 caption/描述 |
| `lyrics` | `str` | 必需 | 使用者的帶結構標籤的歌詞 |
| `user_metadata` | `Optional[Dict]` | `None` | 約束特定後設資料值（bpm、duration、keyscale、timesignature、language）|
| `temperature` | `float` | `0.85` | 取樣溫度 |
| `top_k` | `Optional[int]` | `None` | Top-k 取樣（None 禁用）|
| `top_p` | `Optional[float]` | `None` | Top-p 取樣（None 禁用）|
| `repetition_penalty` | `float` | `1.0` | 重複懲罰 |
| `use_constrained_decoding` | `bool` | `True` | 使用基於 FSM 的約束解碼 |

---

## 完整示例

### 示例 1：簡單文字到音樂生成

```python
from acestep.inference import GenerationParams, GenerationConfig, generate_music

params = GenerationParams(
    task_type="text2music",
    caption="寧靜的氛圍音樂，柔和的鋼琴和絃樂",
    duration=60,
    bpm=80,
    keyscale="C Major",
)

config = GenerationConfig(
    batch_size=2,  # 生成 2 個變體
    audio_format="flac",
)

result = generate_music(dit_handler, llm_handler, params, config, save_dir="/output")

if result.success:
    for i, audio in enumerate(result.audios, 1):
        print(f"變體 {i}：{audio['path']}")
```

### 示例 2：帶歌詞的歌曲生成

```python
params = GenerationParams(
    task_type="text2music",
    caption="流行民謠，情感人聲",
    lyrics="""Verse 1:
今天走在街上
想著你曾說過的話
一切都變得不同了
但我會找到自己的路

Chorus:
我在前進，我很堅強
這就是我屬於的地方
""",
    vocal_language="zh",
    bpm=72,
    duration=45,
)

config = GenerationConfig(batch_size=1)

result = generate_music(dit_handler, llm_handler, params, config, save_dir="/output")
```

### 示例 3：使用自定義時間步

```python
params = GenerationParams(
    task_type="text2music",
    caption="複雜和聲的爵士融合",
    # 自定義 9 步排程
    timesteps=[0.97, 0.76, 0.615, 0.5, 0.395, 0.28, 0.18, 0.085, 0],
    thinking=True,
)

config = GenerationConfig(batch_size=1)

result = generate_music(dit_handler, llm_handler, params, config, save_dir="/output")
```

### 示例 4：使用 Shift 參數（Turbo 模型）

```python
params = GenerationParams(
    task_type="text2music",
    caption="歡快的電子舞曲",
    inference_steps=8,
    shift=3.0,  # Turbo 模型推薦
    infer_method="ode",
)

config = GenerationConfig(batch_size=2)

result = generate_music(dit_handler, llm_handler, params, config, save_dir="/output")
```

### 示例 5：使用 create_sample 的簡單模式

```python
from acestep.inference import create_sample, GenerationParams, GenerationConfig, generate_music

# 步驟 1：從描述建立樣本
sample = create_sample(
    llm_handler=llm_handler,
    query="充滿活力的韓國流行舞曲，帶有朗朗上口的 Hook",
    vocal_language="ko",
)

if sample.success:
    # 步驟 2：使用樣本生成音樂
    params = GenerationParams(
        caption=sample.caption,
        lyrics=sample.lyrics,
        bpm=sample.bpm,
        duration=sample.duration,
        keyscale=sample.keyscale,
        vocal_language=sample.language,
        thinking=True,
    )
    
    config = GenerationConfig(batch_size=2)
    result = generate_music(dit_handler, llm_handler, params, config, save_dir="/output")
```

### 示例 6：格式化和增強使用者輸入

```python
from acestep.inference import format_sample, GenerationParams, GenerationConfig, generate_music

# 步驟 1：格式化使用者輸入
formatted = format_sample(
    llm_handler=llm_handler,
    caption="搖滾民謠",
    lyrics="[Verse]\n在黑暗中我找到了自己的路...",
)

if formatted.success:
    # 步驟 2：使用增強後的輸入生成
    params = GenerationParams(
        caption=formatted.caption,
        lyrics=formatted.lyrics,
        bpm=formatted.bpm,
        duration=formatted.duration,
        keyscale=formatted.keyscale,
        thinking=True,
        use_cot_metas=False,  # 已格式化，跳過後設資料 CoT
    )
    
    config = GenerationConfig(batch_size=2)
    result = generate_music(dit_handler, llm_handler, params, config, save_dir="/output")
```

---

## 最佳實踐

### 1. Caption 寫作

**好的 Caption**：
```python
# 具體且描述性強
caption="歡快的電子舞曲，重低音和合成器主旋律"

# 包含情緒和風格
caption="憂鬱的獨立民謠，原聲吉他和柔和的人聲"

# 指定樂器
caption="爵士三重奏，鋼琴、立式貝斯和刷子鼓"
```

**避免**：
```python
# 太模糊
caption="好音樂"

# 矛盾
caption="快慢音樂"  # 節奏衝突
```

### 2. 參數調優

**最佳品質**：
- 使用 base 模型，`inference_steps=64` 或更高
- 啟用 `use_adg=True`
- 設定 `guidance_scale=7.0-9.0`
- 設定 `shift=3.0` 以獲得更好的時間步分佈
- 使用無損音訊格式（`audio_format="wav"`）

**追求速度**：
- 使用 turbo 模型，`inference_steps=8`
- 禁用 ADG（`use_adg=False`）
- 使用 `infer_method="ode"`（預設）
- 使用壓縮格式（`audio_format="mp3"`）或預設 FLAC

**一致性**：
- 在 config 中設定 `use_random_seed=False`
- 使用固定的 `seeds` 列表或在 params 中使用單個 `seed`
- 保持較低的 `lm_temperature`（0.7-0.85）

**多樣性**：
- 在 config 中設定 `use_random_seed=True`
- 增加 `lm_temperature`（0.9-1.1）
- 使用 `batch_size > 1` 獲得變體

### 3. 時長指南

- **純音樂**：30-180 秒效果良好
- **帶歌詞**：推薦自動檢測（設定 `duration=-1` 或保持預設）
- **短片段**：最少 10-20 秒
- **長格式**：最多 600 秒（10 分鐘）

### 4. LM 使用

**何時啟用 LM（`thinking=True`）**：
- 需要自動後設資料檢測
- 想要 caption 最佳化
- 從最少輸入生成
- 需要多樣化輸出

**何時禁用 LM（`thinking=False`）**：
- 已有精確的後設資料
- 需要更快的生成
- 想要完全控制參數

### 5. 批處理

```python
# 高效批次生成
config = GenerationConfig(
    batch_size=8,           # 支援的最大值
    allow_lm_batch=True,    # 啟用以提速（當 thinking=True 時）
    lm_batch_chunk_size=4,  # 根據 GPU 記憶體調整
)
```

### 6. 錯誤處理

```python
result = generate_music(dit_handler, llm_handler, params, config, save_dir="/output")

if not result.success:
    print(f"生成失敗：{result.error}")
    print(f"狀態：{result.status_message}")
else:
    # 處理成功結果
    for audio in result.audios:
        path = audio['path']
        key = audio['key']
        seed = audio['params']['seed']
        # ... 處理音訊檔案
```

### 7. 顯示記憶體管理

ACE-Step 1.5 包含自動顯示記憶體管理，可適應您的 GPU：

- **自動等級檢測**: 系統檢測可用顯示記憶體並選擇最佳設定（詳見 [GPU_COMPATIBILITY.md](../zh/GPU_COMPATIBILITY.md)）
- **顯示記憶體守衛**: 每次推理前，系統估算顯示記憶體需求，必要時自動減小 `batch_size`
- **自適應 VAE 解碼**: 三級回退 — GPU 分片解碼 → GPU 解碼+CPU 卸載 → 完全 CPU 解碼
- **自動分片大小**: VAE 解碼分片大小根據空閒顯示記憶體自適應調整（64/128/256/512/1024/1536）
- **時長/批次裁剪**: 超出等級限制的值會自動裁剪並顯示警告

手動調優：
- 如果仍然出現 OOM 錯誤，減少 `batch_size`
- 低顯示記憶體 GPU 上減少 `lm_batch_chunk_size` 用於 LM 操作
- 顯示記憶體 <20GB 時啟用 `offload_to_cpu=True`
- 顯示記憶體 <20GB 時啟用 `quantization="int8_weight_only"`

---

## 故障排除

### 常見問題

**問題**：顯示記憶體不足 (OOM) 錯誤
- **解決方案**：系統應透過顯示記憶體守衛（自動減小批次）和自適應 VAE 解碼（CPU 回退）自動處理大多數 OOM 場景。如果仍然出現 OOM：減少 `batch_size`、減少 `inference_steps`、啟用 CPU 卸載（`offload_to_cpu=True`）或啟用 INT8 量化。詳見 [GPU_COMPATIBILITY.md](../zh/GPU_COMPATIBILITY.md) 瞭解各顯示記憶體等級的推薦設定。

**問題**：結果品質差
- **解決方案**：增加 `inference_steps`，調整 `guidance_scale`，使用 base 模型

**問題**：結果與提示不匹配
- **解決方案**：使 caption 更具體，增加 `guidance_scale`，啟用 LM 最佳化（`thinking=True`）

**問題**：生成緩慢
- **解決方案**：使用 turbo 模型，減少 `inference_steps`，禁用 ADG

**問題**：LM 不生成程式碼
- **解決方案**：驗證 `llm_handler` 已初始化，檢查 `thinking=True` 和 `use_cot_metas=True`

**問題**：種子不被尊重
- **解決方案**：在 config 中設定 `use_random_seed=False` 並提供 `seeds` 列表或在 params 中提供 `seed`

**問題**：自定義時間步不工作
- **解決方案**：確保時間步是從 1.0 到 0.0 的浮點數列表，正確排序

---

## 版本歷史

- **v1.5.2**：當前版本
  - 新增了 `shift` 參數用於時間步偏移
  - 新增了 `infer_method` 參數用於 ODE/SDE 選擇
  - 新增了 `timesteps` 參數用於自定義時間步排程
  - 新增了 `understand_music()` 函式用於音訊分析
  - 新增了 `create_sample()` 函式用於簡單模式生成
  - 新增了 `format_sample()` 函式用於輸入增強
  - 新增了 `UnderstandResult`、`CreateSampleResult`、`FormatSampleResult` 資料類

- **v1.5.1**：上一版本
  - 將 `GenerationConfig` 拆分為 `GenerationParams` 和 `GenerationConfig`
  - 重新命名參數以保持一致性（`key_scale` → `keyscale`、`time_signature` → `timesignature`、`audio_duration` → `duration`、`use_llm_thinking` → `thinking`、`audio_code_string` → `audio_codes`）
  - 新增了 `instrumental` 參數
  - 新增了 `use_constrained_decoding` 參數
  - 新增了 CoT 自動填充欄位（`cot_*`）
  - 將預設 `audio_format` 更改為 "flac"
  - 將預設 `batch_size` 更改為 2
  - 將預設 `thinking` 更改為 True
  - 簡化了 `GenerationResult` 結構，統一 `audios` 列表
  - 在 `extra_outputs` 中新增了統一的 `time_costs`

- **v1.5**：初始版本
  - 引入了 `GenerationConfig` 和 `GenerationResult` 資料類
  - 簡化了參數傳遞
  - 新增了綜合文件

---

更多資訊，請參閱：
- 主 README：[`../../README.md`](../../README.md)
- REST API 文件：[`API.md`](API.md)
- Gradio 演示指南：[`GRADIO_GUIDE.md`](GRADIO_GUIDE.md)
- 專案倉庫：[ACE-Step-1.5](https://github.com/yourusername/ACE-Step-1.5)
