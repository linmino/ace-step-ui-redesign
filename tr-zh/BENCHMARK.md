# ACE-Step 1.5 基準測試與效能分析指南

**Language / 語言:** [English](../en/BENCHMARK.md) | [繁體中文](BENCHMARK.md)

---

## 目錄

- [概述](#概述)
- [快速開始](#快速開始)
- [測試模式](#測試模式)
- [命令列參數](#命令列參數)
- [使用示例](#使用示例)
- [理解輸出](#理解輸出)
- [技巧與最佳實踐](#技巧與最佳實踐)

---

## 概述

`profile_inference.py` 是 ACE-Step 1.5 推理的綜合效能分析與基準測試工具。它可以測量端到端耗時、LLM 規劃耗時、DiT 擴散耗時、VAE 解碼耗時等，支援不同裝置、後端和配置的組合測試。

### 支援的模式

| 模式 | 說明 |
|------|------|
| `profile` | 對單次生成進行詳細的計時分析 |
| `benchmark` | 執行配置矩陣（時長 × 批次 × 思考 × 步數），輸出彙總表 |
| `tier-test` | 透過 `MAX_CUDA_VRAM` 模擬不同顯示記憶體大小，自動測試所有 GPU 等級 |
| `understand` | 分析 `understand_music()` API（音訊 → 後設資料提取） |
| `create_sample` | 分析 `create_sample()` API（靈感/簡單模式） |
| `format_sample` | 分析 `format_sample()` API（標題+歌詞 → 結構化後設資料） |

### 支援的裝置與後端

| 裝置 | 參數 | 說明 |
|------|------|------|
| CUDA (NVIDIA) | `--device cuda` | 推薦，預設自動檢測 |
| MPS (Apple Silicon) | `--device mps` | macOS Apple 晶片 |
| CPU | `--device cpu` | 慢，僅用於測試 |
| 自動 | `--device auto` | 自動選擇最佳裝置（預設） |

| LLM 後端 | 參數 | 說明 |
|-----------|------|------|
| vLLM | `--lm-backend vllm` | CUDA 上最快，推薦 NVIDIA 使用 |
| PyTorch | `--lm-backend pt` | 通用後端，所有平台可用 |
| MLX | `--lm-backend mlx` | Apple Silicon 最佳化 |
| 自動 | `--lm-backend auto` | 根據裝置自動選擇（預設） |

---

## 快速開始

```bash
# 基本分析（text2music，預設設定）
python profile_inference.py

# 啟用 LLM 思考模式
python profile_inference.py --thinking

# 執行基準測試矩陣
python profile_inference.py --mode benchmark

# Apple Silicon 上測試
python profile_inference.py --device mps --lm-backend mlx

# 啟用 cProfile 函式級分析
python profile_inference.py --detailed
```

---

## 測試模式

### 1. `profile` — 單次執行分析

執行單次生成，輸出詳細計時分解。包含可選的預熱和 cProfile。

```bash
python profile_inference.py --mode profile
```

**測量內容：**
- 總耗時（端到端）
- LLM 規劃耗時（token 生成、約束解碼、CFG 開銷）
- DiT 擴散耗時（每步和總計）
- VAE 解碼耗時
- 音訊儲存耗時

**此模式的選項：**

| 參數 | 說明 |
|------|------|
| `--no-warmup` | 跳過預熱（測量將包含編譯開銷） |
| `--detailed` | 啟用 `cProfile` 函式級分析 |
| `--llm-debug` | 深度 LLM 除錯（token 數量、吞吐量） |
| `--thinking` | 啟用 LLM 思維鏈推理 |
| `--duration <秒>` | 覆蓋音訊時長 |
| `--batch-size <n>` | 覆蓋批次大小 |
| `--inference-steps <n>` | 覆蓋擴散步數 |

### 2. `benchmark` — 配置矩陣測試

執行配置矩陣並輸出彙總表。自動適配 GPU 顯示記憶體限制。

```bash
python profile_inference.py --mode benchmark
```

**預設矩陣：**
- 時長：30s, 60s, 120s, 240s（根據 GPU 顯示記憶體裁剪）
- 批次大小：1, 2, 4（根據 GPU 顯示記憶體裁剪）
- 思考模式：True, False
- 推理步數：8, 16

**輸出示例：**

```
Duration   Batch   Think   Steps   Wall(s)    LM(s)      DiT(s)     VAE(s)     Status
--------------------------------------------------------------------------------------------------------------------------
30         1       False   8       3.21       0.45       1.89       0.52       OK
30         1       True    8       5.67       2.91       1.89       0.52       OK
60         2       False   16      12.34      0.48       9.12       1.85       OK
...
```

**儲存結果為 JSON：**

```bash
python profile_inference.py --mode benchmark --benchmark-output results.json
```

### 3. `understand` — 音訊理解分析

分析 `understand_music()` API，從音訊 codes 提取後設資料（BPM、調性、拍號、描述）。

```bash
python profile_inference.py --mode understand
python profile_inference.py --mode understand --audio-codes "your_audio_codes_string"
```

### 4. `create_sample` — 靈感模式分析

分析 `create_sample()` API，從簡單文字查詢生成完整歌曲藍圖。

```bash
python profile_inference.py --mode create_sample
python profile_inference.py --mode create_sample --sample-query "一首柔和的孟加拉情歌"
python profile_inference.py --mode create_sample --instrumental
```

### 5. `format_sample` — 後設資料格式化分析

分析 `format_sample()` API，將描述+歌詞轉換為結構化後設資料。

```bash
python profile_inference.py --mode format_sample
```

### 6. `tier-test` — 自動化 GPU 等級測試

使用 `MAX_CUDA_VRAM` 自動模擬不同的 GPU 顯示記憶體大小，並在每個等級執行生成測試。這是修改 `acestep/gpu_config.py` 後驗證所有 GPU 等級是否正常工作的推薦方式。

```bash
# 測試所有等級 (4, 6, 8, 12, 16, 20, 24 GB)
python profile_inference.py --mode tier-test

# 測試特定顯示記憶體大小
python profile_inference.py --mode tier-test --tiers 6 8 16

# 啟用 LM 測試（在支援的等級上）
python profile_inference.py --mode tier-test --tier-with-lm

# 快速測試：非量化等級跳過 torch.compile
python profile_inference.py --mode tier-test --tier-skip-compile
```

**每個等級驗證的內容：**
- 正確的等級檢測和 `GPUConfig` 構建
- 模型初始化（DiT、VAE、文字編碼器，可選 LM）
- 短時間生成（30秒時長，batch=1）無 OOM 完成
- 自適應 VAE 解碼回退（GPU → CPU 卸載 → 完全 CPU）
- 顯示記憶體使用保持在模擬限制內

**輸出示例：**

```
TIER TEST RESULTS
====================================================================================================
  VRAM    Tier       LM      Duration   Status    Peak VRAM    Notes
  ──────────────────────────────────────────────────────────────────────────────
  4GB     tier1      —       30s        ✅ OK     3.8GB        VAE 在 CPU 上解碼
  6GB     tier2      —       30s        ✅ OK     5.4GB        分片 VAE chunk=256
  8GB     tier4      0.6B    30s        ✅ OK     7.2GB        vllm 後端
  12GB    tier5      1.7B    30s        ✅ OK     10.8GB       vllm 後端
  16GB    tier6a     1.7B    30s        ✅ OK     14.5GB       啟用卸載
  20GB    tier6b     1.7B    30s        ✅ OK     17.2GB       無卸載
  24GB    unlimited  4B      30s        ✅ OK     21.3GB       所有模型在 GPU 上
```

> **注意**: `tier-test` 模式使用 `torch.cuda.set_per_process_memory_fraction()` 強制執行顯示記憶體硬上限，即使在高階 GPU（如 A100 80GB）上也能實現真實的模擬。

#### 邊界測試

使用 `--tier-boundary` 查詢可以安全關閉 INT8 量化和 CPU 卸載的最低顯示記憶體等級。對每個等級最多測試三種配置：

1. **default** — 等級的標準設定
2. **no-quant** — 關閉量化，卸載不變
3. **no-offload** — 不使用量化，也不使用 CPU 卸載

```bash
# 在所有等級執行邊界測試
python profile_inference.py --mode tier-test --tier-boundary

# 啟用 LM 的邊界測試
python profile_inference.py --mode tier-test --tier-boundary --tier-with-lm

# 將邊界測試結果儲存為 JSON
python profile_inference.py --mode tier-test --tier-boundary --benchmark-output boundary_results.json
```

輸出包含一個 **邊界分析** 摘要，顯示每種能力的最低等級。

#### 批次大小邊界測試

使用 `--tier-batch-boundary` 查詢每個等級的最大安全批次大小。對每個等級，工具會遞進測試批次大小 1、2、4、8（在首次 OOM 時停止），同時測試啟用 LM 和未啟用 LM 的配置：

```bash
# 執行批次邊界測試
python profile_inference.py --mode tier-test --tier-batch-boundary --tier-with-lm

# 測試特定等級
python profile_inference.py --mode tier-test --tier-batch-boundary --tier-with-lm --tiers 8 12 16 24
```

輸出包含一個 **批次邊界摘要**，顯示每個等級在有 LM 和無 LM 配置下的最大成功批次大小。

---

## 命令列參數

### 裝置與後端

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `--device` | `auto` | 裝置：`auto` / `cuda` / `mps` / `cpu` |
| `--lm-backend` | `auto` | LLM 後端：`auto` / `vllm` / `pt` / `mlx` |

### 模型路徑

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `--config-path` | `acestep-v15-turbo` | DiT 模型配置 |
| `--lm-model` | `acestep-5Hz-lm-1.7B` | LLM 模型路徑 |

### 硬體選項

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `--offload-to-cpu` | 關閉 | 不使用時卸載模型到 CPU |
| `--offload-dit-to-cpu` | 關閉 | 不使用時卸載 DiT 到 CPU |
| `--quantization` | 無 | 量化：`int8_weight_only` / `fp8_weight_only` / `w8a8_dynamic` |

### 生成參數

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `--duration` | 來自示例 | 音訊時長（秒） |
| `--batch-size` | 來自示例 | 批次大小 |
| `--inference-steps` | 來自示例 | 擴散推理步數 |
| `--seed` | 來自示例 | 隨機種子 |
| `--guidance-scale` | 7.0 | DiT 的 CFG 引導縮放 |

### LLM / CoT 參數

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `--thinking` | 關閉 | 啟用 LLM 思維鏈推理 |
| `--use-cot-metas` | 關閉 | LLM 透過 CoT 生成音樂後設資料 |
| `--use-cot-caption` | 關閉 | LLM 透過 CoT 改寫/格式化描述 |
| `--use-cot-language` | 關閉 | LLM 透過 CoT 檢測人聲語言 |
| `--use-constrained-decoding` | 開啟 | 基於 FSM 的約束解碼 |
| `--no-constrained-decoding` | — | 禁用約束解碼 |
| `--lm-temperature` | 0.85 | LLM 取樣溫度 |
| `--lm-cfg-scale` | 2.0 | LLM CFG 縮放 |

### 分析選項

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `--mode` | `profile` | 模式：`profile` / `benchmark` / `tier-test` / `understand` / `create_sample` / `format_sample` |
| `--no-warmup` | 關閉 | 跳過預熱 |
| `--detailed` | 關閉 | 啟用 `cProfile` 函式級分析 |
| `--llm-debug` | 關閉 | 深度 LLM 除錯（token 數量、吞吐量） |
| `--benchmark-output` | 無 | 儲存基準測試結果為 JSON 檔案 |

### 等級測試選項

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `--tiers` | `4 6 8 12 16 20 24` | 要模擬的顯示記憶體大小（GB） |
| `--tier-with-lm` | 關閉 | 在支援的等級上啟用 LM 初始化 |
| `--tier-skip-compile` | 關閉 | 非量化等級跳過 `torch.compile` 以加速迭代 |
| `--tier-boundary` | 關閉 | 對每個等級測試 no-quant 和 no-offload 變體，查詢最低能力邊界 |
| `--tier-batch-boundary` | 關閉 | 對每個等級測試批次大小 1、2、4、8，查詢最大安全批次大小 |

### 輸入選項

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `--example` | `example_05.json` | `examples/text2music/` 中的示例 JSON |
| `--task-type` | `text2music` | 任務型別：`text2music` / `cover` / `repaint` / `lego` / `extract` / `complete` |
| `--reference-audio` | 無 | 參考音訊路徑（用於翻唱/風格遷移） |
| `--src-audio` | 無 | 源音訊路徑（用於音訊到音訊任務） |
| `--sample-query` | 無 | `create_sample` 模式的查詢文字 |
| `--instrumental` | 關閉 | 生成純音樂（用於 `create_sample`） |
| `--audio-codes` | 無 | 音訊 codes 字串（用於 `understand` 模式） |

---

## 使用示例

### 對比不同裝置

```bash
# NVIDIA GPU
python profile_inference.py --device cuda --lm-backend vllm

# Apple Silicon
python profile_inference.py --device mps --lm-backend mlx

# CPU 基線
python profile_inference.py --device cpu --lm-backend pt
```

### 對比不同 LLM 模型

```bash
# 輕量版 (0.6B)
python profile_inference.py --lm-model acestep-5Hz-lm-0.6B

# 預設版 (1.7B)
python profile_inference.py --lm-model acestep-5Hz-lm-1.7B

# 大型版 (4B)
python profile_inference.py --lm-model acestep-5Hz-lm-4B
```

### 思考模式 vs 非思考模式

```bash
# 不使用思考（更快）
python profile_inference.py --mode benchmark

# 使用思考（品質更好，更慢）
python profile_inference.py --thinking --use-cot-metas --use-cot-caption
```

### 低顯示記憶體測試

```bash
# 卸載 + 量化
python profile_inference.py --offload-to-cpu --quantization int8_weight_only --lm-model acestep-5Hz-lm-0.6B
```

### 完整基準測試套件

```bash
# 執行完整基準測試矩陣並儲存結果
python profile_inference.py --mode benchmark --benchmark-output benchmark_results.json

# 檢視 JSON 結果
cat benchmark_results.json | python -m json.tool
```

### 函式級分析

```bash
# 啟用 cProfile 進行詳細的函式級分析
python profile_inference.py --detailed --llm-debug
```

---

## 理解輸出

### 耗時分解

分析器會列印詳細的耗時分解：

```
TIME COSTS BREAKDOWN
====================================================================================================
  Component                          Time (s)       % of Total
  ─────────────────────────────────────────────────────────────
  LLM Planning (total)               2.91           45.2%
    ├─ Token generation              2.45           38.1%
    ├─ Constrained decoding          0.31            4.8%
    └─ CFG overhead                  0.15            2.3%
  DiT Diffusion (total)              1.89           29.4%
    ├─ Per-step average              0.24            —
    └─ Steps                         8               —
  VAE Decode                         0.52            8.1%
  Audio Save                         0.12            1.9%
  Other / Overhead                   0.99           15.4%
  ─────────────────────────────────────────────────────────────
  Wall Time (total)                  6.43          100.0%
```

### 關鍵指標

| 指標 | 說明 |
|------|------|
| **Wall Time** | 從開始到結束的端到端耗時 |
| **LM Total Time** | LLM 規劃耗時（token 生成 + 解析） |
| **DiT Total Time** | 擴散耗時（所有步驟合計） |
| **VAE Decode Time** | 將潛變數解碼為音訊波形的耗時 |
| **Tokens/sec** | LLM token 生成吞吐量（需 `--llm-debug`） |

---

## 技巧與最佳實踐

1. **始終包含預熱**（預設）— 首次執行包含 JIT 編譯和記憶體分配開銷。預熱確保測量反映穩態效能。

2. **使用 `--benchmark-output`** 將結果儲存為 JSON，方便後續分析或跨硬體對比。

3. **對比思考開啟 vs 關閉** — 思考模式顯著增加 LLM 耗時，但可能提升生成品質。

4. **使用代表性時長測試** — 短時長（30s）以 LLM 耗時為主；長時長（240s+）以 DiT 耗時為主。

5. **GPU 顯示記憶體自動適配** — benchmark 模式會自動將時長和批次大小裁剪到 GPU 可處理的範圍，使用 `acestep/gpu_config.py` 中的自適應等級系統。

6. **謹慎使用 `--detailed`** — `cProfile` 會增加開銷；僅在需要調查函式級瓶頸時使用。

7. **使用 `tier-test` 進行迴歸測試** — 修改 GPU 等級配置後，執行 `--mode tier-test` 驗證所有等級仍然正常工作。這在更改卸載閾值、時長限制或 LM 模型可用性時尤為重要。

8. **真實模擬低顯示記憶體** — 使用 `MAX_CUDA_VRAM` 時，系統透過 `set_per_process_memory_fraction()` 強制執行顯示記憶體硬上限，因此模擬期間的 OOM 錯誤反映了消費級 GPU 上的真實行為。
