// Motion helpers. Everything here animates only transform and opacity, and does nothing when the visitor
// asked their device for reduced motion.
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Closing animation for anything that is simply removed from the page (dialogs, menus, sheets, the lightbox).
 * When the element goes away, a lifeless copy of it stays for a moment with the `is-closing` class and plays the
 * CSS exit animation, so every way of closing (the cross, the backdrop, Escape, a "Done" button, a route change)
 * animates the same way without each caller having to delay its own state.
 * The copy cannot be clicked or focused and is hidden from screen readers.
 */
export function useExitAnimation(ref: RefObject<HTMLElement>, active = true, ms = 200) {
  useLayoutEffect(() => {
    if (!active) return;
    const node = ref.current;
    const born = performance.now();
    return () => {
      if (!node || reducedMotion()) return;
      // React's development double-mount unmounts immediately after mounting: nothing to animate.
      if (performance.now() - born < 60) return;
      const ghost = node.cloneNode(true) as HTMLElement;
      ghost.classList.add('is-closing');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.setAttribute('inert', '');
      ghost.removeAttribute('id');
      ghost.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
      ghost.style.pointerEvents = 'none';
      document.body.appendChild(ghost);
      window.setTimeout(() => ghost.remove(), ms);
    };
  }, [ref, active, ms]);
}

/** Keeps something mounted for `ms` after `open` turns false, so it can animate out. */
export function usePresence(open: boolean, ms = 200) {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) { setMounted(true); return; }
    if (reducedMotion()) { setMounted(false); return; }
    const id = window.setTimeout(() => setMounted(false), ms);
    return () => window.clearTimeout(id);
  }, [open, ms]);
  return { mounted: open || mounted, closing: !open && mounted };
}

/**
 * Which way the visitor is moving through the site: "back" for the browser's back button (or the Back button on a
 * page), "forward" otherwise. Pages slide in from the matching side.
 */
export function useRouteDirection(): { key: string; direction: 'forward' | 'back' } {
  const loc = useLocation();
  const type = useNavigationType();
  return { key: loc.pathname, direction: type === 'POP' ? 'back' : 'forward' };
}

/** Moves a highlight under the selected item of a row (tabs, navigation), animating between items. */
export function useSlidingIndicator(container: RefObject<HTMLElement>, selector: string, dep: unknown) {
  const first = useRef(true);
  useLayoutEffect(() => {
    const row = container.current;
    if (!row) return;
    const place = () => {
      const el = row.querySelector<HTMLElement>(selector);
      if (!el) { row.style.setProperty('--ind-o', '0'); return; }
      row.style.setProperty('--ind-x', `${el.offsetLeft}px`);
      row.style.setProperty('--ind-w', `${el.offsetWidth}px`);
      row.style.setProperty('--ind-o', '1');
      // The first placement must not slide in from the left edge.
      if (first.current) {
        row.classList.add('no-ind-anim');
        requestAnimationFrame(() => { row.classList.remove('no-ind-anim'); first.current = false; });
      }
    };
    place();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(place) : null;
    ro?.observe(row);
    document.fonts?.ready.then(place).catch(() => undefined);
    return () => ro?.disconnect();
  }, [container, selector, dep]);
}
