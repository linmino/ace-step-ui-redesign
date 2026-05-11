import React from 'react';
import { Settings2, ChevronDown, Music2, Dices, Hash, Upload } from 'lucide-react';
import { useI18n } from '../../../context/I18nContext';
import { EditableSlider } from '../../EditableSlider';

const TRACK_NAMES = ['vocals', 'drums', 'bass', 'guitar', 'piano', 'strings', 'synth', 'fx', 'other'];

/**
 * State bundle passed from CreatePanel container. Every property that the
 * Advanced settings UI reads or writes lives in this object, so the prop
 * surface stays tractable instead of 50 individual props.
 *
 * `updaters` is the matching mutator bundle. Splitting reads from writes
 * keeps re-render boundaries clean and reads ergonomic at the call sites.
 */
export interface AdvancedSectionState {
    // Visibility
    showAdvanced: boolean;
    showLmParams: boolean;
    // Generation core
    duration: number;
    batchSize: number;
    bulkCount: number;
    inferenceSteps: number;
    guidanceScale: number;
    audioFormat: 'mp3' | 'flac';
    inferMethod: 'ode' | 'sde';
    randomSeed: boolean;
    seed: number;
    shift: number;
    // LM
    lmBackend: 'pt' | 'vllm';
    lmModel: string;
    lmTemperature: number;
    lmCfgScale: number;
    lmTopK: number;
    lmTopP: number;
    lmNegativePrompt: string;
    thinking: boolean;
    // Diffusion advanced
    cfgIntervalStart: number;
    cfgIntervalEnd: number;
    customTimesteps: string;
    useAdg: boolean;
    // Repaint / task
    audioCodes: string;
    sourceAudioUrl?: string;
    taskType: string;
    audioCoverStrength: number;
    repaintingStart: number;
    repaintingEnd: number;
    instruction: string;
    // Score / batch
    scoreScale: number;
    lmBatchChunkSize: number;
    // Stem
    trackName: string;
    completeTrackClasses: string;
    // CoT / output flags
    autogen: boolean;
    allowLmBatch: boolean;
    constrainedDecodingDebug: boolean;
    useCotMetas: boolean;
    useCotCaption: boolean;
    useCotLanguage: boolean;
    isFormatCaption: boolean;
    getScores: boolean;
    getLrc: boolean;
    // Cross-section state
    loraLoaded: boolean;
    selectedModel: string;
    uploadError: string | null;
}

export interface AdvancedSectionUpdaters {
    setShowAdvanced: (v: boolean) => void;
    setShowLmParams: (v: boolean) => void;
    setDuration: (v: number) => void;
    setBatchSize: (v: number) => void;
    setBulkCount: (v: number) => void;
    setInferenceSteps: (v: number) => void;
    setGuidanceScale: (v: number) => void;
    setAudioFormat: (v: 'mp3' | 'flac') => void;
    setInferMethod: (v: 'ode' | 'sde') => void;
    setRandomSeed: (v: boolean) => void;
    setSeed: (v: number) => void;
    setShift: (v: number) => void;
    setLmBackend: (v: 'pt' | 'vllm') => void;
    setLmModel: (v: string) => void;
    setLmTemperature: (v: number) => void;
    setLmCfgScale: (v: number) => void;
    setLmTopK: (v: number) => void;
    setLmTopP: (v: number) => void;
    setLmNegativePrompt: (v: string) => void;
    setThinking: (v: boolean) => void;
    setCfgIntervalStart: (v: number) => void;
    setCfgIntervalEnd: (v: number) => void;
    setCustomTimesteps: (v: string) => void;
    setUseAdg: (v: boolean) => void;
    setAudioCodes: (v: string) => void;
    setTaskType: (v: string) => void;
    setAudioCoverStrength: (v: number) => void;
    setRepaintingStart: (v: number) => void;
    setRepaintingEnd: (v: number) => void;
    setInstruction: (v: string) => void;
    setScoreScale: (v: number) => void;
    setLmBatchChunkSize: (v: number) => void;
    setTrackName: (v: string) => void;
    setCompleteTrackClasses: (v: string) => void;
    setAutogen: (v: boolean) => void;
    setAllowLmBatch: (v: boolean) => void;
    setConstrainedDecodingDebug: (v: boolean) => void;
    setUseCotMetas: (v: boolean) => void;
    setUseCotCaption: (v: boolean) => void;
    setUseCotLanguage: (v: boolean) => void;
    setIsFormatCaption: (v: boolean) => void;
    setGetScores: (v: boolean) => void;
    setGetLrc: (v: boolean) => void;
    handleLoadParamsFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isTurboModel: (model: string) => boolean;
}

export interface AdvancedSectionProps {
    state: AdvancedSectionState;
    set: AdvancedSectionUpdaters;
}

/**
 * Extracted from CreatePanel.tsx (Phase 3.2). Visual / behaviour zero-diff.
 * The outer toggle button + collapse stay here; the container controls
 * whether to mount this section at all (via mode visibility in Phase 4+).
 */
export const AdvancedSection: React.FC<AdvancedSectionProps> = ({ state: s, set }) => {
    const { t } = useI18n();

    return (
        <>
            <button
                onClick={() => set.setShowAdvanced(!s.showAdvanced)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-suno-card rounded-xl border border-zinc-200 dark:border-white/5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Settings2 size={16} className="text-zinc-500" />
                    <span>{t('advancedSettings')}</span>
                </div>
                <ChevronDown size={16} className={`text-zinc-500 transition-transform ${s.showAdvanced ? 'rotate-180' : ''}`} />
            </button>

            {s.showAdvanced && (
                <div className="bg-white dark:bg-suno-card rounded-xl border border-zinc-200 dark:border-white/5 p-4 space-y-4">
                    {/* Load Parameters from JSON */}
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-zinc-300 dark:border-white/15 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-white/5 cursor-pointer transition-colors">
                        <Upload size={14} />
                        Load Parameters (JSON)
                        <input type="file" accept=".json" onChange={set.handleLoadParamsFile} className="hidden" />
                    </label>

                    <EditableSlider
                        label={t('duration')}
                        value={s.duration}
                        min={-1}
                        max={600}
                        step={5}
                        onChange={set.setDuration}
                        formatDisplay={(val) => val === -1 ? t('auto') : `${val}${t('seconds')}`}
                        autoLabel={t('auto')}
                        helpText={`${t('auto')} - 10 ${t('min')}`}
                    />

                    <EditableSlider
                        label={t('batchSize')}
                        value={s.batchSize}
                        min={1}
                        max={4}
                        step={1}
                        onChange={set.setBatchSize}
                        helpText={t('numberOfVariations')}
                        title="Creates multiple variations in a single run. More variations = longer total time."
                    />

                    {/* Bulk Generate */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('bulkGenerate')}</label>
                            <span className="text-xs font-mono text-zinc-900 dark:text-white bg-zinc-100 dark:bg-black/20 px-2 py-0.5 rounded">
                                {s.bulkCount} {t(s.bulkCount === 1 ? 'job' : 'jobs')}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 5, 10].map((count) => (
                                <button
                                    key={count}
                                    onClick={() => { set.setBulkCount(count); localStorage.setItem('ace-bulkCount', String(count)); }}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                        s.bulkCount === count
                                            ? 'bg-gradient-to-r from-orange-500 to-pink-600 text-white shadow-md'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                    }`}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-zinc-500">{t('queueMultipleJobs')}</p>
                    </div>

                    <EditableSlider
                        label={t('inferenceSteps')}
                        value={s.inferenceSteps}
                        min={1}
                        max={set.isTurboModel(s.selectedModel) ? 20 : 200}
                        step={1}
                        onChange={set.setInferenceSteps}
                        helpText={t('moreStepsBetterQuality')}
                        title="More steps usually improves quality but slows generation."
                    />

                    <EditableSlider
                        label={t('guidanceScale')}
                        value={s.guidanceScale}
                        min={1}
                        max={15}
                        step={0.1}
                        onChange={set.setGuidanceScale}
                        formatDisplay={(val) => val.toFixed(1)}
                        helpText={t('howCloselyFollowPrompt')}
                        title="How strongly the model follows the prompt. Higher = stricter, lower = freer."
                    />

                    {/* Audio Format & Inference Method */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('audioFormat')}</label>
                            <select
                                value={s.audioFormat}
                                onChange={(e) => set.setAudioFormat(e.target.value as 'mp3' | 'flac')}
                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 transition-colors cursor-pointer [&>option]:bg-white [&>option]:dark:bg-zinc-800 [&>option]:text-zinc-900 [&>option]:dark:text-white"
                            >
                                <option value="mp3">{t('mp3Smaller')}</option>
                                <option value="flac">{t('flacLossless')}</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Deterministic is more repeatable; stochastic adds randomness.">{t('inferMethod')}</label>
                            <select
                                value={s.inferMethod}
                                onChange={(e) => set.setInferMethod(e.target.value as 'ode' | 'sde')}
                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 transition-colors cursor-pointer [&>option]:bg-white [&>option]:dark:bg-zinc-800 [&>option]:text-zinc-900 [&>option]:dark:text-white"
                            >
                                <option value="ode">{t('odeDeterministic')}</option>
                                <option value="sde">{t('sdeStochastic')}</option>
                            </select>
                        </div>
                    </div>

                    {/* LM Backend */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('lmBackendLabel')}</label>
                        <select
                            value={s.lmBackend}
                            onChange={(e) => set.setLmBackend(e.target.value as 'pt' | 'vllm')}
                            className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none"
                        >
                            <option value="pt">{t('lmBackendPt')}</option>
                            <option value="vllm">{t('lmBackendVllm')}</option>
                        </select>
                        <p className="text-[10px] text-zinc-500">{t('lmBackendHint')}</p>
                    </div>

                    {/* LM Model */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('lmModelLabel')}</label>
                        <select
                            value={s.lmModel}
                            onChange={(e) => { const v = e.target.value; set.setLmModel(v); localStorage.setItem('ace-lmModel', v); }}
                            className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none"
                        >
                            <option value="acestep-5Hz-lm-0.6B">{t('lmModel06B')}</option>
                            <option value="acestep-5Hz-lm-1.7B">{t('lmModel17B')}</option>
                            <option value="acestep-5Hz-lm-4B">{t('lmModel4B')}</option>
                        </select>
                        <p className="text-[10px] text-zinc-500">{t('lmModelHint')}</p>
                    </div>

                    {/* Seed */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Dices size={14} className="text-zinc-500" />
                                <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Fixing the seed makes results repeatable. Random is recommended for variety.">{t('seed')}</span>
                            </div>
                            <button
                                onClick={() => set.setRandomSeed(!s.randomSeed)}
                                className={`w-10 h-5 rounded-full flex items-center transition-colors duration-200 px-0.5 border border-zinc-200 dark:border-white/5 ${s.randomSeed ? 'bg-pink-600' : 'bg-zinc-300 dark:bg-black/40'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-200 shadow-sm ${s.randomSeed ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Hash size={14} className="text-zinc-500" />
                            <input
                                type="number"
                                value={s.seed}
                                onChange={(e) => set.setSeed(Number(e.target.value))}
                                placeholder={t('enterFixedSeed')}
                                disabled={s.randomSeed}
                                className={`flex-1 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none ${s.randomSeed ? 'opacity-40 cursor-not-allowed' : ''}`}
                            />
                        </div>
                        <p className="text-[10px] text-zinc-500">{s.randomSeed ? t('randomSeedRecommended') : t('fixedSeedReproducible')}</p>
                    </div>

                    {/* Thinking Toggle */}
                    <div className="flex items-center justify-between py-2 border-t border-zinc-100 dark:border-white/5">
                        <span className={`text-xs font-medium ${s.loraLoaded ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-600 dark:text-zinc-400'}`} title="Lets the lyric model reason about structure and metadata. Slightly slower.">{t('thinkingCot')}</span>
                        <button
                            onClick={() => !s.loraLoaded && set.setThinking(!s.thinking)}
                            disabled={s.loraLoaded}
                            className={`w-10 h-5 rounded-full flex items-center transition-colors duration-200 px-0.5 border border-zinc-200 dark:border-white/5 ${s.thinking ? 'bg-pink-600' : 'bg-zinc-300 dark:bg-black/40'} ${s.loraLoaded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className={`w-4 h-4 rounded-full bg-white transform transition-transform duration-200 shadow-sm ${s.thinking ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    <EditableSlider
                        label={t('shift')}
                        value={s.shift}
                        min={1}
                        max={5}
                        step={0.1}
                        onChange={set.setShift}
                        formatDisplay={(val) => val.toFixed(1)}
                        helpText={t('timestepShiftForBase')}
                        title="Adjusts the diffusion schedule. Only affects base model."
                    />

                    {/* Divider */}
                    <div className="border-t border-zinc-200 dark:border-white/10 pt-4">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-bold mb-3">{t('expertControls')}</p>
                    </div>

                    {s.uploadError && (
                        <div className="text-[11px] text-rose-500">{s.uploadError}</div>
                    )}

                    {/* LM Parameters collapsible */}
                    <button
                        onClick={() => set.setShowLmParams(!s.showLmParams)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white/60 dark:bg-black/20 rounded-xl border border-zinc-200/70 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Music2 size={16} className="text-zinc-500" />
                            <div className="flex flex-col items-start">
                                <span title="Controls the 5Hz lyric/caption model sampling behavior.">{t('lmParameters')}</span>
                                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-normal">{t('controlLyricGeneration')}</span>
                            </div>
                        </div>
                        <ChevronDown size={16} className={`text-zinc-500 transition-transform ${s.showLmParams ? 'rotate-180' : ''}`} />
                    </button>

                    {s.showLmParams && (
                        <div className="bg-white dark:bg-suno-card rounded-xl border border-zinc-200 dark:border-white/5 p-4 space-y-4">
                            <EditableSlider
                                label={t('lmTemperature')}
                                value={s.lmTemperature}
                                min={0}
                                max={2}
                                step={0.1}
                                onChange={set.setLmTemperature}
                                formatDisplay={(val) => val.toFixed(2)}
                                helpText={t('higherMoreRandom')}
                                title="Higher temperature = more random word choices."
                            />
                            <EditableSlider
                                label={t('lmCfgScale')}
                                value={s.lmCfgScale}
                                min={1}
                                max={3}
                                step={0.1}
                                onChange={set.setLmCfgScale}
                                formatDisplay={(val) => val.toFixed(1)}
                                helpText={t('noCfgScale')}
                                title="How strongly the lyric model follows the prompt."
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <EditableSlider
                                    label={t('topK')}
                                    value={s.lmTopK}
                                    min={0}
                                    max={100}
                                    step={1}
                                    onChange={set.setLmTopK}
                                    title="Restricts choices to the K most likely tokens. 0 disables."
                                />
                                <EditableSlider
                                    label={t('topP')}
                                    value={s.lmTopP}
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    onChange={set.setLmTopP}
                                    formatDisplay={(val) => val.toFixed(2)}
                                    title="Samples from the smallest set whose total probability is P."
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Words or ideas to steer the lyric model away from.">{t('lmNegativePrompt')}</label>
                                <textarea
                                    value={s.lmNegativePrompt}
                                    onChange={(e) => set.setLmNegativePrompt(e.target.value)}
                                    placeholder={t('thingsToAvoid')}
                                    className="w-full h-16 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg p-2 text-xs text-zinc-900 dark:text-white focus:outline-none resize-none"
                                />
                                <p className="text-[10px] text-zinc-500">{t('useWhenCfgScaleGreater')}</p>
                            </div>
                        </div>
                    )}

                    {/* Transform / source-audio controls */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide" title="Controls how much the output follows the input audio.">{t('transform')}</h4>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t('controlSourceAudio')}</p>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Advanced: precomputed audio codes for conditioning.">{t('audioCodes')}</label>
                        <textarea
                            value={s.audioCodes}
                            onChange={(e) => set.setAudioCodes(e.target.value)}
                            placeholder={t('optionalAudioCodes')}
                            className="w-full h-16 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg p-2 text-xs text-zinc-900 dark:text-white focus:outline-none resize-none"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    console.log('Convert to Codes: requires source audio upload. Use Gradio UI for this feature.');
                                }}
                                disabled={!s.sourceAudioUrl}
                                title="Convert source audio to LM codes (requires source audio)"
                                className="px-2 py-1 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Convert to Codes
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    console.log('Transcribe: requires audio codes. Use Gradio UI for this feature.');
                                }}
                                disabled={!s.audioCodes.trim()}
                                title="Transcribe audio codes to metadata (requires audio codes)"
                                className="px-2 py-1 rounded text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                Transcribe
                            </button>
                        </div>
                    </div>

                    {/* Task type + cover strength */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Choose text-to-music or audio-based modes.">{t('taskType')}</label>
                            <select
                                value={s.taskType}
                                onChange={(e) => set.setTaskType(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 transition-colors cursor-pointer [&>option]:bg-white [&>option]:dark:bg-zinc-800 [&>option]:text-zinc-900 [&>option]:dark:text-white"
                            >
                                <option value="text2music">{t('textToMusic')}</option>
                                <option value="audio2audio">{t('audio2audio')}</option>
                                <option value="cover">{t('coverTask')}</option>
                                <option value="repaint">{t('repaintTask')}</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="How strongly the source audio shapes the result.">{t('audioCoverStrength')}</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={s.audioCoverStrength}
                                onChange={(e) => set.setAudioCoverStrength(Number(e.target.value))}
                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Repaint controls */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Start time for the region to repaint (seconds).">{t('repaintingStart')}</label>
                            <input
                                type="number"
                                step="0.1"
                                value={s.repaintingStart}
                                onChange={(e) => set.setRepaintingStart(Number(e.target.value))}
                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="End time for the region to repaint (seconds).">{t('repaintingEnd')}</label>
                            <input
                                type="number"
                                step="0.1"
                                value={s.repaintingEnd}
                                onChange={(e) => set.setRepaintingEnd(Number(e.target.value))}
                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Additional directives to guide generation.">{t('instruction')}</label>
                        <textarea
                            value={s.instruction}
                            onChange={(e) => set.setInstruction(e.target.value)}
                            className="w-full h-16 bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg p-2 text-xs text-zinc-900 dark:text-white focus:outline-none resize-none"
                        />
                    </div>

                    {/* CFG scheduling */}
                    <div className="space-y-1">
                        <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">{t('guidance')}</h4>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{t('advancedCfgScheduling')}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Fraction of the diffusion process to start applying guidance.">{t('cfgIntervalStart')}</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={s.cfgIntervalStart}
                                onChange={(e) => set.setCfgIntervalStart(Number(e.target.value))}
                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Fraction of the diffusion process to stop applying guidance.">{t('cfgIntervalEnd')}</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                max="1"
                                value={s.cfgIntervalEnd}
                                onChange={(e) => set.setCfgIntervalEnd(Number(e.target.value))}
                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Override the default timestep schedule (advanced).">{t('customTimesteps')}</label>
                        <input
                            type="text"
                            value={s.customTimesteps}
                            onChange={(e) => set.setCustomTimesteps(e.target.value)}
                            placeholder={t('timestepsPlaceholder')}
                            className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                        />
                    </div>

                    {/* Score scale + LM batch chunk */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Scales score-based guidance (advanced).">{t('scoreScale')}</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max="1"
                                value={s.scoreScale}
                                onChange={(e) => set.setScoreScale(Number(e.target.value))}
                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Bigger chunks can be faster but use more memory.">{t('lmBatchChunkSize')}</label>
                            <input
                                type="number"
                                min="1"
                                max="32"
                                step="1"
                                value={s.lmBatchChunkSize}
                                onChange={(e) => set.setLmBatchChunkSize(Number(e.target.value))}
                                className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Stem controls */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('trackName')}</label>
                        <select
                            value={s.trackName}
                            onChange={(e) => set.setTrackName(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-xs text-zinc-900 dark:text-white focus:outline-none cursor-pointer [&>option]:bg-white [&>option]:dark:bg-zinc-800"
                        >
                            <option value="">None</option>
                            {TRACK_NAMES.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('completeTrackClasses')}</label>
                        <div className="flex flex-wrap gap-2">
                            {TRACK_NAMES.map(name => {
                                const selected = s.completeTrackClasses.split(',').map(x => x.trim()).filter(Boolean);
                                const isChecked = selected.includes(name);
                                return (
                                    <label key={name} className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {
                                                const next = isChecked
                                                    ? selected.filter(x => x !== name)
                                                    : [...selected, name];
                                                set.setCompleteTrackClasses(next.join(','));
                                            }}
                                            className="accent-pink-600"
                                        />
                                        {name}
                                    </label>
                                );
                            })}
                        </div>
                    </div>

                    {/* CoT / output flag checkboxes */}
                    <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Adaptive Dual Guidance: dynamically adjusts CFG for quality. Base model only; slower.">
                            <input type="checkbox" checked={s.useAdg} onChange={() => set.setUseAdg(!s.useAdg)} />
                            {t('useAdg')}
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Allow the LM to run in larger batches for speed (more VRAM).">
                            <input type="checkbox" checked={s.allowLmBatch} onChange={() => set.setAllowLmBatch(!s.allowLmBatch)} />
                            {t('allowLmBatch')}
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Let the LM reason about metadata like BPM, key, duration.">
                            <input type="checkbox" checked={s.useCotMetas} onChange={() => set.setUseCotMetas(!s.useCotMetas)} />
                            {t('useCotMetas')}
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Let the LM reason about the caption/style text.">
                            <input type="checkbox" checked={s.useCotCaption} onChange={() => set.setUseCotCaption(!s.useCotCaption)} />
                            {t('useCotCaption')}
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Let the LM reason about language selection.">
                            <input type="checkbox" checked={s.useCotLanguage} onChange={() => set.setUseCotLanguage(!s.useCotLanguage)} />
                            {t('useCotLanguage')}
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Auto-generate missing fields when possible.">
                            <input type="checkbox" checked={s.autogen} onChange={() => set.setAutogen(!s.autogen)} />
                            {t('autogen')}
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Include debug info for constrained decoding.">
                            <input type="checkbox" checked={s.constrainedDecodingDebug} onChange={() => set.setConstrainedDecodingDebug(!s.constrainedDecodingDebug)} />
                            {t('constrainedDecodingDebug')}
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Use the formatted caption produced by the AI formatter.">
                            <input type="checkbox" checked={s.isFormatCaption} onChange={() => set.setIsFormatCaption(!s.isFormatCaption)} />
                            {t('formatCaption')}
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Return scorer outputs for diagnostics.">
                            <input type="checkbox" checked={s.getScores} onChange={() => set.setGetScores(!s.getScores)} />
                            {t('getScores')}
                        </label>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400" title="Return synced lyric (LRC) output when available.">
                            <input type="checkbox" checked={s.getLrc} onChange={() => set.setGetLrc(!s.getLrc)} />
                            {t('getLrcLyrics')}
                        </label>
                    </div>
                </div>
            )}
        </>
    );
};
