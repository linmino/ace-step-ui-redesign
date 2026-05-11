import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { TranslationKey } from '../../i18n/translations';
import { Tooltip, TooltipPlacement } from './Tooltip';

interface ParamLabelProps {
    /** Resolved label text (e.g. `t('bpm')`). */
    label: string;
    /** Translation key under the `hint.*` namespace. Pass plain key (e.g. 'hint.bpm'). */
    hintKey?: TranslationKey;
    /** Inline hint, used when no hintKey is provided. */
    hint?: React.ReactNode;
    required?: boolean;
    htmlFor?: string;
    placement?: TooltipPlacement;
    className?: string;
    /** Optional trailing slot rendered to the right of the label (e.g. value badge). */
    trailing?: React.ReactNode;
}

export const ParamLabel: React.FC<ParamLabelProps> = ({
    label,
    hintKey,
    hint,
    required,
    htmlFor,
    placement = 'top',
    className = '',
    trailing,
}) => {
    const { t } = useI18n();
    const hintContent = hintKey ? t(hintKey) : hint;
    const showHint = !!hintContent && hintContent !== hintKey;

    return (
        <div className={`flex items-center justify-between gap-2 ${className}`}>
            <label
                htmlFor={htmlFor}
                className="flex items-center gap-1 text-xs font-medium text-zinc-700 dark:text-zinc-300"
            >
                <span>{label}</span>
                {required && <span className="text-red-500">*</span>}
                {showHint && (
                    <Tooltip content={hintContent} placement={placement}>
                        <button
                            type="button"
                            tabIndex={-1}
                            aria-label="More info"
                            className="inline-flex items-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-help"
                        >
                            <HelpCircle size={13} />
                        </button>
                    </Tooltip>
                )}
            </label>
            {trailing}
        </div>
    );
};
