import { Project } from "@/types/project";

const STORAGE_KEY = "cardnews-projects";
const RECENT_KEY = "cardnews-recent";

export function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as any).__TAURI__;
}

export async function saveProject(project: Project): Promise<void> {
  const all = await loadAllProjects();
  const idx = all.findIndex(p => p.id === project.id);
  if (idx >= 0) all[idx] = project; else all.push(project);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  addRecentProject(project.id);
}

export async function loadAllProjects(): Promise<Project[]> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export async function loadProject(id: string): Promise<Project | null> {
  const all = await loadAllProjects();
  return all.find(p => p.id === id) || null;
}

export async function deleteProject(id: string): Promise<void> {
  const all = await loadAllProjects();
  const filtered = all.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function duplicateProject(id: string): Promise<Project | null> {
  const all = await loadAllProjects();
  const found = all.find(p => p.id === id);
  if (!found) return null;
  const copy: Project = {
    ...JSON.parse(JSON.stringify(found)),
    id: crypto.randomUUID(),
    title: found.title + " (복사본)",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.push(copy);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return copy;
}

function addRecentProject(id: string) {
  const recent = getRecentProjectIds();
  const updated = [id, ...recent.filter(r => r !== id)].slice(0, 10);
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
}

export function getRecentProjectIds(): string[] {
  const raw = localStorage.getItem(RECENT_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export function clearRecentProjects() {
  localStorage.removeItem(RECENT_KEY);
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(RECENT_KEY);
}
