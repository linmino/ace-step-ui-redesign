import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search, ChevronRight, Menu } from 'lucide-react';
import { marked } from 'marked';
import { useI18n } from '../context/I18nContext';
import { DOCS, DOC_CATEGORY_LABEL, DOC_CATEGORY_ORDER, DocCategory, DocEntry } from '../data/docs';

// Markdown renderer for the bundled Traditional-Chinese docs.
//
// Left rail: doc list grouped by category + search filter.
// Right pane: rendered HTML wrapped in `.markdown-body` for prose styling.
// Mobile: rail collapses into a toggle button to free up reading width.

marked.setOptions({ gfm: true, breaks: false });

const STORAGE_KEY = 'ace-docs-active-id';

export const DocsPage: React.FC = () => {
    const { t } = useI18n();

    const [activeId, setActiveId] = useState<string>(() => {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        return stored && DOCS.some((d) => d.id === stored) ? stored : DOCS[0]!.id;
    });
    const [query, setQuery] = useState('');
    const [showRail, setShowRail] = useState(true);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, activeId);
        } catch {
            // localStorage may be blocked; safe to ignore.
        }
    }, [activeId]);

    const filtered = useMemo<DocEntry[]>(() => {
        const q = query.trim().toLowerCase();
        if (!q) return DOCS;
        return DOCS.filter((d) =>
            [d.id, d.title, d.summary].some((s) => s.toLowerCase().includes(q)),
        );
    }, [query]);

    const grouped = useMemo<Record<DocCategory, DocEntry[]>>(() => {
        const buckets = Object.fromEntries(
            DOC_CATEGORY_ORDER.map((c) => [c, [] as DocEntry[]]),
        ) as Record<DocCategory, DocEntry[]>;
        for (const doc of filtered) buckets[doc.category].push(doc);
        return buckets;
    }, [filtered]);

    const active = DOCS.find((d) => d.id === activeId);

    // marked.parse can return a Promise when async option is on; we keep it sync.
    const html = useMemo(() => {
        if (!active) return '';
        return marked.parse(active.content, { async: false }) as string;
    }, [active]);

    return (
        <div className="flex h-full w-full overflow-hidden bg-white dark:bg-suno">
            {/* Doc rail */}
            <aside
                className={`${
                    showRail ? 'w-64 lg:w-72' : 'w-0'
                } flex-shrink-0 border-r border-zinc-200 dark:border-white/5 overflow-y-auto custom-scrollbar transition-all duration-200 bg-zinc-50 dark:bg-suno-panel`}
            >
                <div className="sticky top-0 z-10 bg-zinc-50 dark:bg-suno-panel p-3 border-b border-zinc-200 dark:border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen size={16} className="text-pink-500" />
                        <h2 className="text-sm font-bold text-zinc-900 dark:text-white">{t('docs')}</h2>
                        <span className="ml-auto text-[10px] font-mono text-zinc-400">{DOCS.length}</span>
                    </div>
                    <div className="relative">
                        <Search
                            size={12}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                        />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('docsSearchPlaceholder')}
                            className="w-full pl-7 pr-2 py-1.5 rounded-lg text-xs bg-white dark:bg-white/5 border border-transparent focus:border-pink-400 focus:outline-none text-zinc-900 dark:text-white placeholder-zinc-400"
                        />
                    </div>
                </div>

                {DOC_CATEGORY_ORDER.map((cat) => {
                    const items = grouped[cat];
                    if (!items || items.length === 0) return null;
                    return (
                        <div key={cat} className="pb-1">
                            <div className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                                {DOC_CATEGORY_LABEL[cat]}
                            </div>
                            {items.map((doc) => {
                                const isActive = activeId === doc.id;
                                return (
                                    <button
                                        key={doc.id}
                                        type="button"
                                        onClick={() => setActiveId(doc.id)}
                                        className={`w-full text-left px-3 py-2 flex items-start gap-2 transition-colors border-l-2 ${
                                            isActive
                                                ? 'bg-pink-50 dark:bg-pink-500/10 border-pink-500'
                                                : 'border-transparent hover:bg-zinc-100 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <span className="text-base flex-shrink-0 leading-tight mt-0.5">{doc.icon}</span>
                                        <div className="min-w-0 flex-1">
                                            <div
                                                className={`text-xs font-semibold truncate ${
                                                    isActive
                                                        ? 'text-pink-600 dark:text-pink-300'
                                                        : 'text-zinc-900 dark:text-white'
                                                }`}
                                            >
                                                {doc.title}
                                            </div>
                                            <div className="text-[10.5px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-0.5">
                                                {doc.summary}
                                            </div>
                                        </div>
                                        <ChevronRight
                                            size={12}
                                            className={`mt-1 flex-shrink-0 ${
                                                isActive ? 'text-pink-500' : 'text-zinc-400'
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    );
                })}

                {filtered.length === 0 && (
                    <div className="p-6 text-center text-xs text-zinc-500">{t('docsNoMatch')}</div>
                )}
            </aside>

            {/* Viewer */}
            <article className="flex-1 overflow-y-auto custom-scrollbar relative">
                {/* Rail toggle (mobile-friendly; harmless on desktop) */}
                <button
                    type="button"
                    onClick={() => setShowRail((v) => !v)}
                    className="sticky top-3 ml-3 mt-3 z-10 inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-white dark:bg-suno-card border border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:border-pink-400 dark:hover:border-pink-500"
                    title={showRail ? t('docsHideList') : t('docsShowList')}
                >
                    <Menu size={12} />
                    <span>{showRail ? t('docsHideList') : t('docsShowList')}</span>
                </button>

                {active ? (
                    <div className="max-w-4xl mx-auto px-6 pt-2 pb-16">
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-zinc-500 mb-1">
                            <span>{DOC_CATEGORY_LABEL[active.category]}</span>
                            <span>·</span>
                            <span className="font-mono normal-case tracking-normal">{active.id}</span>
                        </div>
                        <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />
                    </div>
                ) : (
                    <div className="p-6 text-center text-zinc-500">{t('docsSelect')}</div>
                )}
            </article>
        </div>
    );
};
