import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: (e?: React.MouseEvent) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  isDark: false,
  toggleTheme: () => {},
});

/* ─── View Transitions API — narrow type assertion (Chrome 111+, Edge 111+) ─── */
interface VTResult {
  ready: Promise<void>;
  finished: Promise<void>;
  updateCallbackDone: Promise<void>;
}
type StartVT = (cb: () => void | Promise<void>) => VTResult;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('ttvv-theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
    localStorage.setItem('ttvv-theme', theme);
  }, [theme]);

  const toggleTheme = (e?: React.MouseEvent) => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    const applyTheme = () => setTheme(newTheme);

    /* ── View Transitions API: GPU-accelerated circular reveal ── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const startVT: StartVT | undefined = (document as any).startViewTransition?.bind(document);

    if (!startVT || !e) {
      /* Fallback: CSS transition (browsers without VT support) */
      const html = document.documentElement;
      html.setAttribute('data-theme-switching', 'true');
      applyTheme();
      const t = setTimeout(() => html.removeAttribute('data-theme-switching'), 280);
      return () => clearTimeout(t);
    }

    const x = e.clientX;
    const y = e.clientY;
    /* Radius large enough to cover the farthest corner of the viewport */
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = startVT(applyTheme);

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 420,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)', /* spring-like ease-out */
          pseudoElement: '::view-transition-new(root)',
        },
      );
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
