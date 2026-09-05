"use client";

// =============================================================================
// ConMart — Language Context (Client Component with useSyncExternalStore)
// =============================================================================

import React, { createContext, useContext, useSyncExternalStore } from "react";
import { translations, type Locale } from "./translations";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANG_STORAGE_KEY = "conmart_locale";

// Store listeners
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Locale {
  if (typeof window === "undefined") return "en";
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  return saved === "am" ? "am" : "en";
}

function getServerSnapshot(): Locale {
  return "en";
}

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem(LANG_STORAGE_KEY, newLocale);
    notify();
  };

  const toggleLocale = () => {
    setLocale(locale === "en" ? "am" : "en");
  };

  const t = (key: string, fallback?: string): string => {
    const currentDict = translations[locale];
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return fallback ?? key;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
