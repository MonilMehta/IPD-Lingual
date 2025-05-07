import { useEffect, useState } from 'react';

export function useColorScheme() {
  const [scheme, setScheme] = useState('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') {
        setScheme(stored);
      } else {
        setScheme('light');
      }
    } catch {
      setScheme('light');
    }
  }, []);

  return scheme;
}
