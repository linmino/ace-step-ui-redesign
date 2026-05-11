/**
 * Curated example presets bundled with the frontend.
 *
 * Each preset wraps an official ACE-Step 1.5 sample JSON (from
 * https://github.com/ace-step/ACE-Step/tree/main/examples) plus a friendly
 * label so users can preview before applying. Vite eagerly imports the JSON
 * at build time so no network request is needed.
 */
import type { CreateMode } from '../../config/createModeConfig';

// Vite glob: pulls every *.json in this folder at build time.
const rawJsons = import.meta.glob('./*.json', { eager: true, import: 'default' }) as Record<
    string,
    Record<string, unknown>
>;

export interface ExamplePreset {
    id: string;
    label: string;
    mode: CreateMode;
    /** Short metadata shown in the menu item subtitle (e.g. language, BPM, vibe). */
    blurb: string;
    data: Record<string, unknown>;
}

const META: Record<string, Pick<ExamplePreset, 'label' | 'mode' | 'blurb'>> = {
    'simple-bengali-love': {
        label: 'Simple · Bengali Love Song',
        mode: 'simple',
        blurb: 'Soft Bengali ballad · vocals · auto BPM/key',
    },
    'simple-cinematic-instrumental': {
        label: 'Simple · Cinematic Trailer',
        mode: 'simple',
        blurb: 'Epic orchestral · instrumental · trailer vibe',
    },
    'simple-lofi-study': {
        label: 'Simple · Lo-fi Study Beats',
        mode: 'simple',
        blurb: 'Lo-fi hip-hop · instrumental · for focus',
    },
    'simple-meditation-piano': {
        label: 'Simple · Meditation Piano',
        mode: 'simple',
        blurb: 'Peaceful piano · instrumental · meditative',
    },
    'custom-poprock-anime-zh': {
        label: 'Custom · Pop-Rock Anime (zh)',
        mode: 'custom',
        blurb: '中文 · 100 BPM · B minor · anime opening vibe',
    },
    'custom-latin-trap-es': {
        label: 'Custom · Latin Trap (es)',
        mode: 'custom',
        blurb: 'Spanish · 100 BPM · G♯ minor · melancholic 808s',
    },
    'custom-french-rap': {
        label: 'Custom · French Rap',
        mode: 'custom',
        blurb: 'French · 100 BPM · E minor · dark trap',
    },
    'custom-mandopop-ballad': {
        label: 'Custom · Mandopop Ballad',
        mode: 'custom',
        blurb: '中文 · 100 BPM · G♯ minor · synth-pop ballad',
    },
    'custom-jrock-anime': {
        label: 'Custom · J-Rock Anime',
        mode: 'custom',
        blurb: '日本語 · 100 BPM · E♭ minor · anthemic J-rock',
    },
    'custom-trap-melodic': {
        label: 'Custom · Melodic Trap',
        mode: 'custom',
        blurb: '中文/EN · 200 BPM · E major · introspective trap',
    },
    'custom-chinese-hiphop': {
        label: 'Custom · Chinese Hip-Hop',
        mode: 'custom',
        blurb: '中文 · 130 BPM · F minor · confident hip-hop',
    },
    'custom-japanese-lullaby': {
        label: 'Custom · Japanese Lullaby',
        mode: 'custom',
        blurb: '日本語 · 65 BPM · F major · gentle lullaby',
    },
};

export const EXAMPLE_PRESETS: ExamplePreset[] = Object.entries(rawJsons)
    .map(([path, data]) => {
        const id = path.replace(/^\.\//, '').replace(/\.json$/, '');
        const meta = META[id];
        if (!meta) return null;
        return { id, ...meta, data } satisfies ExamplePreset;
    })
    .filter((x): x is ExamplePreset => x !== null)
    .sort((a, b) => {
        // Simple modes first, then alphabetically by label
        if (a.mode === 'simple' && b.mode !== 'simple') return -1;
        if (b.mode === 'simple' && a.mode !== 'simple') return 1;
        return a.label.localeCompare(b.label);
    });
