import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useThemeStore } from "@/store/useThemeStore";
import DashboardPage from "@/pages/DashboardPage";
import CreateProjectPage from "@/pages/CreateProjectPage";
import GenerationProgressPage from "@/pages/GenerationProgressPage";
import EditorPage from "@/pages/EditorPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ThemeInit() {
  const { mode } = useThemeStore();
  useEffect(() => {
    const root = document.documentElement;
    if (mode === "system") {
      root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
    } else {
      root.classList.toggle("dark", mode === "dark");
    }
  }, [mode]);
  return null;
}

const App = () => {
  const mode = useThemeStore(s => s.mode);
  const sonnerTheme = mode === "system"
    ? (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : mode;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeInit />
        <Sonner position="bottom-right" theme={sonnerTheme} />
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/create" element={<CreateProjectPage />} />
              <Route path="/generate" element={<GenerationProgressPage />} />
              <Route path="/editor/:projectId" element={<EditorPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
