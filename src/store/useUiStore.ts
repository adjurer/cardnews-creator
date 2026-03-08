import { create } from "zustand";

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  exportDialogOpen: boolean;
  setExportDialogOpen: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  exportDialogOpen: false,
  setExportDialogOpen: (v) => set({ exportDialogOpen: v }),
}));
