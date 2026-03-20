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

    /* ── Mobile: instant switch — no animation, no VT overhead ── */
    const isMobile = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) {
      applyTheme();
      return;
    }

    /* ── Desktop: View Transitions API — circular reveal ── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const startVT: StartVT | undefined = (document as any).startViewTransition?.bind(document);

    if (!startVT || !e) {
      /* Fallback: CSS fade for Firefox */
      const html = document.documentElement;
      html.setAttribute('data-theme-switching', 'true');
      applyTheme();
      const t = setTimeout(() => html.removeAttribute('data-theme-switching'), 350);
      return () => clearTimeout(t);
    }

    const x = e.clientX;
    const y = e.clientY;
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
          duration: 650,
          easing: 'cubic-bezier(0.25, 1, 0.35, 1)',
          pseudoElement: '::view-transition-new(root)',
          composite: 'replace',
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
