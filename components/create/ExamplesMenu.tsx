import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, ChevronDown, Music, Settings2, Loader2, Search, AlertCircle } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { examplesApi, ExampleSummary } from '../../services/api';
import type { CreateMode } from '../../config/createModeConfig';

export interface PickedExample {
    summary: ExampleSummary;
    mode: CreateMode;
    data: Record<string, unknown>;
}

interface ExamplesMenuProps {
    onPick: (picked: PickedExample) => void;
}

type ListState =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'ready'; examples: ExampleSummary[] }
    | { kind: 'error'; message: string };

export const ExamplesMenu: React.FC<ExamplesMenuProps> = ({ onPick }) => {
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const [list, setList] = useState<ListState>({ kind: 'idle' });
    const [query, setQuery] = useState('');
    const [pickingId, setPickingId] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    // Fetch on first open; cache for the session.
    useEffect(() => {
        if (!open || list.kind !== 'idle') return;
        let cancelled = false;
        setList({ kind: 'loading' });
        examplesApi
            .list()
            .then(({ examples }) => {
                if (!cancelled) setList({ kind: 'ready', examples });
            })
            .catch((err: Error) => {
                if (!cancelled) setList({ kind: 'error', message: err.message });
            });
        return () => {
            cancelled = true;
        };
    }, [open, list.kind]);

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
        // Auto-focus the search box once the list is ready.
        const timer = window.setTimeout(() => searchRef.current?.focus(), 50);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
            window.clearTimeout(timer);
        };
    }, [open]);

    const filtered = useMemo(() => {
        if (list.kind !== 'ready') return [];
        const q = query.trim().toLowerCase();
        if (!q) return list.examples;
        return list.examples.filter((ex) => {
            const hay = [
                ex.id,
                ex.label,
                ex.blurb,
                ex.language,
                ex.bpm?.toString(),
                ex.duration?.toString(),
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return hay.includes(q);
        });
    }, [list, query]);

    const grouped = useMemo(() => {
        const groups: Record<string, ExampleSummary[]> = { simple_mode: [], text2music: [] };
        for (const ex of filtered) {
            (groups[ex.category] ??= []).push(ex);
        }
        return groups;
    }, [filtered]);

    const handlePick = async (summary: ExampleSummary) => {
        setPickingId(summary.id);
        try {
            const { data } = await examplesApi.load(summary.category, summary.id);
            onPick({ summary, mode: summary.mode, data });
            setOpen(false);
            setQuery('');
        } catch (err) {
            console.error('Failed to load example', err);
        } finally {
            setPickingId(null);
        }
    };

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
                {list.kind === 'ready' && (
                    <span className="text-[10px] font-mono text-zinc-400">{list.examples.length}</span>
                )}
                <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute left-0 top-full mt-1 z-30 w-[360px] max-w-[calc(100vw-2rem)] max-h-[480px] flex flex-col rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-suno-card shadow-2xl overflow-hidden"
                >
                    <div className="p-2 border-b border-zinc-200 dark:border-white/5 flex items-center gap-2">
                        <Search size={14} className="text-zinc-400 flex-shrink-0" />
                        <input
                            ref={searchRef}
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('examplesSearchPlaceholder')}
                            className="flex-1 bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                        />
                        {list.kind === 'ready' && (
                            <span className="text-[10px] font-mono text-zinc-400">
                                {filtered.length}/{list.examples.length}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {list.kind === 'loading' && (
                            <div className="p-6 flex items-center justify-center text-xs text-zinc-500">
                                <Loader2 size={14} className="mr-2 animate-spin" />
                                {t('loading')}
                            </div>
                        )}
                        {list.kind === 'error' && (
                            <div className="p-4 flex items-start gap-2 text-xs text-rose-600 dark:text-rose-400">
                                <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                <div>
                                    <div className="font-semibold">{t('examplesLoadFailed')}</div>
                                    <div className="text-zinc-500 dark:text-zinc-400 mt-1 break-all">{list.message}</div>
                                </div>
                            </div>
                        )}
                        {list.kind === 'ready' && filtered.length === 0 && (
                            <div className="p-6 text-center text-xs text-zinc-500">
                                {t('examplesNoMatch')}
                            </div>
                        )}
                        {list.kind === 'ready' &&
                            (['simple_mode', 'text2music'] as const).map((cat) => {
                                const items = grouped[cat];
                                if (!items || items.length === 0) return null;
                                const Icon = cat === 'simple_mode' ? Music : Settings2;
                                return (
                                    <div key={cat}>
                                        <div className="sticky top-0 z-10 px-3 py-1.5 bg-zinc-50/95 dark:bg-suno-card/95 backdrop-blur text-[10px] uppercase tracking-wider font-bold text-zinc-500 border-b border-zinc-100 dark:border-white/5 flex items-center gap-1.5">
                                            <Icon size={11} />
                                            <span>{cat === 'simple_mode' ? t('modeSimpleLabel') : t('modeCustomLabel')}</span>
                                            <span className="ml-auto font-mono text-zinc-400">{items.length}</span>
                                        </div>
                                        {items.map((ex) => {
                                            const busy = pickingId === ex.id;
                                            return (
                                                <button
                                                    key={ex.id}
                                                    type="button"
                                                    role="menuitem"
                                                    onClick={() => handlePick(ex)}
                                                    disabled={busy || pickingId !== null}
                                                    className="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors flex items-start gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    <div className="mt-0.5 flex-shrink-0 w-3.5">
                                                        {busy ? (
                                                            <Loader2 size={12} className="animate-spin text-pink-500" />
                                                        ) : (
                                                            <Icon size={13} className="text-zinc-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-xs font-mono text-zinc-700 dark:text-zinc-200 truncate">
                                                            {ex.id}
                                                            {ex.language && (
                                                                <span className="ml-1.5 px-1 py-0.5 rounded text-[9px] font-sans font-semibold bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 align-middle">
                                                                    {ex.language}
                                                                </span>
                                                            )}
                                                            {ex.bpm !== undefined && (
                                                                <span className="ml-1 px-1 py-0.5 rounded text-[9px] font-sans bg-zinc-200 dark:bg-white/10 text-zinc-600 dark:text-zinc-300 align-middle">
                                                                    {ex.bpm}bpm
                                                                </span>
                                                            )}
                                                            {ex.instrumental && (
                                                                <span className="ml-1 px-1 py-0.5 rounded text-[9px] font-sans bg-amber-200/60 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 align-middle">
                                                                    inst
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                                                            {ex.blurb || '—'}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
};
