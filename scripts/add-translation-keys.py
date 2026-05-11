"""
Inject new translation keys into i18n/translations.ts across all 5 language
blocks (en / zh / zh-TW / ja / ko).

Idempotent: existing keys are overwritten in-place; new keys are appended just
before each language block's closing `},`.

Usage:
  uv run python scripts/add-translation-keys.py
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TRANS_FILE = ROOT / "i18n" / "translations.ts"

LANGS = ("en", "zh", "zh-TW", "ja", "ko")

# Mode labels & 1-line descriptions for each of the 7 generation modes.
MODE_ENTRIES: list[tuple[str, dict[str, str]]] = [
    ("modeSimpleLabel", {
        "en": "Simple",
        "zh": "简易",
        "zh-TW": "簡易",
        "ja": "シンプル",
        "ko": "심플",
    }),
    ("modeSimpleDesc", {
        "en": "One line description → ACE-Step writes lyrics, picks BPM/key, generates the song.",
        "zh": "一句话描述，ACE-Step 自动填写歌词、选择 BPM/调式并生成完整歌曲。",
        "zh-TW": "一句話描述，ACE-Step 自動填寫歌詞、選擇 BPM/調式並生成完整歌曲。",
        "ja": "1行の説明だけで、ACE-Step が歌詞・BPM・キーを自動で決めて1曲生成します。",
        "ko": "한 줄 설명만으로 ACE-Step 이 가사·BPM·키를 자동 결정해 곡을 생성합니다.",
    }),
    ("modeCustomLabel", {
        "en": "Custom",
        "zh": "自定义",
        "zh-TW": "自訂",
        "ja": "カスタム",
        "ko": "커스텀",
    }),
    ("modeCustomDesc", {
        "en": "Full control: caption, lyrics with section tags, style, optional reference audio.",
        "zh": "完整控制：可自定义描述、含分段标签的歌词、曲风，并可选参考音频。",
        "zh-TW": "完整控制：可自訂描述、含分段標籤的歌詞、曲風，並可選參考音訊。",
        "ja": "完全制御：キャプション・セクションタグ付き歌詞・スタイル・参考音源（任意）を指定。",
        "ko": "완전 제어: 캡션, 섹션 태그 포함 가사, 스타일, 참조 오디오(선택)를 지정합니다.",
    }),
    ("modeRemixLabel", {
        "en": "Remix",
        "zh": "翻唱",
        "zh-TW": "翻唱",
        "ja": "リミックス",
        "ko": "리믹스",
    }),
    ("modeRemixDesc", {
        "en": "Re-arrange an existing audio file in a new style while keeping its melody.",
        "zh": "保留原音频旋律结构，将其重新编排为不同曲风。",
        "zh-TW": "保留原音訊旋律結構，將其重新編排為不同曲風。",
        "ja": "既存音源のメロディ構造を保ちつつ、新しいスタイルへ再アレンジ。",
        "ko": "기존 오디오의 멜로디 구조를 유지한 채 새로운 스타일로 재편곡합니다.",
    }),
    ("modeRepaintLabel", {
        "en": "Repaint",
        "zh": "重绘",
        "zh-TW": "重繪",
        "ja": "リペイント",
        "ko": "리페인트",
    }),
    ("modeRepaintDesc", {
        "en": "Regenerate a specific time segment of an existing track, keeping context intact.",
        "zh": "针对已有音频的指定时间段重新生成，保留前后段落连贯。",
        "zh-TW": "針對已有音訊的指定時間段重新生成，保留前後段落連貫。",
        "ja": "既存トラックの指定区間だけを再生成し、前後の文脈を維持します。",
        "ko": "기존 트랙의 지정 구간만 재생성하여 전후 흐름을 그대로 유지합니다.",
    }),
    ("modeExtractLabel", {
        "en": "Extract",
        "zh": "抽轨",
        "zh-TW": "抽軌",
        "ja": "抽出",
        "ko": "추출",
    }),
    ("modeExtractDesc", {
        "en": "Isolate a single instrument or vocal track from an existing audio file.",
        "zh": "从现有音频中分离出单一乐器轨或人声轨。",
        "zh-TW": "從現有音訊中分離出單一樂器軌或人聲軌。",
        "ja": "既存音源から特定の楽器や歌唱トラックを分離抽出します。",
        "ko": "기존 오디오에서 특정 악기 또는 보컬 트랙을 분리 추출합니다.",
    }),
    ("modeLegoLabel", {
        "en": "Lego",
        "zh": "拼接",
        "zh-TW": "拼接",
        "ja": "レゴ",
        "ko": "레고",
    }),
    ("modeLegoDesc", {
        "en": "Add a new instrument track to an existing arrangement at a chosen time range.",
        "zh": "在指定时间段为现有编曲叠加新的乐器轨道。",
        "zh-TW": "在指定時間段為現有編曲疊加新的樂器軌道。",
        "ja": "既存アレンジの指定区間に、新しい楽器トラックを重ねて追加します。",
        "ko": "기존 편곡의 지정 구간에 새로운 악기 트랙을 추가합니다.",
    }),
    ("modeCompleteLabel", {
        "en": "Complete",
        "zh": "补全",
        "zh-TW": "補全",
        "ja": "コンプリート",
        "ko": "컴플리트",
    }),
    ("modeCompleteDesc", {
        "en": "Fill in missing instrument tracks to complete a multi-track arrangement.",
        "zh": "补齐多轨编曲中缺失的乐器轨道，形成完整作品。",
        "zh-TW": "補齊多軌編曲中缺失的樂器軌道，形成完整作品。",
        "ja": "マルチトラック編曲の不足楽器トラックを補完して完成させます。",
        "ko": "멀티트랙 편곡에서 빠진 악기 트랙을 채워 완성합니다.",
    }),
]

# Hints for the most common parameters. Phase 6 will round out the rest.
HINT_ENTRIES: list[tuple[str, dict[str, str]]] = [
    ("hint.bpm", {
        "en": "Beats per minute. Pop 90-130, dance 120-140, ballad 60-90.",
        "zh": "每分钟节拍数，影响歌曲速度。流行 90-130、舞曲 120-140、抒情 60-90。",
        "zh-TW": "每分鐘節拍數，影響歌曲速度。流行 90-130、舞曲 120-140、抒情 60-90。",
        "ja": "1分あたりの拍数。ポップ 90-130、ダンス 120-140、バラード 60-90 が目安。",
        "ko": "분당 박자 수. 팝 90-130, 댄스 120-140, 발라드 60-90 정도가 일반적입니다.",
    }),
    ("hint.keyScale", {
        "en": "Musical key. Major sounds bright; minor sounds darker / more emotional.",
        "zh": "调式。大调明亮、小调更具情绪与忧郁感。",
        "zh-TW": "調式。大調明亮、小調更具情緒與憂鬱感。",
        "ja": "調性。長調は明るく、短調は暗く感情的な印象になります。",
        "ko": "조성. 장조는 밝고, 단조는 어둡고 감정적인 느낌을 줍니다.",
    }),
    ("hint.timeSignature", {
        "en": "Beats per bar. 4 = standard pop/rock, 3 = waltz, 6 = ballad swing.",
        "zh": "每小节拍数。4 为流行/摇滚标准，3 为华尔兹，6 多用于摇摆抒情。",
        "zh-TW": "每小節拍數。4 為流行／搖滾標準，3 為華爾滋，6 多用於搖擺抒情。",
        "ja": "1小節あたりの拍数。4 = ポップ/ロック標準、3 = ワルツ、6 = バラード系スウィング。",
        "ko": "마디당 박자 수. 4 = 팝/록 표준, 3 = 왈츠, 6 = 발라드 스윙.",
    }),
    ("hint.duration", {
        "en": "Target song length in seconds. -1 lets the model decide automatically.",
        "zh": "目标歌曲时长（秒）。-1 表示由模型自动决定。",
        "zh-TW": "目標歌曲時長（秒）。-1 表示由模型自動決定。",
        "ja": "目標の楽曲長（秒）。-1 でモデルに自動決定させます。",
        "ko": "목표 곡 길이(초). -1 이면 모델이 자동으로 결정합니다.",
    }),
    ("hint.guidanceScale", {
        "en": "How strictly to follow the prompt. Higher = closer match but less natural. 7-9 recommended.",
        "zh": "提示遵循程度。数值越高越贴近描述但易僵硬，建议 7-9。",
        "zh-TW": "提示遵循程度。數值越高越貼近描述但易僵硬，建議 7-9。",
        "ja": "プロンプト追従度。高いほど指示通りだが不自然になりがち。推奨 7-9。",
        "ko": "프롬프트 충실도. 값이 높을수록 지시에 충실하나 부자연스러워집니다. 7-9 권장.",
    }),
    ("hint.inferenceSteps", {
        "en": "Diffusion steps. More = higher quality but slower. Turbo 8-12, base 32-64.",
        "zh": "扩散步数。越多质量越好但速度越慢。Turbo 模型 8-12，基础模型 32-64。",
        "zh-TW": "擴散步數。越多品質越好但速度越慢。Turbo 模型 8-12，基礎模型 32-64。",
        "ja": "拡散ステップ数。多いほど高品質だが遅くなる。Turbo 8-12、ベース 32-64。",
        "ko": "디퓨전 스텝 수. 많을수록 품질이 좋아지지만 느려집니다. Turbo 8-12, 베이스 32-64.",
    }),
    ("hint.batchSize", {
        "en": "Number of variations to generate per click. Each variation uses a different seed.",
        "zh": "每次点击生成的变体数。每个变体使用不同的种子。",
        "zh-TW": "每次點擊生成的變體數。每個變體使用不同的種子。",
        "ja": "1回の生成で出力するバリエーション数。各バリエーションで異なるシードを使用。",
        "ko": "한 번에 생성할 변형 개수. 각 변형은 서로 다른 시드를 사용합니다.",
    }),
    ("hint.seed", {
        "en": "Random seed for reproducibility. Same seed + same params = same output.",
        "zh": "随机种子，用于可复现。相同种子加相同参数会得到相同结果。",
        "zh-TW": "隨機種子，用於可重現。相同種子加相同參數會得到相同結果。",
        "ja": "再現用のランダムシード。同じシード+同じパラメータで同じ結果。",
        "ko": "재현용 랜덤 시드. 같은 시드 + 같은 파라미터로 동일한 결과가 나옵니다.",
    }),
    ("hint.randomSeed", {
        "en": "When ON, a fresh random seed is used each generation. Turn OFF to lock the seed.",
        "zh": "开启时每次生成使用新随机种子；关闭则锁定种子值。",
        "zh-TW": "開啟時每次生成使用新隨機種子；關閉則鎖定種子值。",
        "ja": "ONで毎回新しいシード、OFFでシードを固定します。",
        "ko": "켜면 매번 새 시드, 끄면 시드를 고정합니다.",
    }),
    ("hint.inferMethod", {
        "en": "Diffusion sampler. ODE = deterministic & faster, SDE = stochastic, varied.",
        "zh": "扩散采样方式。ODE 为确定性且较快，SDE 为随机带变化。",
        "zh-TW": "擴散取樣方式。ODE 為確定性且較快，SDE 為隨機帶變化。",
        "ja": "拡散サンプラ。ODE は決定論的で高速、SDE は確率的で多様性あり。",
        "ko": "디퓨전 샘플러. ODE 는 결정적이고 빠르며, SDE 는 확률적이고 다양합니다.",
    }),
    ("hint.shift", {
        "en": "Timestep shift for base models. 3.0 is the recommended default.",
        "zh": "基础模型的时间步偏移，推荐默认 3.0。",
        "zh-TW": "基礎模型的時間步偏移，推薦預設 3.0。",
        "ja": "ベースモデル向けタイムステップシフト。デフォルト 3.0 推奨。",
        "ko": "베이스 모델용 타임스텝 시프트. 기본값 3.0 권장.",
    }),
    ("hint.audioFormat", {
        "en": "Output file format. MP3 is small and universal; FLAC is lossless.",
        "zh": "输出档格式。MP3 小巧通用；FLAC 无损。",
        "zh-TW": "輸出檔格式。MP3 小巧通用；FLAC 無損。",
        "ja": "出力フォーマット。MP3 は軽量・汎用、FLAC はロスレス。",
        "ko": "출력 파일 형식. MP3 는 가볍고 호환성 좋음, FLAC 는 무손실.",
    }),
    ("hint.thinking", {
        "en": "Chain-of-Thought reasoning by the LM. Slower but better arrangement decisions.",
        "zh": "由语言模型进行思维链推理，速度变慢但编排决策更佳。",
        "zh-TW": "由語言模型進行思維鏈推理，速度變慢但編排決策更佳。",
        "ja": "LM による思考連鎖推論。遅くなるがアレンジ判断の質が向上します。",
        "ko": "LM 의 사고 사슬 추론. 느려지지만 편곡 판단 품질이 향상됩니다.",
    }),
    ("hint.enhance", {
        "en": "AI auto-enhances the prompt before generation for richer arrangements.",
        "zh": "生成前由 AI 自动增强提示，可获得更丰富的编排。",
        "zh-TW": "生成前由 AI 自動增強提示，可獲得更豐富的編排。",
        "ja": "生成前に AI がプロンプトを自動拡張し、より豊かなアレンジを実現。",
        "ko": "생성 전에 AI 가 프롬프트를 자동 강화해 더 풍부한 편곡을 만듭니다.",
    }),
    ("hint.lmTemperature", {
        "en": "LM sampling temperature. Lower = more predictable, higher = more creative. 0.85 default.",
        "zh": "语言模型采样温度。低值更稳定、高值更有创意。预设 0.85。",
        "zh-TW": "語言模型取樣溫度。低值更穩定、高值更有創意。預設 0.85。",
        "ja": "LM サンプリング温度。低いと安定、高いと創造的。デフォルト 0.85。",
        "ko": "LM 샘플링 온도. 낮을수록 안정적, 높을수록 창의적. 기본값 0.85.",
    }),
    ("hint.lmCfgScale", {
        "en": "LM guidance strength. Default 2.0; raise for stronger prompt adherence.",
        "zh": "语言模型引导强度。预设 2.0；提高可加强对提示的遵循。",
        "zh-TW": "語言模型引導強度。預設 2.0；提高可加強對提示的遵循。",
        "ja": "LM ガイダンス強度。デフォルト 2.0、上げるとプロンプト追従が強化。",
        "ko": "LM 가이던스 강도. 기본값 2.0, 높이면 프롬프트 충실도 강화.",
    }),
    ("hint.lmTopK", {
        "en": "Top-K filtering. 0 disables; positive values restrict to top-K candidates.",
        "zh": "Top-K 过滤。0 表示停用，正数限制候选数。",
        "zh-TW": "Top-K 過濾。0 表示停用，正數限制候選數。",
        "ja": "Top-K フィルタ。0 で無効、正の値で上位 K 候補に制限。",
        "ko": "Top-K 필터. 0 이면 비활성, 양수로 상위 K 후보로 제한.",
    }),
    ("hint.lmTopP", {
        "en": "Nucleus sampling threshold. 0.9 default — keeps the top 90% probability mass.",
        "zh": "核采样阈值。预设 0.9，保留累积概率前 90% 的候选。",
        "zh-TW": "核取樣閾值。預設 0.9，保留累積機率前 90% 的候選。",
        "ja": "Nucleus サンプリング閾値。デフォルト 0.9、累積確率上位 90% を保持。",
        "ko": "Nucleus 샘플링 임계값. 기본값 0.9 — 누적확률 상위 90%를 유지.",
    }),
    ("hint.audioCoverStrength", {
        "en": "How strongly to follow the source audio. 1.0 = preserve melody, 0 = ignore source.",
        "zh": "对源音频的遵循强度。1.0 完整保留旋律，0 忽略源音频。",
        "zh-TW": "對源音訊的遵循強度。1.0 完整保留旋律，0 忽略源音訊。",
        "ja": "ソース音源への追従強度。1.0 でメロディ完全保持、0 で無視。",
        "ko": "소스 오디오 추종 강도. 1.0 이면 멜로디 완전 보존, 0 이면 무시.",
    }),
    ("hint.repaintingStart", {
        "en": "Time (in seconds) where the regenerated segment starts.",
        "zh": "重新生成区段的起始时间（秒）。",
        "zh-TW": "重新生成區段的起始時間（秒）。",
        "ja": "再生成区間の開始時刻（秒）。",
        "ko": "재생성 구간의 시작 시각(초).",
    }),
    ("hint.repaintingEnd", {
        "en": "Time (in seconds) where the regenerated segment ends.",
        "zh": "重新生成区段的结束时间（秒）。",
        "zh-TW": "重新生成區段的結束時間（秒）。",
        "ja": "再生成区間の終了時刻（秒）。",
        "ko": "재생성 구간의 종료 시각(초).",
    }),
    ("hint.trackName", {
        "en": "Which stem to extract or replace (vocals, drums, bass, etc.).",
        "zh": "要抽取或替换的轨道（人声、鼓、贝斯等）。",
        "zh-TW": "要抽取或替換的軌道（人聲、鼓、貝斯等）。",
        "ja": "抽出または差し替える楽器パート（ボーカル・ドラム・ベース等）。",
        "ko": "추출하거나 교체할 트랙(보컬·드럼·베이스 등).",
    }),
    ("hint.completeTrackClasses", {
        "en": "Choose which instrument tracks the model should fill in.",
        "zh": "选择模型要补全的乐器轨道。",
        "zh-TW": "選擇模型要補全的樂器軌道。",
        "ja": "モデルが補完する楽器トラックを選択します。",
        "ko": "모델이 채워 넣을 악기 트랙을 선택합니다.",
    }),
    ("hint.useAdg", {
        "en": "Adaptive Dual Guidance. Improves prompt adherence on base models.",
        "zh": "自适应双重引导。改善基础模型对提示的遵循度。",
        "zh-TW": "自適應雙重引導。改善基礎模型對提示的遵循度。",
        "ja": "適応的二重ガイダンス。ベースモデルでプロンプト追従が向上します。",
        "ko": "적응형 이중 가이던스. 베이스 모델의 프롬프트 충실도를 개선합니다.",
    }),
    ("hint.cfgIntervalStart", {
        "en": "Diffusion fraction at which CFG starts being applied. 0 = from the very start.",
        "zh": "开始施加 CFG 的扩散进度比例。0 表示从一开始就启用。",
        "zh-TW": "開始施加 CFG 的擴散進度比例。0 表示從一開始就啟用。",
        "ja": "CFG 適用を開始する拡散進捗率。0 で最初から有効。",
        "ko": "CFG 적용 시작 디퓨전 진행도 비율. 0 이면 처음부터 적용.",
    }),
    ("hint.cfgIntervalEnd", {
        "en": "Diffusion fraction at which CFG stops being applied. 1 = until the end.",
        "zh": "停止施加 CFG 的扩散进度比例。1 表示一直施加到结束。",
        "zh-TW": "停止施加 CFG 的擴散進度比例。1 表示一直施加到結束。",
        "ja": "CFG 適用を終了する拡散進捗率。1 で最後まで有効。",
        "ko": "CFG 적용 종료 디퓨전 진행도 비율. 1 이면 끝까지 적용.",
    }),
    ("hint.useCotMetas", {
        "en": "Let the LM auto-fill BPM/key/time signature/duration based on the description.",
        "zh": "由语言模型根据描述自动填写 BPM、调式、拍号、时长。",
        "zh-TW": "由語言模型根據描述自動填寫 BPM、調式、拍號、時長。",
        "ja": "LM が説明文から BPM・キー・拍子・尺を自動補完します。",
        "ko": "LM 이 설명문에서 BPM·키·박자·길이를 자동으로 채웁니다.",
    }),
    ("hint.useCotCaption", {
        "en": "Let the LM rewrite / enhance the caption before generation.",
        "zh": "由语言模型在生成前自动改写并增强描述。",
        "zh-TW": "由語言模型在生成前自動改寫並增強描述。",
        "ja": "生成前に LM がキャプションを書き換え・強化します。",
        "ko": "생성 전에 LM 이 캡션을 다시 작성하고 강화합니다.",
    }),
    ("hint.useCotLanguage", {
        "en": "Let the LM auto-detect vocal language from the lyrics.",
        "zh": "由语言模型从歌词中自动检测演唱语言。",
        "zh-TW": "由語言模型從歌詞中自動偵測演唱語言。",
        "ja": "LM が歌詞から歌唱言語を自動判定します。",
        "ko": "LM 이 가사에서 보컬 언어를 자동 감지합니다.",
    }),
    ("hint.loraPath", {
        "en": "Path to a trained LoRA adapter file (.safetensors).",
        "zh": "已训练 LoRA 适配器文件 (.safetensors) 的路径。",
        "zh-TW": "已訓練 LoRA 介面卡檔案 (.safetensors) 的路徑。",
        "ja": "学習済み LoRA アダプタ (.safetensors) のパス。",
        "ko": "학습된 LoRA 어댑터 (.safetensors) 파일 경로.",
    }),
    ("hint.loraScale", {
        "en": "How strongly the LoRA adapter affects generation. 0 = no effect, 1 = full strength.",
        "zh": "LoRA 适配器对生成的影响强度。0 无效、1 全开。",
        "zh-TW": "LoRA 介面卡對生成的影響強度。0 無效、1 全開。",
        "ja": "LoRA アダプタの効き具合。0 で無効、1 で最大。",
        "ko": "LoRA 어댑터 영향 강도. 0 이면 비적용, 1 이면 최대.",
    }),
    ("hint.referenceAudio", {
        "en": "Optional audio whose timbre/style guides the new song. Leave empty to skip.",
        "zh": "可选参考音频，其音色 / 风格将引导新歌生成；留空则不使用。",
        "zh-TW": "可選參考音訊，其音色 / 風格將引導新歌生成；留空則不使用。",
        "ja": "任意の参考音源。音色やスタイルを新曲生成に活かします。空欄で無効。",
        "ko": "선택 참조 오디오. 음색·스타일을 새 곡에 반영합니다. 비워두면 미사용.",
    }),
    ("hint.sourceAudio", {
        "en": "The audio to remix / repaint / extract from. Required for these modes.",
        "zh": "用于翻唱 / 重绘 / 抽轨的源音频，这些模式必填。",
        "zh-TW": "用於翻唱 / 重繪 / 抽軌的源音訊，這些模式必填。",
        "ja": "リミックス・リペイント・抽出に使うソース音源。これらモードでは必須。",
        "ko": "리믹스·리페인트·추출에 사용할 소스 오디오. 해당 모드에서 필수입니다.",
    }),
    ("hint.audioCodes", {
        "en": "Pre-computed semantic audio codes (5Hz). Advanced override for the LM melody plan.",
        "zh": "预先计算的语义音频码 (5Hz)，用于覆盖 LM 旋律规划，进阶用法。",
        "zh-TW": "預先計算的語義音訊碼 (5Hz)，用於覆寫 LM 旋律規劃，進階用法。",
        "ja": "事前計算済みの意味的音声コード (5Hz)。LM メロディ計画を上書きする上級用途。",
        "ko": "미리 계산된 의미 오디오 코드(5Hz). LM 멜로디 계획을 덮어쓰는 고급 용도.",
    }),
    ("hint.lmNegativePrompt", {
        "en": "Tell the LM what to avoid. Default 'NO USER INPUT' lets the model decide.",
        "zh": "告诉语言模型要避免的内容。预设 'NO USER INPUT' 让模型自行决定。",
        "zh-TW": "告訴語言模型要避免的內容。預設 'NO USER INPUT' 讓模型自行決定。",
        "ja": "LM に避けてほしい内容を指定。デフォルト 'NO USER INPUT' で自動。",
        "ko": "LM 이 피해야 할 내용을 지정. 기본값 'NO USER INPUT' 은 자동.",
    }),
]

UI_ENTRIES: list[tuple[str, dict[str, str]]] = [
    ("workspace", {
        "en": "Workspace",
        "zh": "工作区",
        "zh-TW": "工作區",
        "ja": "ワークスペース",
        "ko": "워크스페이스",
    }),
    ("openWorkspace", {
        "en": "Open workspace",
        "zh": "打开工作区",
        "zh-TW": "開啟工作區",
        "ja": "ワークスペースを開く",
        "ko": "워크스페이스 열기",
    }),
    ("collapseWorkspace", {
        "en": "Collapse workspace",
        "zh": "收起工作区",
        "zh-TW": "收合工作區",
        "ja": "ワークスペースを折りたたむ",
        "ko": "워크스페이스 접기",
    }),
    ("expandWorkspace", {
        "en": "Expand workspace",
        "zh": "展开工作区",
        "zh-TW": "展開工作區",
        "ja": "ワークスペースを展開",
        "ko": "워크스페이스 펼치기",
    }),
    ("noSongSelected", {
        "en": "No song selected",
        "zh": "未选择歌曲",
        "zh-TW": "未選擇歌曲",
        "ja": "曲が選択されていません",
        "ko": "선택된 곡이 없습니다",
    }),
    ("basicMode", {
        "en": "Basic",
        "zh": "基础",
        "zh-TW": "基礎",
        "ja": "ベーシック",
        "ko": "기본",
    }),
    ("proMode", {
        "en": "Pro",
        "zh": "专业",
        "zh-TW": "專業",
        "ja": "プロ",
        "ko": "프로",
    }),
    ("basicModeTooltip", {
        "en": "Show only the most common parameters for fast generation.",
        "zh": "仅显示最常用参数，便于快速生成。",
        "zh-TW": "僅顯示最常用參數，便於快速生成。",
        "ja": "最も使う基本パラメータのみ表示し、素早く生成します。",
        "ko": "가장 자주 쓰는 기본 파라미터만 표시해 빠르게 생성합니다.",
    }),
    ("proModeTooltip", {
        "en": "Show all advanced sections (LM / Diffusion / LoRA / Output).",
        "zh": "显示全部高级区段（LM / 扩散 / LoRA / 输出）。",
        "zh-TW": "顯示全部進階區段（LM / 擴散 / LoRA / 輸出）。",
        "ja": "高度な全セクションを表示（LM / 拡散 / LoRA / 出力）。",
        "ko": "모든 고급 섹션을 표시(LM / 디퓨전 / LoRA / 출력).",
    }),
    ("dragToResize", {
        "en": "Drag to resize · Double-click to reset",
        "zh": "拖动调整宽度 · 双击重置",
        "zh-TW": "拖曳調整寬度 · 雙擊還原",
        "ja": "ドラッグで幅調整・ダブルクリックでリセット",
        "ko": "드래그로 너비 조절 · 더블클릭으로 초기화",
    }),
    ("examples", {
        "en": "Examples",
        "zh": "示例",
        "zh-TW": "範例",
        "ja": "サンプル",
        "ko": "예제",
    }),
    ("examplesHeader", {
        "en": "Bundled prompts & params",
        "zh": "内建提示词与参数",
        "zh-TW": "內建提示詞與參數",
        "ja": "内蔵プロンプトとパラメータ",
        "ko": "내장 프롬프트 및 파라미터",
    }),
    ("loadJson", {
        "en": "Load JSON",
        "zh": "载入 JSON",
        "zh-TW": "載入 JSON",
        "ja": "JSON 読込",
        "ko": "JSON 불러오기",
    }),
    ("exportJson", {
        "en": "Export JSON",
        "zh": "导出 JSON",
        "zh-TW": "匯出 JSON",
        "ja": "JSON 書出",
        "ko": "JSON 내보내기",
    }),
    ("loadJsonTooltip", {
        "en": "Load a parameters JSON (compatible with ACE-Step Gradio examples).",
        "zh": "载入参数 JSON 文件（兼容 ACE-Step Gradio 范例）。",
        "zh-TW": "載入參數 JSON 檔（相容 ACE-Step Gradio 範例）。",
        "ja": "パラメータ JSON を読み込みます（ACE-Step Gradio サンプル互換）。",
        "ko": "파라미터 JSON 파일을 불러옵니다(ACE-Step Gradio 예제 호환).",
    }),
    ("exportJsonTooltip", {
        "en": "Save current settings as JSON for sharing or reuse.",
        "zh": "把当前设定存成 JSON，方便分享或重复使用。",
        "zh-TW": "把目前設定存成 JSON，方便分享或重複使用。",
        "ja": "現在の設定を JSON として保存（共有・再利用用）。",
        "ko": "현재 설정을 JSON 으로 저장(공유·재사용용).",
    }),
]

ALL_ENTRIES = MODE_ENTRIES + HINT_ENTRIES + UI_ENTRIES


def find_block_end(text: str, lang_key: str) -> int | None:
    """Return the index of the closing `}` for the given language block."""
    pattern = re.compile(
        rf"^(  )(?:'?{re.escape(lang_key)}'?):\s*\{{\s*$",
        re.MULTILINE,
    )
    m = pattern.search(text)
    if not m:
        return None
    i = m.end()
    depth = 1
    while i < len(text) and depth > 0:
        ch = text[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return None


def js_string(s: str) -> str:
    return "'" + s.replace("\\", "\\\\").replace("'", "\\'") + "'"


def js_key(k: str) -> str:
    return k if re.fullmatch(r"[A-Za-z_$][A-Za-z0-9_$]*", k) else js_string(k)


def upsert_block(text: str, lang: str, entries: list[tuple[str, str]]) -> str:
    """For one language block, replace any existing keys and append new ones before `}`."""
    end = find_block_end(text, lang)
    if end is None:
        print(f"WARN: block '{lang}' not found", file=sys.stderr)
        return text

    # Replace existing keys.
    body_start_match = re.search(
        rf"^(  )(?:'?{re.escape(lang)}'?):\s*\{{\s*$", text, flags=re.MULTILINE
    )
    body_start = body_start_match.end() if body_start_match else 0
    block_text = text[body_start:end]
    block_replaced = block_text
    new_lines: list[str] = []
    for key, value in entries:
        # Match `<key>: '...'` or `'<key>': '...'` lines.
        # The string body must allow escaped apostrophes (e.g. \'foo\') and escaped quotes,
        # so the inner pattern is `(?:\\.|[^'\\])*` rather than the naive `[^']*`.
        pattern = re.compile(
            rf"^(\s+)(?:{re.escape(key)}|{re.escape(js_string(key))}):\s*"
            r"(?:'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"),?\s*$",
            re.MULTILINE,
        )
        replacement_line = f"    {js_key(key)}: {js_string(value)},"
        if pattern.search(block_replaced):
            block_replaced = pattern.sub(lambda m: replacement_line, block_replaced, count=1)
        else:
            new_lines.append(replacement_line)

    text = text[:body_start] + block_replaced + text[end:]
    if not new_lines:
        return text

    end = find_block_end(text, lang)
    if end is None:
        return text

    insertion = "\n    // Phase 1.4: mode labels & hints (auto-generated)\n" + "\n".join(new_lines) + "\n  "
    return text[:end] + insertion + text[end:]


def main() -> int:
    text = TRANS_FILE.read_text(encoding="utf-8")
    for lang in LANGS:
        entries = [(k, vals.get(lang) or vals["en"]) for k, vals in ALL_ENTRIES]
        text = upsert_block(text, lang, entries)
    TRANS_FILE.write_text(text, encoding="utf-8")
    print(f"OK: upserted {len(ALL_ENTRIES)} keys into {len(LANGS)} languages -> {TRANS_FILE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
