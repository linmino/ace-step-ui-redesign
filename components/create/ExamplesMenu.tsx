import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, ChevronDown, Music, Settings2 } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { EXAMPLE_PRESETS, ExamplePreset } from '../../data/examples';

interface ExamplesMenuProps {
    onPick: (preset: ExamplePreset) => void;
}

export const ExamplesMenu: React.FC<ExamplesMenuProps> = ({ onPick }) => {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-200 bg-white dark:bg-suno-card border border-zinc-200 dark:border-white/10 hover:border-pink-400 dark:hover:border-pink-500 transition-colors"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <Sparkles size={13} className="text-pink-500" />
                <span>{t('examples')}</span>
                <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute left-0 top-full mt-1 z-30 w-80 max-h-[420px] overflow-y-auto rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-suno-card shadow-2xl py-1"
                >
                    <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-zinc-400">
                        {t('examplesHeader')}
                    </div>
                    {EXAMPLE_PRESETS.map((preset) => {
                        const Icon = preset.mode === 'simple' ? Music : Settings2;
                        return (
                            <button
                                key={preset.id}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    onPick(preset);
                                    setOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors flex items-start gap-2"
                            >
                                <Icon size={14} className="mt-0.5 flex-shrink-0 text-zinc-400" />
                                <div className="min-w-0">
                                    <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                        {preset.label}
                                    </div>
                                    <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 truncate">
                                        {preset.blurb}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
