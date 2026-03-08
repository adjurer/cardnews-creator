import { create } from "zustand";
import type { ElementKey } from "@/types/project";

export type MarginGuide = "none" | "narrow" | "normal" | "wide";

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  exportDialogOpen: boolean;
  setExportDialogOpen: (v: boolean) => void;

  // Canvas selection
  selectedElement: ElementKey | null;
  setSelectedElement: (el: ElementKey | null) => void;

  // Canvas guides
  showGrid: boolean;
  showSafeArea: boolean;
  showRuler: boolean;
  gridSize: number;
  marginGuide: MarginGuide;
  toggleGrid: () => void;
  toggleSafeArea: () => void;
  toggleRuler: () => void;
  setGridSize: (s: number) => void;
  setMarginGuide: (m: MarginGuide) => void;
}

export const MARGIN_VALUES: Record<MarginGuide, number> = {
  none: 0,
  narrow: 4,
  normal: 8,
  wide: 14,
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  exportDialogOpen: false,
  setExportDialogOpen: (v) => set({ exportDialogOpen: v }),

  selectedElement: null,
  setSelectedElement: (el) => set({ selectedElement: el }),

  showGrid: false,
  showSafeArea: false,
  showRuler: false,
  gridSize: 20,
  marginGuide: "normal",
  toggleGrid: () => set(s => ({ showGrid: !s.showGrid })),
  toggleSafeArea: () => set(s => ({ showSafeArea: !s.showSafeArea })),
  toggleRuler: () => set(s => ({ showRuler: !s.showRuler })),
  setGridSize: (s) => set({ gridSize: s }),
  setMarginGuide: (m) => set({ marginGuide: m }),
}));
