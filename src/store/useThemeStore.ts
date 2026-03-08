import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  } else {
    root.classList.toggle("dark", mode === "dark");
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "dark",
      setMode: (m) => {
        applyTheme(m);
        set({ mode: m });
      },
    }),
    {
      name: "theme-mode",
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.mode);
      },
    }
  )
);

// Listen for system preference changes
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    const { mode } = useThemeStore.getState();
    if (mode === "system") applyTheme("system");
  });
}
