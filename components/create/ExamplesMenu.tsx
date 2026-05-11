import React, { useState } from 'react';
import { Dice5, Loader2, AlertCircle } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { examplesApi } from '../../services/api';
import type { CreateMode } from '../../config/createModeConfig';

// Random-picker variant: two buttons ("Simple" / "Custom") that ask the backend
// to pick a random example from the matching bucket. Replaces the previous
// full-list dropdown, which parsed all 400 example JSONs and rendered 400
// menu items — too heavy to be usable on slower hosts (Colab T4).
//
// The onPick contract is unchanged, so CreatePanel.tsx does not need edits.

type Bucket = 'simple_mode' | 'text2music';

export interface PickedExample {
    summary: {
        id: string;
        category: Bucket;
        mode: 'simple' | 'custom';
    };
    mode: CreateMode;
    data: Record<string, unknown>;
}

interface ExamplesMenuProps {
    onPick: (picked: PickedExample) => void;
}

export const ExamplesMenu: React.FC<ExamplesMenuProps> = ({ onPick }) => {
    const { t } = useI18n();
    const [loadingBucket, setLoadingBucket] = useState<Bucket | null>(null);
    const [lastPicked, setLastPicked] = useState<{ id: string; bucket: Bucket } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const pickRandom = async (bucket: Bucket) => {
        if (loadingBucket) return;
        setLoadingBucket(bucket);
        setError(null);
        try {
            const { category, id, data } = await examplesApi.random(bucket);
            const mode: 'simple' | 'custom' = category === 'simple_mode' ? 'simple' : 'custom';
            onPick({
                summary: { id, category, mode },
                mode,
                data,
            });
            setLastPicked({ id, bucket });
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoadingBucket(null);
        }
    };

    const renderButton = (bucket: Bucket, label: string) => {
        const busy = loadingBucket === bucket;
        const justPicked = lastPicked?.bucket === bucket;
        const tooltip = busy
            ? t('loading')
            : `${t('examples')} · ${label}`;
        return (
            <button
                key={bucket}
                type="button"
                onClick={() => pickRandom(bucket)}
                disabled={loadingBucket !== null}
                title={tooltip}
                aria-label={tooltip}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                    justPicked
                        ? 'border-pink-400 bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300'
                        : 'text-zinc-700 dark:text-zinc-200 bg-white dark:bg-suno-card border-zinc-200 dark:border-white/10 hover:border-pink-400 dark:hover:border-pink-500'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
                {busy ? (
                    <Loader2 size={13} className="animate-spin text-pink-500" />
                ) : (
                    <Dice5 size={13} className="text-pink-500" />
                )}
                <span>{label}</span>
                {justPicked && lastPicked && (
                    <span className="text-[10px] font-mono text-pink-600 dark:text-pink-400 ml-1">
                        {lastPicked.id}
                    </span>
                )}
            </button>
        );
    };

    return (
        <div className="inline-flex items-center gap-1.5 flex-wrap">
            {renderButton('simple_mode', t('modeSimpleLabel'))}
            {renderButton('text2music', t('modeCustomLabel'))}
            {error && (
                <span className="inline-flex items-center gap-1 text-[10.5px] text-rose-600 dark:text-rose-400 max-w-[260px]">
                    <AlertCircle size={11} className="flex-shrink-0" />
                    <span className="truncate" title={error}>{error}</span>
                </span>
            )}
        </div>
    );
};
