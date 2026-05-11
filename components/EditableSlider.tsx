import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { TranslationKey } from '../i18n/translations';
import { Tooltip } from './ui/Tooltip';

interface EditableSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatDisplay?: (value: number) => string;
  helpText?: string;
  title?: string;
  /** Translation key under hint.* namespace; renders a (?) icon next to the label. */
  hintKey?: TranslationKey;
  autoLabel?: string;
}

export const EditableSlider: React.FC<EditableSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatDisplay,
  helpText,
  title = '',
  hintKey,
  autoLabel = 'Auto',
}) => {
  const { t } = useI18n();
  const [inputValue, setInputValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);
  const hintText = hintKey ? t(hintKey) : null;

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
      setInputValue(clampedValue.toString());
    } else {
      setInputValue(value.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setInputValue(value.toString());
      setIsEditing(false);
    }
  };

  const displayValue = formatDisplay ? formatDisplay(value) : (value === min && autoLabel ? autoLabel : value.toString());

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1 text-xs font-medium text-zinc-600 dark:text-zinc-400" title={!hintText ? title : undefined}>
          <span>{label}</span>
          {hintText && hintText !== hintKey && (
            <Tooltip content={hintText} placement="top">
              <button
                type="button"
                tabIndex={-1}
                aria-label="More info"
                className="inline-flex items-center text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-help"
              >
                <HelpCircle size={11} />
              </button>
            </Tooltip>
          )}
        </label>
        {isEditing ? (
          <input
            type="number"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            onFocus={() => setIsEditing(true)}
            min={min}
            max={max}
            step={step}
            autoFocus
            className="text-xs font-mono text-zinc-900 dark:text-white bg-zinc-100 dark:bg-black/20 px-2 py-0.5 rounded w-20 text-right border border-pink-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className="text-xs font-mono text-zinc-900 dark:text-white bg-zinc-100 dark:bg-black/20 px-2 py-0.5 rounded cursor-pointer hover:bg-zinc-200 dark:hover:bg-black/30 transition-colors"
          >
            {displayValue}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
      />
      {helpText && (
        <p className="text-[10px] text-zinc-500">{helpText}</p>
      )}
    </div>
  );
};
