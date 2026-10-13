import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipState {
  text: string;
  targetRect: DOMRect;
  placement: 'top' | 'bottom';
  x: number;
  y: number;
  arrowX: number;
}

export default function SmartTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);
  const currentElementRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Helper to find tooltip candidate
    const findCandidate = (target: HTMLElement | null): { text: string; element: HTMLElement } | null => {
      if (!target || target === document.body || target === document.documentElement) return null;

      let el: HTMLElement | null = target;
      
      // 1. Explicit data-tooltip on element or immediate parents
      for (let i = 0; i < 4 && el && el !== document.body; i++) {
        const dt = el.getAttribute('data-tooltip');
        if (dt && dt.trim()) {
          return { text: dt.trim(), element: el };
        }
        el = el.parentElement;
      }

      // 2. Check for truncated / overflowing text
      const isTruncated = (elem: HTMLElement): string | null => {
        const tag = elem.tagName.toLowerCase();
        // Skip form inputs from auto-truncation tooltip
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return null;

        const isOverflowingX = elem.scrollWidth > elem.clientWidth + 1;
        const isOverflowingY = elem.scrollHeight > elem.clientHeight + 1;

        if (!isOverflowingX && !isOverflowingY) return null;

        const style = window.getComputedStyle(elem);
        const hasEllipsis =
          style.textOverflow === 'ellipsis' ||
          elem.classList.contains('truncate') ||
          style.overflow === 'hidden' ||
          style.overflowX === 'hidden' ||
          elem.className?.includes?.('line-clamp') ||
          style.webkitLineClamp !== 'none';

        if (hasEllipsis || isOverflowingX) {
          const raw = elem.innerText || elem.textContent || '';
          const trimmed = raw.trim();
          if (trimmed.length > 0 && !elem.querySelector('svg:only-child')) {
            return trimmed;
          }
        }
        return null;
      };

      // Check target directly
      const selfTruncated = isTruncated(target);
      if (selfTruncated) return { text: selfTruncated, element: target };

      // Check if target has a direct truncated child (e.g. user hovered td or cell wrapper)
      const child = target.querySelector<HTMLElement>('.truncate, [class*="line-clamp"]');
      if (child) {
        const childTruncated = isTruncated(child);
        if (childTruncated) return { text: childTruncated, element: child };
      }

      // Check parent elements (up to 3 levels)
      let parent = target.parentElement;
      for (let i = 0; i < 3 && parent && parent !== document.body; i++) {
        const parentTruncated = isTruncated(parent);
        if (parentTruncated) return { text: parentTruncated, element: parent };
        parent = parent.parentElement;
      }

      // 3. Fallback: native title attribute (capture it so browser's native delayed tooltip doesn't clash)
      el = target;
      for (let i = 0; i < 3 && el && el !== document.body; i++) {
        const title = el.getAttribute('title');
        if (title && title.trim()) {
          // Store original title and clear temporarily to suppress native browser tooltip
          el.setAttribute('data-orig-title', title);
          el.removeAttribute('title');
          return { text: title.trim(), element: el };
        }
        el = el.parentElement;
      }

      return null;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const candidate = findCandidate(target);

      if (!candidate) {
        if (hoverTimeoutRef.current) {
          window.clearTimeout(hoverTimeoutRef.current);
          hoverTimeoutRef.current = null;
        }
        restoreTitle();
        setTooltip(null);
        currentElementRef.current = null;
        return;
      }

      if (currentElementRef.current === candidate.element && tooltip?.text === candidate.text) {
        return;
      }

      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
      }

      currentElementRef.current = candidate.element;

      // Small debounce (70ms) to ensure smooth feel without sluggishness
      hoverTimeoutRef.current = window.setTimeout(() => {
        if (!candidate.element.isConnected) {
          setTooltip(null);
          return;
        }

        const rect = candidate.element.getBoundingClientRect();
        // If element is completely offscreen or collapsed, don't show
        if (rect.width === 0 || rect.height === 0 || rect.bottom < 0 || rect.top > window.innerHeight) {
          setTooltip(null);
          return;
        }

        const approxHeight = 36;
        const spaceAbove = rect.top;
        const placement = spaceAbove >= approxHeight + 10 ? 'top' : 'bottom';

        const approxWidth = Math.min(Math.max(rect.width, 100), 320);
        let left = rect.left + rect.width / 2 - approxWidth / 2;
        left = Math.max(12, Math.min(window.innerWidth - approxWidth - 12, left));

        const y = placement === 'top' ? rect.top - 8 : rect.bottom + 8;
        const arrowX = Math.max(12, Math.min(approxWidth - 12, (rect.left + rect.width / 2) - left));

        setTooltip({
          text: candidate.text,
          targetRect: rect,
          placement,
          x: left,
          y,
          arrowX,
        });
      }, 70);
    };

    const restoreTitle = () => {
      const active = currentElementRef.current;
      if (active && active.hasAttribute('data-orig-title')) {
        const orig = active.getAttribute('data-orig-title');
        if (orig) active.setAttribute('title', orig);
        active.removeAttribute('data-orig-title');
      }
    };

    const handleDismiss = () => {
      if (hoverTimeoutRef.current) {
        window.clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      restoreTitle();
      setTooltip(null);
      currentElementRef.current = null;
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (!currentElementRef.current) return;
      const related = e.relatedTarget as Node | null;
      if (!related || !currentElementRef.current.contains(related)) {
        handleDismiss();
      }
    };

    // Listeners
    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    // Dismiss on scroll (any scroll in window, modal, or table)
    window.addEventListener('scroll', handleDismiss, { capture: true, passive: true });
    window.addEventListener('resize', handleDismiss, { passive: true });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') handleDismiss();
    });

    return () => {
      if (hoverTimeoutRef.current) window.clearTimeout(hoverTimeoutRef.current);
      restoreTitle();
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('scroll', handleDismiss, { capture: true });
      window.removeEventListener('resize', handleDismiss);
    };
  }, [tooltip]);

  // Adjust exact position once rendered in DOM
  useEffect(() => {
    if (!tooltip || !tooltipRef.current) return;
    const node = tooltipRef.current;
    const { width, height } = node.getBoundingClientRect();
    const rect = tooltip.targetRect;

    const spaceAbove = rect.top;
    const placement = spaceAbove >= height + 10 ? 'top' : 'bottom';

    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(12, Math.min(window.innerWidth - width - 12, left));

    const y = placement === 'top' ? rect.top - height - 8 : rect.bottom + 8;
    const arrowX = Math.max(12, Math.min(width - 12, (rect.left + rect.width / 2) - left));

    if (
      Math.abs(left - tooltip.x) > 2 ||
      Math.abs(y - tooltip.y) > 2 ||
      placement !== tooltip.placement ||
      Math.abs(arrowX - tooltip.arrowX) > 2
    ) {
      setTooltip(prev => prev ? {
        ...prev,
        x: left,
        y,
        placement,
        arrowX,
      } : null);
    }
  }, [tooltip?.text]);

  if (!tooltip || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        zIndex: 99999999,
      }}
      className="pointer-events-none select-none max-w-xs sm:max-w-sm md:max-w-md animate-in fade-in zoom-in-95 duration-100 ease-out"
    >
      <div className="relative rounded-lg bg-slate-900/95 px-2.5 py-1.5 text-xs font-medium text-white shadow-xl shadow-slate-950/30 backdrop-blur-xs border border-slate-700/80 leading-relaxed break-words whitespace-normal">
        {tooltip.text}
        {/* Caret / Arrow Indicator */}
        <div
          style={{ left: `${tooltip.arrowX}px` }}
          className={`absolute -translate-x-1/2 w-2 h-2 bg-slate-900/95 border-slate-700/80 transform rotate-45 ${
            tooltip.placement === 'top'
              ? 'bottom-[-4px] border-r border-b'
              : 'top-[-4px] border-l border-t'
          }`}
        />
      </div>
    </div>,
    document.body
  );
}
