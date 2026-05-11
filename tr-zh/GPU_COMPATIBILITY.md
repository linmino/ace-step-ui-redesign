# GPU 相容性指南

ACE-Step 1.5 會自動適配您的 GPU 顯示記憶體大小，相應調整生成時長限制、可用的 LM 模型、卸載策略和 UI 預設設定。系統在啟動時檢測 GPU 顯示記憶體並自動配置最佳設定。

## GPU 分級配置

| 顯示記憶體 | 等級 | XL (4B) DiT | LM 模型 | 推薦 LM | 後端 | 最大時長 (有LM / 無LM) | 最大批次 (有LM / 無LM) | 卸載策略 | 量化 |
|------|------|:-----------:|---------|---------|------|------------------------|------------------------|----------|------|
| ≤4GB | Tier 1 | ❌ | 無 | — | pt | 4分 / 6分 | 1 / 1 | CPU + DiT | INT8 |
| 4-6GB | Tier 2 | ❌ | 無 | — | pt | 8分 / 10分 | 1 / 1 | CPU + DiT | INT8 |
| 6-8GB | Tier 3 | ❌ | 0.6B | 0.6B | pt | 8分 / 10分 | 2 / 2 | CPU + DiT | INT8 |
| 8-12GB | Tier 4 | ❌ | 0.6B | 0.6B | vllm | 8分 / 10分 | 2 / 4 | CPU + DiT | INT8 |
| 12-16GB | Tier 5 | ⚠️ | 0.6B, 1.7B | 1.7B | vllm | 8分 / 10分 | 4 / 4 | CPU | INT8 |
| 16-20GB | Tier 6a | ✅ (卸載) | 0.6B, 1.7B | 1.7B | vllm | 8分 / 10分 | 4 / 8 | CPU | INT8 |
| 20-24GB | Tier 6b | ✅ | 0.6B, 1.7B, 4B | 1.7B | vllm | 8分 / 8分 | 8 / 8 | 無 | 無 |
| ≥24GB | 無限制 | ✅ | 全部 (0.6B, 1.7B, 4B) | 4B | vllm | 10分 / 10分 | 8 / 8 | 無 | 無 |

> **XL (4B) DiT 列**: ❌ = 不支援, ⚠️ = 勉強可用（需卸載 + 量化，12-16GB 可透過激進卸載執行），✅ (卸載) = 需 CPU 卸載，✅ = 完全支援。XL 模型權重約 9GB（bf16），2B 約 4.7GB。所有 LM 模型均相容 XL。

### 列說明

- **LM 模型**: 該等級可以載入的 5Hz 語言模型尺寸
- **推薦 LM**: UI 中該等級預設選擇的 LM 模型
- **後端**: LM 推理後端（`vllm` 用於顯示記憶體充足的 NVIDIA GPU，`pt` 為 PyTorch 回退方案，`mlx` 用於 Apple Silicon）
- **卸載策略**:
  - **CPU + DiT**: 所有模型（DiT、VAE、文字編碼器）不使用時卸載到 CPU；DiT 也在步驟間卸載
  - **CPU**: VAE 和文字編碼器卸載到 CPU；DiT 保留在 GPU 上
  - **無**: 所有模型保留在 GPU 上
- **量化**: 是否預設啟用 INT8 權重量化以減少顯示記憶體佔用

## 自適應 UI 預設設定

Gradio UI 會根據檢測到的 GPU 等級自動配置：

- **LM 初始化核取方塊**: 支援 LM 的等級（Tier 3+）預設勾選，Tier 1-2 預設不勾選且禁用
- **LM 模型路徑**: 自動填充該等級推薦的模型；下拉選單僅顯示相容的模型
- **後端下拉選單**: Tier 1-3 限制為 `pt`/`mlx`（vllm KV 快取佔用過大）；Tier 4+ 所有後端可用
- **CPU 卸載 / DiT 卸載**: 低等級預設啟用，高等級預設禁用
- **量化**: Tier 1-6a 預設啟用，Tier 6b+ 預設禁用（顯示記憶體充足）
- **模型編譯**: 所有等級預設啟用（量化需要）

如果您手動選擇了不相容的選項（例如在 6GB GPU 上使用 vllm），系統會發出警告並自動回退到相容配置。

## 執行時安全特性

- **顯示記憶體守衛**: 每次推理前，系統會估算顯示記憶體需求，必要時自動減小批次大小
- **自適應 VAE 解碼**: 三級回退機制：GPU 分片解碼 → GPU 解碼+結果卸載到 CPU → 完全 CPU 解碼
- **自動分片大小**: VAE 解碼分片大小根據可用空閒顯示記憶體自適應調整（64/128/256/512/1024/1536）
- **時長/批次裁剪**: 如果請求的值超出等級限制，會自動裁剪並顯示警告

## 說明

- **預設設定** 會根據檢測到的 GPU 顯示記憶體自動配置
- **LM 模式** 指用於思維鏈 (Chain-of-Thought) 生成和音訊理解的語言模型
- **Flash Attention** 會自動檢測並在可用時啟用
- **約束解碼**: 當 LM 初始化後，LM 生成的時長也會被約束在 GPU 等級的最大時長限制內，防止在 CoT 生成時出現顯示記憶體不足錯誤
- 對於顯示記憶體 ≤6GB 的 GPU（Tier 1-2），預設禁用 LM 初始化以保留顯示記憶體給 DiT 模型
- 您可以透過命令列參數或 Gradio UI 手動覆蓋設定

> **歡迎社群貢獻**: 以上 GPU 分級配置基於我們在常見硬體上的測試。如果您發現您的裝置實際效能與這些參數不符（例如，可以處理更長的時長或更大的批次），歡迎您進行更充分的測試，並提交 PR 來最佳化 `acestep/gpu_config.py` 中的配置。您的貢獻將幫助改善所有使用者的體驗！

## 顯示記憶體最佳化建議

1. **極低顯示記憶體 (≤6GB)**: 使用純 DiT 模式，不初始化 LM。INT8 量化和完全 CPU 卸載是必須的。VAE 解碼可能會自動回退到 CPU。
2. **低顯示記憶體 (6-8GB)**: 可使用 0.6B LM 模型，配合 `pt` 後端。保持卸載啟用。
3. **中等顯示記憶體 (8-16GB)**: 使用 0.6B 或 1.7B LM 模型。Tier 4+ 上 `vllm` 後端表現良好。
4. **高顯示記憶體 (16-24GB)**: 啟用更大的 LM 模型（推薦 1.7B）。20GB+ 量化變為可選。
5. **超高顯示記憶體 (≥24GB)**: 所有模型無需卸載或量化即可執行。使用 4B LM 獲得最佳品質。

## 除錯模式：模擬不同的 GPU 配置

在測試和開發時，您可以使用 `MAX_CUDA_VRAM` 環境變數來模擬不同的 GPU 顯示記憶體大小：

```bash
# 模擬 4GB GPU (Tier 1)
MAX_CUDA_VRAM=4 uv run acestep

# 模擬 6GB GPU (Tier 2)
MAX_CUDA_VRAM=6 uv run acestep

# 模擬 8GB GPU (Tier 4)
MAX_CUDA_VRAM=8 uv run acestep

# 模擬 12GB GPU (Tier 5)
MAX_CUDA_VRAM=12 uv run acestep

# 模擬 16GB GPU (Tier 6a)
MAX_CUDA_VRAM=16 uv run acestep
```

設定 `MAX_CUDA_VRAM` 時，系統還會呼叫 `torch.cuda.set_per_process_memory_fraction()` 來強制執行顯示記憶體硬上限，即使在高階 GPU 上也能實現真實的模擬。

### 自動化分級測試

無需透過 UI 手動測試每個等級，可以使用 `profile_inference.py` 的 `tier-test` 模式：

```bash
# 自動測試所有等級
python profile_inference.py --mode tier-test

# 測試特定等級
python profile_inference.py --mode tier-test --tiers 6 8 16

# 測試時啟用 LM（在支援的等級上）
python profile_inference.py --mode tier-test --tier-with-lm

# 快速測試（非量化等級跳過 torch.compile）
python profile_inference.py --mode tier-test --tier-skip-compile
```

詳見 [BENCHMARK.md](BENCHMARK.md) 獲取效能分析工具的完整文件。

適用場景：
- 在高階硬體上測試 GPU 分級配置
- 驗證各等級的警告和限制是否正常工作
- 修改 `acestep/gpu_config.py` 後的自動化迴歸測試
- CI/CD 顯示記憶體相容性驗證

### 邊界測試（查詢最低等級）

使用 `--tier-boundary` 可以透過實際執行來確定從哪個顯示記憶體等級開始可以安全地關閉 INT8 量化和 CPU 卸載。對於每個等級，最多執行三種配置：

1. **default** — 該等級的預設設定（按配置使用量化 + 卸載）
2. **no-quant** — 保持卸載設定不變，但關閉量化
3. **no-offload** — 不使用量化，也不使用 CPU 卸載（所有模型保留在 GPU 上）

```bash
# 在所有等級上執行邊界測試
python profile_inference.py --mode tier-test --tier-boundary

# 測試特定等級的邊界
python profile_inference.py --mode tier-test --tier-boundary --tiers 8 12 16 20 24

# 啟用 LM 的邊界測試（在支援的等級上）
python profile_inference.py --mode tier-test --tier-boundary --tier-with-lm

# 將結果儲存為 JSON 以便進一步分析
python profile_inference.py --mode tier-test --tier-boundary --benchmark-output boundary_results.json
```

輸出包含一個 **邊界分析** 部分，顯示每種能力的最低等級：

```
BOUNDARY ANALYSIS
=================
  Capability                                    Min Tier   VRAM
  ------------------------------------------------------------
  No INT8 Quantization                          tier6b      20GB
  No CPU Offload (all models on GPU)            tier6b      20GB
  ------------------------------------------------------------
```

> **注意：** 邊界測試結果是經驗性的，可能因 DiT 模型變體（turbo vs base）、是否啟用 LM、生成時長和 flash attention 可用性而有所不同。歡迎社群貢獻來完善這些邊界值！

### 批次大小邊界測試

使用 `--tier-batch-boundary` 透過遞進測試批次大小 1、2、4、8 來查詢每個等級的最大安全批次大小：

```bash
# 執行啟用 LM 的批次邊界測試
python profile_inference.py --mode tier-test --tier-batch-boundary --tier-with-lm

# 測試特定等級
python profile_inference.py --mode tier-test --tier-batch-boundary --tier-with-lm --tiers 8 12 16 24
```

該測試同時測試有 LM 和無 LM 的配置，並報告每個等級的最大成功批次大小。
