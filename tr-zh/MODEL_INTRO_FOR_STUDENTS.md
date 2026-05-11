# ACE-Step 1.5 學生入門講義：用比喻理解模型架構與常用參數

這份講義的目標，是讓第一次接觸 ACE-Step 1.5 的學生，可以由淺入深地理解：

- 這個模型大概如何運作
- `caption`、`lyrics`、`bpm`、`duration` 等參數各自代表什麼
- 有歌詞音樂生成時，應該怎麼組織輸入
- 使用時最常見的錯誤與注意事項

你不需要先懂深度學習或擴散模型。可以先把 ACE-Step 1.5 想像成一個
「AI 音樂製作團隊」。

---

## 1. 一句話理解 ACE-Step 1.5

ACE-Step 1.5 不是單一角色，而是一個分工合作的音樂製作流程：

```text
使用者輸入
→ 5Hz LM 理解與規劃
→ 產生音樂藍圖
→ DiT 根據藍圖生成音訊
→ 輸出歌曲
```

如果用拍一支音樂 MV 來比喻：

| 模型元件 | 比喻 | 負責內容 |
| --- | --- | --- |
| 使用者輸入 | 客戶需求 / 老師題目 | 說明想做什麼音樂 |
| 5Hz LM | 編劇 + 分鏡師 | 理解需求、補全設定、規劃結構 |
| 語義 codes | 分鏡腳本 / 製作藍圖 | 告訴後面的模型音樂應該如何展開 |
| DiT | 錄音室 + 編曲師 + 後製師 | 真正把聲音生成出來 |
| 輸出音訊 | 完成作品 | 最後聽到的歌曲 |

簡單記：

```text
5Hz LM 負責「想清楚」。
DiT 負責「做出來」。
```

---

## 2. 兩個核心角色：LM 與 DiT

### 2.1 5Hz LM：音樂企劃師

5Hz LM 不是直接產生聲音的模型。它比較像音樂企劃師、編劇或分鏡師。

它會幫你做這些事：

- 理解你的音樂描述
- 推測 BPM、調性、拍號、語言與時長
- 改寫或強化 `caption`
- 規劃歌曲結構
- 產生給 DiT 使用的語義藍圖

例如你輸入：

```text
一首溫柔的中文情歌，女生唱，鋼琴伴奏。
```

LM 可能會把它理解並擴充成：

```text
A gentle Mandarin pop ballad with soft female vocals, warm piano accompaniment,
an intimate atmosphere, slow tempo, and an emotional chorus.
```

也就是說，LM 可以把模糊的想法變成比較完整的製作企劃。

### 2.2 DiT：真正的聲音生成者

DiT 是實際產生音訊的模型。它接收文字、歌詞、後設資料、語義 codes
或參考音訊，然後透過擴散生成的方式，把聲音逐步生成出來。

你可以這樣理解：

```text
LM 像導演與企劃。
DiT 像真正進錄音室完成作品的人。
```

如果你開啟 `thinking`，通常代表你讓 LM 先幫你規劃，再交給 DiT 生成。
如果你關閉 `thinking`，就比較像你自己先想好需求，直接把任務交給 DiT。

---

## 3. 最重要的兩個輸入：Caption 與 Lyrics

### 3.1 Caption：整首歌的企劃簡報

`caption` 描述的是整首歌的整體方向。它回答的是：

```text
這首歌整體聽起來像什麼？
```

常見內容包括：

| 維度 | 範例 |
| --- | --- |
| 曲風 | pop, rock, jazz, EDM, lo-fi |
| 情緒 | emotional, dreamy, energetic, melancholic |
| 樂器 | piano, acoustic guitar, synth, strings |
| 人聲 | female vocal, male vocal, breathy vocal |
| 製作質感 | warm, crisp, studio-polished, lo-fi |
| 結構 | catchy chorus, dramatic bridge, fade-out ending |

好的 `caption` 範例：

```text
A gentle Mandarin pop ballad with emotional female vocals, warm piano,
soft strings, slow tempo, intimate atmosphere, and a powerful final chorus.
```

比較不清楚的 `caption`：

```text
好聽的歌。
```

教學重點：

```text
越具體，越可控。
越簡短，越容易有驚喜，但也越不穩定。
```

### 3.2 Lyrics：歌曲的時間腳本

`lyrics` 不只是歌詞文字。它也控制歌曲從頭到尾如何展開。

它回答的是：

```text
這首歌每個時間段要發生什麼？
```

`lyrics` 可以包含：

- 歌詞內容
- 主歌、副歌、橋段等段落結構
- 演唱方式提示
- 器樂段落
- 能量變化
- 開始與結束方式

範例：

```text
[Verse 1]
夜色慢慢落在窗邊
我還記得你的側臉

[Chorus]
如果明天還能遇見
我會把想念唱成永遠

[Bridge]
那些沒說完的話
都留在風裡回答

[Final Chorus]
如果明天還能遇見
我會把想念唱成永遠
```

簡單記：

```text
Caption = 整首歌的風格設定。
Lyrics = 歌曲從頭到尾的劇本。
```

---

## 4. 常見歌詞段落標籤

### 4.1 基礎結構

| 標籤 | 意義 |
| --- | --- |
| `[Intro]` | 開場，建立氛圍 |
| `[Verse]` / `[Verse 1]` | 主歌，通常負責敘事 |
| `[Pre-Chorus]` | 副歌前的鋪陳 |
| `[Chorus]` | 副歌，通常是最容易記住的段落 |
| `[Bridge]` | 橋段，製造轉折或情緒變化 |
| `[Outro]` | 結尾 |
| `[Final Chorus]` | 最後一次副歌，通常更強烈 |

### 4.2 動態段落

| 標籤 | 意義 |
| --- | --- |
| `[Build]` | 能量逐漸增加 |
| `[Drop]` | 電子樂常見的能量釋放段 |
| `[Breakdown]` | 配器變少、情緒暫時收住 |

### 4.3 器樂段落

| 標籤 | 意義 |
| --- | --- |
| `[Instrumental]` | 純音樂，無人聲 |
| `[Guitar Solo]` | 吉他獨奏 |
| `[Piano Interlude]` | 鋼琴間奏 |

### 4.4 特殊標記

| 標籤 | 意義 |
| --- | --- |
| `[Fade Out]` | 漸弱結束 |
| `[Silence]` | 靜默 |

### 4.5 組合標籤

段落標籤可以適度加上演唱方式或情緒提示：

```text
[Chorus - powerful]
[Bridge - whispered]
[Outro - fade out]
```

不建議堆太多：

```text
[Chorus - powerful - emotional - huge - cinematic - explosive - epic]
```

標籤太長或太多時，模型可能會困惑，甚至把標籤文字當成歌詞唱出來。

---

## 5. 有歌詞音樂生成的常用參數

有歌詞的音樂生成，是學生最常遇到的使用情境。可以先掌握下面幾個參數。

| 參數 | 比喻 | 意義 |
| --- | --- | --- |
| `caption` / `prompt` | 製作企劃 | 描述整首歌的風格、情緒、樂器、人聲 |
| `lyrics` | 劇本 | 歌詞與段落結構 |
| `vocal_language` | 演唱語言 | 例如 `zh`、`en`、`ja` |
| `duration` | 片長 | 生成音訊長度 |
| `bpm` | 速度 | 每分鐘幾拍，決定歌曲快慢 |
| `keyscale` | 調性 | 例如 C Major、A minor |
| `timesignature` | 拍號 | 例如 4/4、3/4、6/8 |
| `instrumental` | 是否關掉人聲 | `True` 時生成純音樂 |
| `thinking` | 是否請企劃師幫忙 | `True` 時啟用 5Hz LM 規劃 |
| `seed` | 隨機編號 | 固定 seed 可重現相近結果 |

---

## 6. 重要參數逐一理解

### 6.1 `caption`

`caption` 是最重要的文字輸入。它決定整首歌的方向。

好的寫法：

```text
A warm Mandarin pop ballad with emotional female vocals, soft piano,
subtle strings, slow tempo, intimate mood, and a memorable chorus.
```

不夠清楚的寫法：

```text
做一首很棒的歌。
```

建議學生寫 `caption` 時至少包含三種資訊：

```text
曲風 + 情緒 + 樂器 / 人聲
```

例如：

```text
Mandarin pop ballad + emotional + female vocal and piano
```

### 6.2 `lyrics`

`lyrics` 決定歌曲如何隨時間展開。

好的 `lyrics` 應該：

- 使用清楚的段落標籤
- 每個段落之間空一行
- 每行不要過長
- 主歌、副歌、橋段分清楚
- 不要把所有風格描述都塞進歌詞欄位

範例：

```text
[Verse 1]
雨停在城市邊緣
燈光像遙遠的誓言

[Chorus]
我還在等那一天
等你回到我身邊
```

### 6.3 `vocal_language`

`vocal_language` 告訴模型歌詞語言。

常見值：

| 值 | 意義 |
| --- | --- |
| `zh` | 中文 |
| `en` | 英文 |
| `ja` | 日文 |
| `unknown` | 自動判斷 |

如果是中文歌，建議明確設定：

```text
vocal_language = "zh"
```

### 6.4 `duration`

`duration` 控制生成音訊長度，單位是秒。

```text
duration = 30
duration = 60
duration = 120
```

可以這樣比喻：

```text
duration 像影片片長。
歌詞很多但 duration 太短，模型可能唱得很擠。
歌詞很少但 duration 太長，中間可能會被器樂或延展段落填滿。
```

### 6.5 `bpm`

`bpm` 是歌曲速度，每分鐘幾拍。

| BPM 範圍 | 常見感覺 |
| --- | --- |
| 60-80 | 慢歌、抒情 |
| 90-110 | 中速流行 |
| 120-140 | 舞曲、活潑 |
| 150 以上 | 高能量、快速 |

如果不確定，可以先留空或讓 LM 自動推測。

### 6.6 `keyscale`

`keyscale` 是調性，例如：

```text
C Major
A minor
F# minor
```

初學者不一定需要手動指定。當你希望作品有更明確的音樂方向，或想與其他素材配合時，再手動設定即可。

### 6.7 `timesignature`

`timesignature` 是拍號。

| 值 | 常見意義 |
| --- | --- |
| `4` | 4/4，最常見的流行音樂拍號 |
| `3` | 3/4，常見於華爾滋感 |
| `6` | 6/8，常見於搖擺、敘事感歌曲 |
| `2` | 2/4，較簡潔、行進感較強 |

如果只是一般流行歌，通常可以使用 `4` 或交給模型判斷。

### 6.8 `thinking`

`thinking` 決定是否啟用 5Hz LM 的規劃能力。

```text
thinking = true
```

代表請 LM 幫忙理解、補全與規劃。適合：

- 初學者
- 只有簡短描述
- 希望模型自動補 BPM、調性、語言
- 想快速得到完整效果

```text
thinking = false
```

代表比較直接地讓 DiT 根據輸入生成。適合：

- 你已經很清楚自己要什麼
- 你不希望 LM 改寫你的意圖
- 你正在做精準控制或比較實驗

### 6.9 `seed`

`seed` 是隨機種子。

```text
seed = -1
```

代表每次使用隨機種子。

```text
seed = 12345
```

代表固定一個隨機起點，方便重現或比較參數差異。

可以這樣比喻：

```text
seed 像抽籤號碼。
同一個號碼、同一組設定，通常會得到比較接近的結果。
```

### 6.10 `inference_steps`

`inference_steps` 是 DiT 生成音訊時的推理步數。

可以這樣比喻：

```text
步數越多，像是後製打磨時間越長。
通常品質可能更好，但速度會變慢。
```

Turbo 模型日常使用通常以 `8` 作為起點。Base 模型可能需要更多步數。

---

## 7. 建議初學者工作流

### 第一步：先用簡單描述生成

先從一句自然語言開始：

```text
一首溫柔的中文流行抒情歌，女生唱，鋼琴和弦樂伴奏，情緒感人。
```

目的不是一次就完美，而是先聽模型大概會如何理解你的想法。

### 第二步：改成更清楚的 caption

把自然語言整理成更穩定的描述：

```text
A gentle Mandarin pop ballad with emotional female vocals, warm piano,
soft strings, slow tempo, intimate atmosphere, and a memorable chorus.
```

讓學生理解：自然語言可以用，但結構化描述通常更穩。

### 第三步：加入 lyrics

```text
[Verse 1]
窗外的雨慢慢停歇
我還想起你的側臉

[Chorus]
如果時間能倒回昨天
我會抱緊每個瞬間
```

這一步讓學生聽出：有 `lyrics` 之後，模型不只是做背景音樂，而是在做一首歌曲。

### 第四步：調整參數並比較

可以用同一組 `caption` 和 `lyrics`，依序比較：

- 把 `duration` 從 30 改成 60
- 把 `bpm` 從 76 改成 120
- 固定 `seed`
- 改變 `caption` 裡的樂器
- 把 `[Chorus]` 改成 `[Chorus - powerful]`

這樣學生會更容易理解每個參數造成的差異。

---

## 8. 常見錯誤與注意事項

### 8.1 Caption 和 Lyrics 衝突

不建議：

```text
Caption: gentle piano ballad
Lyrics: [Drop] heavy EDM bass explosion
```

模型會不知道到底要做抒情鋼琴，還是電子舞曲。

建議：

```text
Caption: gentle piano ballad with emotional female vocals
Lyrics: [Chorus - powerful]
```

這樣仍然有情緒高潮，但沒有和整體風格衝突。

### 8.2 歌詞太長但時間太短

如果 `lyrics` 很多，但 `duration` 只有 30 秒，模型可能：

- 唱得很擠
- 漏掉部分歌詞
- 讓旋律變得不自然

建議先讓歌詞長度和音訊長度大致匹配。

### 8.3 段落標籤太複雜

推薦：

```text
[Chorus - powerful]
```

不推薦：

```text
[Chorus - powerful - emotional - huge - cinematic - explosive - epic]
```

標籤應該是提示，不應該變成一整句描述。

### 8.4 只寫很抽象的 prompt

不建議：

```text
做一首很棒的歌。
```

建議：

```text
一首溫柔的中文流行抒情歌，女生唱，鋼琴伴奏，副歌情緒更強。
```

或：

```text
A gentle Mandarin pop ballad with female vocals, warm piano,
slow tempo, emotional chorus, and intimate atmosphere.
```

---

## 9. 完整教學範例

### 9.1 Caption

```text
A gentle Mandarin pop ballad with emotional female vocals, warm piano,
soft strings, slow tempo, intimate atmosphere, and a powerful final chorus.
```

### 9.2 Lyrics

```text
[Intro]
嗯...

[Verse 1]
城市的燈慢慢熄滅
我還留在回憶裡面

[Pre-Chorus]
那些沒說完的抱歉
都變成心裡的雨點

[Chorus]
如果明天還能遇見
我會把想念唱成永遠
就算世界改變
你仍在我心裡面

[Bridge - whispered]
我聽見風輕輕說
別害怕失去什麼

[Final Chorus - powerful]
如果明天還能遇見
我會把想念唱成永遠
就算世界改變
你仍在我心裡面

[Outro - fade out]
嗯...
```

### 9.3 建議參數

```text
vocal_language = "zh"
duration = 90
bpm = 76
thinking = true
seed = -1
```

### 9.4 課堂示範方式

建議依序示範：

1. 原始設定生成一次
2. 固定 `seed`，只把 `bpm` 改成 110
3. 固定 `seed`，只把 `[Final Chorus - powerful]` 改回 `[Final Chorus]`
4. 固定 `seed`，只把 `caption` 裡的 `piano` 改成 `acoustic guitar`

這樣學生會看到：同一首歌的骨架不變時，單一參數如何影響結果。

---

## 10. 給學生的總結

最後可以用四句話收尾：

```text
Caption 決定整首歌的風格。
Lyrics 決定歌曲的時間結構。
參數決定生成時的規格與可控程度。
LM 幫你規劃，DiT 幫你把聲音做出來。
```

推薦學習順序：

```text
先學會寫清楚 caption。
再學會安排 lyrics 結構。
再理解 bpm、duration、vocal_language。
最後才調 seed、thinking、inference_steps 等進階參數。
```

當你不知道怎麼調時，先問自己三個問題：

```text
1. 我有沒有說清楚整首歌的風格？
2. 我有沒有安排清楚歌詞段落？
3. 我的歌詞長度和 duration 是否合理？
```

這三件事做好，通常比一開始就調很多高階參數更重要。
