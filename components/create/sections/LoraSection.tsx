import React from 'react';
import { Sliders, ChevronDown } from 'lucide-react';
import { useI18n } from '../../../context/I18nContext';
import { EditableSlider } from '../../EditableSlider';

export interface LoraSectionProps {
    showLoraPanel: boolean;
    setShowLoraPanel: (next: boolean) => void;
    loraPath: string;
    setLoraPath: (next: string) => void;
    loraLoaded: boolean;
    loraEnabled: boolean;
    loraScale: number;
    loraError: string | null;
    isLoraLoading: boolean;
    onToggle: () => void;
    onEnabledToggle: () => void;
    onScaleChange: (next: number) => void;
}

/**
 * Extracted from CreatePanel.tsx (Phase 3.1). Visual / behaviour zero-diff.
 * Outer `{customMode && (...)}` wrapper stays in the container.
 */
export const LoraSection: React.FC<LoraSectionProps> = ({
    showLoraPanel,
    setShowLoraPanel,
    loraPath,
    setLoraPath,
    loraLoaded,
    loraEnabled,
    loraScale,
    loraError,
    isLoraLoading,
    onToggle,
    onEnabledToggle,
    onScaleChange,
}) => {
    const { t } = useI18n();

    return (
        <>
            <button
                onClick={() => setShowLoraPanel(!showLoraPanel)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-suno-card rounded-xl border border-zinc-200 dark:border-white/5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Sliders size={16} className="text-zinc-500" />
                    <span>LoRA</span>
                </div>
                <ChevronDown size={16} className={`text-zinc-500 transition-transform ${showLoraPanel ? 'rotate-180' : ''}`} />
            </button>

            {showLoraPanel && (
                <div className="bg-white dark:bg-suno-card rounded-xl border border-zinc-200 dark:border-white/5 p-4 space-y-4">
                    {/* LoRA Path Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{t('loraPath')}</label>
                        <input
                            type="text"
                            value={loraPath}
                            onChange={(e) => setLoraPath(e.target.value)}
                            placeholder={t('loraPathPlaceholder')}
                            className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-pink-500 dark:focus:border-pink-500 transition-colors"
                        />
                    </div>

                    {/* LoRA Load/Unload Toggle */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-t border-zinc-100 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                    loraLoaded ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                }`}></div>
                                <span className={`text-xs font-medium ${
                                    loraLoaded ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                }`}>
                                    {loraLoaded ? t('loraLoaded') : t('loraUnloaded')}
                                </span>
                            </div>
                            <button
                                onClick={onToggle}
                                disabled={!loraPath.trim() || isLoraLoading}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                    loraLoaded
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20 hover:from-green-600 hover:to-emerald-700'
                                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                }`}
                            >
                                {isLoraLoading ? '...' : (loraLoaded ? t('loraUnload') : t('loraLoad'))}
                            </button>
                        </div>
                        {loraError && (
                            <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                                {loraError}
                            </div>
                        )}
                    </div>

                    {/* Use LoRA Checkbox (enable/disable without unloading) */}
                    <div className={`flex items-center justify-between py-2 border-t border-zinc-100 dark:border-white/5 ${!loraLoaded ? 'opacity-40 pointer-events-none' : ''}`}>
                        <label className="flex items-center gap-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={loraEnabled}
                                onChange={onEnabledToggle}
                                disabled={!loraLoaded}
                                className="accent-pink-600"
                            />
                            Use LoRA
                        </label>
                    </div>

                    {/* LoRA Scale Slider */}
                    <div className={!loraLoaded || !loraEnabled ? 'opacity-40 pointer-events-none' : ''}>
                        <EditableSlider
                            label={t('loraScale')}
                            hintKey="hint.loraScale"
                            value={loraScale}
                            min={0}
                            max={1}
                            step={0.05}
                            onChange={onScaleChange}
                            formatDisplay={(val) => val.toFixed(2)}
                            helpText={t('loraScaleDescription')}
                        />
                    </div>
                </div>
            )}
        </>
    );
};
