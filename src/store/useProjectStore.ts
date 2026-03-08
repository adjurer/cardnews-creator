import { create } from "zustand";
import { Project, Slide, ThemePreset, LayoutType, TextAlign, ExportSize } from "@/types/project";
import { saveProject, loadAllProjects, loadProject, deleteProject, duplicateProject } from "@/lib/persistence/storage";
import { MOCK_PROJECTS } from "@/mocks/data";
import { generateId } from "@/lib/utils/helpers";

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  currentSlideIndex: number;
  saveStatus: "idle" | "saving" | "saved" | "error";
  generationStatus: "idle" | "generating" | "done" | "error";
  generationStep: number;

  loadProjects: () => Promise<void>;
  setCurrentProject: (p: Project | null) => void;
  setCurrentSlideIndex: (i: number) => void;
  openProject: (id: string) => Promise<void>;

  createProject: (p: Project) => Promise<void>;
  saveCurrentProject: () => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  copyProject: (id: string) => Promise<Project | null>;

  updateSlide: (slideId: string, updates: Partial<Slide>) => void;
  addSlide: (afterIndex?: number) => void;
  deleteSlide: (slideId: string) => void;
  moveSlide: (fromIndex: number, toIndex: number) => void;
  duplicateSlide: (slideId: string) => void;

  updateProjectTitle: (title: string) => void;
  updateProjectTheme: (theme: ThemePreset) => void;
  updateExportSize: (size: ExportSize) => void;

  setGenerationStatus: (s: "idle" | "generating" | "done" | "error") => void;
  setGenerationStep: (n: number) => void;

  // Undo/Redo
  history: Project[];
  historyIndex: number;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  currentSlideIndex: 0,
  saveStatus: "idle",
  generationStatus: "idle",
  generationStep: 0,
  history: [],
  historyIndex: -1,

  loadProjects: async () => {
    let projects = await loadAllProjects();
    if (projects.length === 0) {
      // Seed mock data
      for (const p of MOCK_PROJECTS) {
        await saveProject(p);
      }
      projects = MOCK_PROJECTS;
    }
    set({ projects });
  },

  setCurrentProject: (p) => set({ currentProject: p, currentSlideIndex: 0 }),
  setCurrentSlideIndex: (i) => set({ currentSlideIndex: i }),

  openProject: async (id) => {
    const p = await loadProject(id);
    if (p) set({ currentProject: p, currentSlideIndex: 0, history: [JSON.parse(JSON.stringify(p))], historyIndex: 0 });
  },

  createProject: async (p) => {
    await saveProject(p);
    const projects = await loadAllProjects();
    set({ projects, currentProject: p, currentSlideIndex: 0 });
  },

  saveCurrentProject: async () => {
    const { currentProject } = get();
    if (!currentProject) return;
    set({ saveStatus: "saving" });
    try {
      const updated = { ...currentProject, updatedAt: new Date().toISOString() };
      await saveProject(updated);
      const projects = await loadAllProjects();
      set({ saveStatus: "saved", currentProject: updated, projects });
      setTimeout(() => set({ saveStatus: "idle" }), 2000);
    } catch {
      set({ saveStatus: "error" });
    }
  },

  removeProject: async (id) => {
    await deleteProject(id);
    const projects = await loadAllProjects();
    set({ projects });
    if (get().currentProject?.id === id) set({ currentProject: null });
  },

  copyProject: async (id) => {
    const copy = await duplicateProject(id);
    if (copy) {
      const projects = await loadAllProjects();
      set({ projects });
    }
    return copy;
  },

  updateSlide: (slideId, updates) => {
    const { currentProject } = get();
    if (!currentProject) return;
    get().pushHistory();
    const slides = currentProject.slides.map(s =>
      s.id === slideId ? { ...s, ...updates } : s
    );
    set({ currentProject: { ...currentProject, slides, updatedAt: new Date().toISOString() }, saveStatus: "idle" });
  },

  addSlide: (afterIndex) => {
    const { currentProject, currentSlideIndex } = get();
    if (!currentProject) return;
    get().pushHistory();
    const idx = afterIndex ?? currentSlideIndex;
    const newSlide: Slide = {
      id: generateId(), type: "detail", title: "새 슬라이드",
      body: "내용을 입력하세요", layoutType: "title-body",
      textAlign: "center", themePreset: currentProject.themePreset,
    };
    const slides = [...currentProject.slides];
    slides.splice(idx + 1, 0, newSlide);
    set({ currentProject: { ...currentProject, slides }, currentSlideIndex: idx + 1 });
  },

  deleteSlide: (slideId) => {
    const { currentProject, currentSlideIndex } = get();
    if (!currentProject || currentProject.slides.length <= 1) return;
    get().pushHistory();
    const slides = currentProject.slides.filter(s => s.id !== slideId);
    const newIdx = Math.min(currentSlideIndex, slides.length - 1);
    set({ currentProject: { ...currentProject, slides }, currentSlideIndex: newIdx });
  },

  moveSlide: (from, to) => {
    const { currentProject } = get();
    if (!currentProject) return;
    get().pushHistory();
    const slides = [...currentProject.slides];
    const [item] = slides.splice(from, 1);
    slides.splice(to, 0, item);
    set({ currentProject: { ...currentProject, slides }, currentSlideIndex: to });
  },

  duplicateSlide: (slideId) => {
    const { currentProject } = get();
    if (!currentProject) return;
    get().pushHistory();
    const idx = currentProject.slides.findIndex(s => s.id === slideId);
    if (idx < 0) return;
    const copy = { ...JSON.parse(JSON.stringify(currentProject.slides[idx])), id: generateId() };
    const slides = [...currentProject.slides];
    slides.splice(idx + 1, 0, copy);
    set({ currentProject: { ...currentProject, slides }, currentSlideIndex: idx + 1 });
  },

  updateProjectTitle: (title) => {
    const { currentProject } = get();
    if (!currentProject) return;
    set({ currentProject: { ...currentProject, title } });
  },

  updateProjectTheme: (theme) => {
    const { currentProject } = get();
    if (!currentProject) return;
    const slides = currentProject.slides.map(s => ({ ...s, themePreset: theme }));
    set({ currentProject: { ...currentProject, themePreset: theme, slides } });
  },

  updateExportSize: (size) => {
    const { currentProject } = get();
    if (!currentProject) return;
    set({ currentProject: { ...currentProject, exportPreset: { ...currentProject.exportPreset, size } } });
  },

  setGenerationStatus: (s) => set({ generationStatus: s }),
  setGenerationStep: (n) => set({ generationStep: n }),

  pushHistory: () => {
    const { currentProject, history, historyIndex } = get();
    if (!currentProject) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(currentProject)));
    if (newHistory.length > 30) newHistory.shift();
    set({ history: newHistory, historyIndex: newHistory.length - 1 });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIdx = historyIndex - 1;
    set({ currentProject: JSON.parse(JSON.stringify(history[newIdx])), historyIndex: newIdx });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIdx = historyIndex + 1;
    set({ currentProject: JSON.parse(JSON.stringify(history[newIdx])), historyIndex: newIdx });
  },
}));
