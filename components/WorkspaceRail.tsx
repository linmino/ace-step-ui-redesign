import React, { useEffect, useRef } from 'react';
import { ChevronRight, ChevronLeft, Disc3, Music } from 'lucide-react';
import { Song } from '../types';
import { useI18n } from '../context/I18nContext';
import { Tooltip } from './ui/Tooltip';
import { RightSidebar } from './RightSidebar';

interface WorkspaceRailProps {
    expanded: boolean;
    onToggle: (next: boolean) => void;
    selectedSong: Song | null;
    /** Forwarded to RightSidebar — same shape as the original component. */
    rightSidebarProps: Omit<React.ComponentProps<typeof RightSidebar>, 'onClose'>;
}

const RAIL_WIDTH = 32;
const DRAWER_WIDTH = 400;

export const WorkspaceRail: React.FC<WorkspaceRailProps> = ({
    expanded,
    onToggle,
    selectedSong,
    rightSidebarProps,
}) => {
    const { t } = useI18n();
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!expanded) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onToggle(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [expanded, onToggle]);

    const toggleLabel = expanded ? t('collapseWorkspace') : t('expandWorkspace');

    return (
        <>
            <div
                style={{ width: RAIL_WIDTH }}
                className="hidden md:flex flex-shrink-0 h-full flex-col items-center py-3 gap-3 border-l border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-suno-panel relative z-10"
            >
                <Tooltip content={toggleLabel} placement="left">
                    <button
                        type="button"
                        onClick={() => onToggle(!expanded)}
                        aria-label={toggleLabel}
                        aria-expanded={expanded}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
                    >
                        {expanded ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                </Tooltip>

                <Tooltip content={selectedSong?.title || t('noSongSelected')} placement="left">
                    <button
                        type="button"
                        onClick={() => onToggle(true)}
                        aria-label={t('openWorkspace')}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors"
                    >
                        {selectedSong ? <Disc3 size={16} /> : <Music size={16} />}
                    </button>
                </Tooltip>
            </div>

            {expanded && (
                <>
                    <div
                        onClick={() => onToggle(false)}
                        aria-hidden
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-0"
                    />
                    <div
                        ref={drawerRef}
                        role="complementary"
                        aria-label={t('workspace')}
                        style={{ width: DRAWER_WIDTH, right: RAIL_WIDTH }}
                        className="fixed top-0 bottom-0 z-50 max-w-[90vw] bg-zinc-50 dark:bg-suno-panel border-l border-zinc-200 dark:border-white/5 shadow-2xl transition-transform duration-200 ease-out"
                    >
                        <RightSidebar
                            {...rightSidebarProps}
                            song={selectedSong}
                            onClose={() => onToggle(false)}
                        />
                    </div>
                </>
            )}
        </>
    );
};
