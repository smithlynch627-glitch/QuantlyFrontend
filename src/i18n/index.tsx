import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { en, type DictKey } from './en';

/** The site ships in English. `Lang` stays a type so adding a language later only means adding a dictionary. */
export type Lang = 'en';
type Vars = Record<string, string | number>;
export type T = (key: DictKey, vars?: Vars) => string;

interface I18nValue {
  lang: Lang;
  t: T;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const lang: Lang = 'en';

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback<T>((key, vars) => {
    const pluralKey = vars && Number(vars.n) === 1 ? (`${key}_one` as DictKey) : null;
    let s: string = (pluralKey && en[pluralKey as keyof typeof en]) || en[key] || key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  }, []);

  const value = useMemo(() => ({ lang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
