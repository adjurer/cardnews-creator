import { ThemeColors, ThemePreset } from "@/types/project";

export const THEME_MAP: Record<ThemePreset, ThemeColors> = {
  "dark-minimal": {
    background: "#1a1a2e",
    panelBg: "#16213e",
    primaryText: "#eaeaea",
    secondaryText: "#a0a0b0",
    accent: "#0ff0fc",
    border: "#2a2a4a",
    overlay: "rgba(0,0,0,0.5)",
  },
  "cyan-accent": {
    background: "#0d1117",
    panelBg: "#161b22",
    primaryText: "#f0f6fc",
    secondaryText: "#8b949e",
    accent: "#39d2c0",
    border: "#30363d",
    overlay: "rgba(0,0,0,0.45)",
  },
  "editorial-dark": {
    background: "#111111",
    panelBg: "#1a1a1a",
    primaryText: "#ffffff",
    secondaryText: "#999999",
    accent: "#ff6b35",
    border: "#333333",
    overlay: "rgba(0,0,0,0.55)",
  },
  "warm-neutral": {
    background: "#f5f0eb",
    panelBg: "#ebe5de",
    primaryText: "#2d2926",
    secondaryText: "#6b6560",
    accent: "#c17f59",
    border: "#d4cdc5",
    overlay: "rgba(0,0,0,0.3)",
  },
  "mono-contrast": {
    background: "#000000",
    panelBg: "#111111",
    primaryText: "#ffffff",
    secondaryText: "#888888",
    accent: "#ffffff",
    border: "#333333",
    overlay: "rgba(0,0,0,0.6)",
  },
};

export const THEME_LABELS: Record<ThemePreset, string> = {
  "dark-minimal": "다크 미니멀",
  "cyan-accent": "시안 액센트",
  "editorial-dark": "에디토리얼 다크",
  "warm-neutral": "웜 뉴트럴",
  "mono-contrast": "모노 콘트라스트",
};
