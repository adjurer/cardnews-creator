import { create } from "zustand";
import type { UploadedFont } from "@/types/project";

interface FontState {
  fonts: UploadedFont[];
  loadFonts: () => void;
  addFont: (file: File) => Promise<UploadedFont | null>;
  removeFont: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setTarget: (id: string, target: "title" | "body" | "both") => void;
}

const STORAGE_KEY = "cardnews-fonts";

function getFormat(name: string): "truetype" | "opentype" | "woff2" {
  if (name.endsWith(".woff2")) return "woff2";
  if (name.endsWith(".otf")) return "opentype";
  return "truetype";
}

function injectFontFace(font: UploadedFont) {
  const existing = document.getElementById(`font-${font.id}`);
  if (existing) return;
  const style = document.createElement("style");
  style.id = `font-${font.id}`;
  style.textContent = `@font-face { font-family: '${font.family}'; src: url('${font.url}') format('${font.format}'); font-display: swap; }`;
  document.head.appendChild(style);
}

function removeFontFace(id: string) {
  document.getElementById(`font-${id}`)?.remove();
}

export const useFontStore = create<FontState>((set, get) => ({
  fonts: [],

  loadFonts: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const fonts: UploadedFont[] = JSON.parse(stored);
        fonts.forEach(injectFontFace);
        set({ fonts });
      }
    } catch {}
  },

  addFont: async (file) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["ttf", "otf", "woff2"].includes(ext)) return null;

    const url = URL.createObjectURL(file);
    const familyName = file.name.replace(/\.(ttf|otf|woff2)$/i, "").replace(/[-_]/g, " ");
    const id = `font-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const font: UploadedFont = {
      id,
      name: file.name,
      family: familyName,
      url,
      format: getFormat(file.name),
      target: "both",
      addedAt: new Date().toISOString(),
    };

    injectFontFace(font);

    // Store font data as base64 for persistence
    const reader = new FileReader();
    const base64 = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    const persistedFont = { ...font, url: base64 };
    const fonts = [...get().fonts, persistedFont];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fonts));

    // Use blob URL for runtime, base64 for persistence
    set({ fonts: [...get().fonts, font] });
    return font;
  },

  removeFont: (id) => {
    removeFontFace(id);
    const fonts = get().fonts.filter(f => f.id !== id);
    set({ fonts });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fonts));
  },

  toggleFavorite: (id) => {
    const fonts = get().fonts.map(f => f.id === id ? { ...f, isFavorite: !f.isFavorite } : f);
    set({ fonts });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fonts));
  },

  setTarget: (id, target) => {
    const fonts = get().fonts.map(f => f.id === id ? { ...f, target } : f);
    set({ fonts });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fonts));
  },
}));
