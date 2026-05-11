import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

interface TooltipProps {
    content: React.ReactNode;
    placement?: TooltipPlacement;
    delay?: number;
    children: React.ReactElement;
    maxWidth?: number;
}

interface Coords {
    top: number;
    left: number;
    placement: TooltipPlacement;
}

const ARROW_SIZE = 6;
const GAP = 8;

function clampToViewport(top: number, left: number, w: number, h: number): { top: number; left: number } {
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
        left: Math.max(margin, Math.min(left, vw - w - margin)),
        top: Math.max(margin, Math.min(top, vh - h - margin)),
    };
}

function computeCoords(anchor: DOMRect, tipW: number, tipH: number, preferred: TooltipPlacement): Coords {
    const order: TooltipPlacement[] = [preferred, 'top', 'bottom', 'right', 'left'];
    for (const placement of order) {
        let top = 0;
        let left = 0;
        switch (placement) {
            case 'top':
                top = anchor.top - tipH - GAP;
                left = anchor.left + anchor.width / 2 - tipW / 2;
                break;
            case 'bottom':
                top = anchor.bottom + GAP;
                left = anchor.left + anchor.width / 2 - tipW / 2;
                break;
            case 'right':
                top = anchor.top + anchor.height / 2 - tipH / 2;
                left = anchor.right + GAP;
                break;
            case 'left':
                top = anchor.top + anchor.height / 2 - tipH / 2;
                left = anchor.left - tipW - GAP;
                break;
        }
        const fits =
            top >= 0 && left >= 0 && top + tipH <= window.innerHeight && left + tipW <= window.innerWidth;
        if (fits) {
            const c = clampToViewport(top, left, tipW, tipH);
            return { top: c.top, left: c.left, placement };
        }
    }
    const top = anchor.bottom + GAP;
    const left = anchor.left + anchor.width / 2 - tipW / 2;
    const c = clampToViewport(top, left, tipW, tipH);
    return { top: c.top, left: c.left, placement: 'bottom' };
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    placement: placementProp,
    delay = 150,
    children,
    maxWidth = 280,
}) => {
    const placement: TooltipPlacement = placementProp ?? 'top';
    const [open, setOpen] = useState(false);
    const [coords, setCoords] = useState<Coords | null>(null);
    const anchorRef = useRef<HTMLElement | null>(null);
    const tipRef = useRef<HTMLDivElement | null>(null);
    const timerRef = useRef<number | null>(null);
    const tipId = useId();

    const handleOpen = () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setOpen(true), delay);
    };
    const handleClose = () => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = null;
        setOpen(false);
    };

    useLayoutEffect(() => {
        if (!open || !anchorRef.current || !tipRef.current) return;
        const anchorRect = anchorRef.current.getBoundingClientRect();
        const tipRect = tipRef.current.getBoundingClientRect();
        setCoords(computeCoords(anchorRect, tipRect.width, tipRect.height, placement));
    }, [open, placement, content]);

    const child = React.Children.only(children);
    const triggerProps: Record<string, unknown> = {
        ref: (node: HTMLElement | null) => {
            anchorRef.current = node;
            const ref = (child as { ref?: unknown }).ref;
            if (typeof ref === 'function') (ref as (n: HTMLElement | null) => void)(node);
            else if (ref && typeof ref === 'object' && 'current' in (ref as object)) {
                (ref as { current: HTMLElement | null }).current = node;
            }
        },
        onMouseEnter: (e: React.MouseEvent) => {
            handleOpen();
            (child.props as { onMouseEnter?: (e: React.MouseEvent) => void }).onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
            handleClose();
            (child.props as { onMouseLeave?: (e: React.MouseEvent) => void }).onMouseLeave?.(e);
        },
        onFocus: (e: React.FocusEvent) => {
            handleOpen();
            (child.props as { onFocus?: (e: React.FocusEvent) => void }).onFocus?.(e);
        },
        onBlur: (e: React.FocusEvent) => {
            handleClose();
            (child.props as { onBlur?: (e: React.FocusEvent) => void }).onBlur?.(e);
        },
        'aria-describedby': open ? tipId : undefined,
    };

    const portal =
        open && typeof document !== 'undefined'
            ? createPortal(
                  <div
                      id={tipId}
                      ref={tipRef}
                      role="tooltip"
                      style={{
                          position: 'fixed',
                          top: coords?.top ?? -9999,
                          left: coords?.left ?? -9999,
                          maxWidth,
                          zIndex: 9999,
                          visibility: coords ? 'visible' : 'hidden',
                          pointerEvents: 'none',
                      }}
                      className="px-3 py-2 rounded-md text-xs leading-relaxed bg-zinc-900 text-zinc-100 shadow-lg border border-zinc-700 dark:bg-zinc-800 dark:border-zinc-600"
                  >
                      {content}
                  </div>,
                  document.body,
              )
            : null;

    return (
        <>
            {React.cloneElement(child, triggerProps)}
            {portal}
        </>
    );
};
