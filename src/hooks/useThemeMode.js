import { useEffect, useState } from 'react';

const STORAGE_KEY = 'smartquiz-theme';

export default function useThemeMode() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    // 1. Check localStorage for explicit user preference
    const storedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (storedTheme) {
      return storedTheme === 'dark';
    }

    // 2. Fallback to system preference (Auto-detect)
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (event) => {
      // Only auto-update if the user HAS NOT set a manual preference
      const storedTheme = window.localStorage.getItem(STORAGE_KEY);
      if (!storedTheme) {
        setIsDarkMode(event.matches);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    
    // Older browsers
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const setThemeMode = (newValue) => {
    // If newValue is a boolean, use it; otherwise toggle
    const nextValue = typeof newValue === 'boolean' ? newValue : !isDarkMode;
    
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextValue ? 'dark' : 'light');
    }
    setIsDarkMode(nextValue);
  };

  return [isDarkMode, setThemeMode];
}
