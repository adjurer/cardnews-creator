import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemePreset, SlideTypography, SlideColors, SlidePosition } from "@/types/project";

export interface SavedStylePreset {
  id: string;
  name: string;
  createdAt: string;
  themePreset: ThemePreset;
  typography?: Partial<SlideTypography>;
  colors?: Partial<SlideColors>;
  position?: Partial<SlidePosition>;
}

interface StylePresetState {
  presets: SavedStylePreset[];
  addPreset: (preset: Omit<SavedStylePreset, "id" | "createdAt">) => void;
  deletePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
}

export const useStylePresetStore = create<StylePresetState>()(
  persist(
    (set) => ({
      presets: [],
      addPreset: (preset) =>
        set((state) => ({
          presets: [
            ...state.presets,
            {
              ...preset,
              id: `preset-${Date.now()}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      deletePreset: (id) =>
        set((state) => ({
          presets: state.presets.filter((p) => p.id !== id),
        })),
      renamePreset: (id, name) =>
        set((state) => ({
          presets: state.presets.map((p) => (p.id === id ? { ...p, name } : p)),
        })),
    }),
    { name: "style-presets" }
  )
);
