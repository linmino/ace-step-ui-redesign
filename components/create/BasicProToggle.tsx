import React from 'react';
import { Zap, GraduationCap } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { Tooltip } from '../ui/Tooltip';

export type CreateTier = 'basic' | 'pro';

interface BasicProToggleProps {
    tier: CreateTier;
    onChange: (next: CreateTier) => void;
}

export const BasicProToggle: React.FC<BasicProToggleProps> = ({ tier, onChange }) => {
    const { t } = useI18n();
    return (
        <div className="inline-flex items-center bg-zinc-200/70 dark:bg-black/30 rounded-lg p-0.5">
            <Tooltip content={t('basicModeTooltip')} placement="bottom">
                <button
                    type="button"
                    onClick={() => onChange('basic')}
                    aria-pressed={tier === 'basic'}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        tier === 'basic'
                            ? 'bg-white text-pink-600 shadow-sm dark:bg-suno-card dark:text-pink-400'
                            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                >
                    <Zap size={12} />
                    {t('basicMode')}
                </button>
            </Tooltip>
            <Tooltip content={t('proModeTooltip')} placement="bottom">
                <button
                    type="button"
                    onClick={() => onChange('pro')}
                    aria-pressed={tier === 'pro'}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                        tier === 'pro'
                            ? 'bg-white text-pink-600 shadow-sm dark:bg-suno-card dark:text-pink-400'
                            : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                >
                    <GraduationCap size={12} />
                    {t('proMode')}
                </button>
            </Tooltip>
        </div>
    );
};
