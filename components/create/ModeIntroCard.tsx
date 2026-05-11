import React from 'react';
import { useI18n } from '../../context/I18nContext';
import { CreateMode, MODE_CONFIGS } from '../../config/createModeConfig';

interface ModeIntroCardProps {
    mode: CreateMode;
}

export const ModeIntroCard: React.FC<ModeIntroCardProps> = ({ mode }) => {
    const { t } = useI18n();
    const cfg = MODE_CONFIGS[mode];
    return (
        <div className="px-3 py-2 rounded-lg bg-zinc-100/60 dark:bg-black/20 border border-zinc-200/60 dark:border-white/5 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-zinc-700 dark:text-zinc-200 mr-1.5">{t(cfg.labelKey)}:</span>
            {t(cfg.descKey)}
        </div>
    );
};
