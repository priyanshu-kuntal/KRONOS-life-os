import { create } from 'zustand';
import { ColorTheme, darkTheme, lightTheme } from '../constants/theme';
import { ThemeMode } from '../types/models';

interface ThemeState {
  mode: ThemeMode;
  theme: ColorTheme;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  theme: darkTheme,
  isDark: true,
  setMode: (mode: ThemeMode) => {
    // For now 'system' maps to dark by default
    const isDark = mode === 'dark' || mode === 'system';
    set({
      mode,
      theme: isDark ? darkTheme : lightTheme,
      isDark,
    });
  },
  toggleTheme: () => {
    const currentMode = get().mode;
    const nextMode: ThemeMode = currentMode === 'dark' ? 'light' : 'dark';
    get().setMode(nextMode);
  },
}));
