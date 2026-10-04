import { useCallback, useEffect, useState } from 'react';
import { reducedMotion } from './motion';

export type Theme = 'light' | 'dark';
const KEY = 'quantly.theme';

/** Purple and white is the default; dark is used only when the visitor chose it (remembered in this browser). */
function initial(): Theme {
  try {
    if (localStorage.getItem(KEY) === 'dark') return 'dark';
  } catch {}
  return 'light';
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0c0919' : '#ffffff');
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => { apply(theme); }, [theme]);

  /** Switches theme. Where the browser supports it, the new theme spreads out in a circle from the button. */
  const toggle = useCallback((origin?: { x: number; y: number }) => {
    const next: Theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    const commit = () => {
      apply(next);
      setTheme(next);
      try { localStorage.setItem(KEY, next); } catch {}
    };
    const doc = document as Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };
    if (!doc.startViewTransition || reducedMotion() || !origin) { commit(); return; }
    const r = Math.hypot(Math.max(origin.x, window.innerWidth - origin.x), Math.max(origin.y, window.innerHeight - origin.y));
    document.documentElement.classList.add('theme-switching');
    const vt = doc.startViewTransition(commit);
    vt.ready
      .then(() => document.documentElement.animate(
        { clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${r}px at ${origin.x}px ${origin.y}px)`] },
        { duration: 480, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
      ).finished)
      .catch(() => undefined)
      .finally(() => document.documentElement.classList.remove('theme-switching'));
  }, []);
  return { theme, toggle };
}
