import React from 'react';
import { Music, Settings2, RefreshCw, Scissors, Layers, Blocks, CheckSquare, LucideIcon } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { CreateMode, MODE_CONFIGS, MODE_ORDER } from '../../config/createModeConfig';

const ICON_MAP: Record<NonNullable<typeof MODE_CONFIGS[CreateMode]['icon']>, LucideIcon> = {
    music: Music,
    settings: Settings2,
    refresh: RefreshCw,
    scissors: Scissors,
    layers: Layers,
    blocks: Blocks,
    check: CheckSquare,
};

interface ModeTabsProps {
    current: CreateMode;
    onChange: (next: CreateMode) => void;
    disabled?: boolean;
}

export const ModeTabs: React.FC<ModeTabsProps> = ({ current, onChange, disabled }) => {
    const { t } = useI18n();

    return (
        <div className="bg-zinc-100/70 dark:bg-black/30 rounded-xl p-1 flex items-center gap-1 overflow-x-auto custom-scrollbar">
            {MODE_ORDER.map((mode) => {
                const cfg = MODE_CONFIGS[mode];
                const Icon = ICON_MAP[cfg.icon];
                const active = current === mode;
                return (
                    <button
                        key={mode}
                        type="button"
                        onClick={() => onChange(mode)}
                        disabled={disabled}
                        aria-pressed={active}
                        title={t(cfg.descKey)}
                        className={`
                            flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all
                            ${active
                                ? 'bg-white text-pink-600 shadow-sm dark:bg-suno-card dark:text-pink-400'
                                : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/60 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5'
                            }
                            ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        <Icon size={13} />
                        <span>{t(cfg.labelKey)}</span>
                    </button>
                );
            })}
        </div>
    );
};
