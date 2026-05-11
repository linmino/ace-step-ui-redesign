/**
 * Create-mode visibility configuration.
 *
 * Defines the 7 generation modes supported by ACE-Step 1.5 and which
 * parameter sections each mode should expose in the UI. The backend `task_type`
 * for each mode is derived from `MODE_CONFIGS[mode].taskType`.
 *
 * Source of truth: `acestep/ui/gradio/events/generation/mode_ui.py` and
 * `acestep/constants.py` in the ACE-Step model repo.
 */
import { TranslationKey } from '../i18n/translations';
import { GenerationParams } from '../types';

export type CreateMode =
    | 'simple'
    | 'custom'
    | 'remix'
    | 'repaint'
    | 'extract'
    | 'lego'
    | 'complete';

export type BackendTaskType =
    | 'text2music'
    | 'cover'
    | 'repaint'
    | 'extract'
    | 'lego'
    | 'complete';

export type FieldMode = 'auto' | 'editable' | 'hidden' | 'required' | 'optional';

export interface ModeInputs {
    description?: FieldMode;
    caption?: FieldMode;
    lyrics?: FieldMode;
    style?: FieldMode;
    title?: FieldMode;
    sourceAudio?: FieldMode;
    referenceAudio?: FieldMode;
    audioCodes?: FieldMode;
}

export interface ModeVisibility {
    /** bpm / key / time signature / duration */
    musicParams: boolean;
    /** language / gender / instrumental */
    vocalControls: boolean;
    /** repaint start / end sliders */
    repaintControls: boolean;
    /** track name dropdown (single stem) */
    stemTrackName: boolean;
    /** completeTrackClasses multi-checkbox */
    stemTrackClasses: boolean;
    /** audioCoverStrength slider */
    coverStrength: boolean;
    /** thinking / enhance / cot* — some modes force false */
    lmThinking: boolean;
    lmCotControls: boolean;
}

export interface ModeConfig {
    id: CreateMode;
    labelKey: TranslationKey;
    descKey: TranslationKey;
    icon: 'music' | 'settings' | 'refresh' | 'scissors' | 'layers' | 'blocks' | 'check';
    taskType: BackendTaskType;
    inputs: ModeInputs;
    visibility: ModeVisibility;
    /** Values applied when the user switches into this mode. */
    defaults: Partial<GenerationParams>;
    /** Forced-overrides applied right before submission. */
    overrides?: Partial<GenerationParams>;
}

const baseVisibility: ModeVisibility = {
    musicParams: true,
    vocalControls: true,
    repaintControls: false,
    stemTrackName: false,
    stemTrackClasses: false,
    coverStrength: false,
    lmThinking: true,
    lmCotControls: true,
};

export const MODE_CONFIGS: Record<CreateMode, ModeConfig> = {
    simple: {
        id: 'simple',
        labelKey: 'modeSimpleLabel',
        descKey: 'modeSimpleDesc',
        icon: 'music',
        taskType: 'text2music',
        inputs: {
            description: 'editable',
            caption: 'auto',
            lyrics: 'auto',
            style: 'hidden',
            title: 'hidden',
            sourceAudio: 'hidden',
            referenceAudio: 'hidden',
            audioCodes: 'hidden',
        },
        visibility: { ...baseVisibility, musicParams: false },
        defaults: { customMode: false, instrumental: false },
    },
    custom: {
        id: 'custom',
        labelKey: 'modeCustomLabel',
        descKey: 'modeCustomDesc',
        icon: 'settings',
        taskType: 'text2music',
        inputs: {
            description: 'hidden',
            caption: 'editable',
            lyrics: 'editable',
            style: 'editable',
            title: 'editable',
            sourceAudio: 'hidden',
            referenceAudio: 'optional',
            audioCodes: 'optional',
        },
        visibility: { ...baseVisibility },
        defaults: { customMode: true },
    },
    remix: {
        id: 'remix',
        labelKey: 'modeRemixLabel',
        descKey: 'modeRemixDesc',
        icon: 'refresh',
        taskType: 'cover',
        inputs: {
            description: 'hidden',
            caption: 'editable',
            lyrics: 'editable',
            style: 'editable',
            title: 'editable',
            sourceAudio: 'required',
            referenceAudio: 'hidden',
            audioCodes: 'hidden',
        },
        visibility: {
            ...baseVisibility,
            musicParams: false,
            vocalControls: false,
            coverStrength: true,
            lmThinking: false,
        },
        defaults: { customMode: true, audioCoverStrength: 1.0 },
        overrides: { thinking: false },
    },
    repaint: {
        id: 'repaint',
        labelKey: 'modeRepaintLabel',
        descKey: 'modeRepaintDesc',
        icon: 'scissors',
        taskType: 'repaint',
        inputs: {
            description: 'hidden',
            caption: 'editable',
            lyrics: 'hidden',
            style: 'editable',
            title: 'hidden',
            sourceAudio: 'required',
            referenceAudio: 'hidden',
            audioCodes: 'hidden',
        },
        visibility: {
            ...baseVisibility,
            musicParams: false,
            vocalControls: false,
            repaintControls: true,
            lmThinking: false,
        },
        defaults: { customMode: true, repaintingStart: 0, repaintingEnd: 30 },
        overrides: { thinking: false },
    },
    extract: {
        id: 'extract',
        labelKey: 'modeExtractLabel',
        descKey: 'modeExtractDesc',
        icon: 'scissors',
        taskType: 'extract',
        inputs: {
            description: 'hidden',
            caption: 'auto',
            lyrics: 'hidden',
            style: 'hidden',
            title: 'hidden',
            sourceAudio: 'required',
            referenceAudio: 'hidden',
            audioCodes: 'hidden',
        },
        visibility: {
            ...baseVisibility,
            musicParams: false,
            vocalControls: false,
            stemTrackName: true,
            lmThinking: false,
        },
        defaults: { customMode: true, trackName: 'vocals' },
        overrides: { thinking: false },
    },
    lego: {
        id: 'lego',
        labelKey: 'modeLegoLabel',
        descKey: 'modeLegoDesc',
        icon: 'layers',
        taskType: 'lego',
        inputs: {
            description: 'hidden',
            caption: 'editable',
            lyrics: 'hidden',
            style: 'editable',
            title: 'hidden',
            sourceAudio: 'required',
            referenceAudio: 'hidden',
            audioCodes: 'hidden',
        },
        visibility: {
            ...baseVisibility,
            musicParams: true,
            vocalControls: false,
            repaintControls: true,
            stemTrackName: true,
            lmThinking: false,
        },
        defaults: {
            customMode: true,
            trackName: 'vocals',
            repaintingStart: 0,
            repaintingEnd: 30,
        },
        overrides: { thinking: false },
    },
    complete: {
        id: 'complete',
        labelKey: 'modeCompleteLabel',
        descKey: 'modeCompleteDesc',
        icon: 'check',
        taskType: 'complete',
        inputs: {
            description: 'hidden',
            caption: 'editable',
            lyrics: 'hidden',
            style: 'editable',
            title: 'hidden',
            sourceAudio: 'required',
            referenceAudio: 'hidden',
            audioCodes: 'hidden',
        },
        visibility: {
            ...baseVisibility,
            vocalControls: false,
            stemTrackClasses: true,
        },
        defaults: { customMode: true, completeTrackClasses: [] },
    },
};

export const MODE_ORDER: CreateMode[] = [
    'simple',
    'custom',
    'remix',
    'repaint',
    'extract',
    'lego',
    'complete',
];

export const DEFAULT_MODE: CreateMode = 'custom';

/** Modes that require a source audio upload before generate can fire. */
export function requiresSourceAudio(mode: CreateMode): boolean {
    return MODE_CONFIGS[mode].inputs.sourceAudio === 'required';
}

/** Convert mode → backend task_type for API submission. */
export function toTaskType(mode: CreateMode): BackendTaskType {
    return MODE_CONFIGS[mode].taskType;
}
