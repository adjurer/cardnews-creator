import { useState, useEffect } from "react";
import { BookTemplate, Loader2, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Slide } from "@/types/project";

interface Template {
  id: string;
  name: string;
  description: string | null;
  slides: Slide[];
  theme_preset: string;
  created_at: string;
}

interface TemplateListDialogProps {
  open: boolean;
  onClose: () => void;
  onLoad: (slides: Slide[], themePreset: string, name: string) => void;
}

export default function TemplateListDialog({ open, onClose, onLoad }: TemplateListDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    loadTemplates();
  }, [open]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("card_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTemplates((data || []) as any);
    } catch (e) {
      console.error("Failed to load templates:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await supabase.from("card_templates").delete().eq("id", id);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error("Failed to delete template:", e);
    } finally {
      setDeleting(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-lg mx-4 max-h-[70vh] flex flex-col animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <BookTemplate className="w-4 h-4" /> 저장된 템플릿
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin">
          {loading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">로딩 중...</span>
            </div>
          )}
          {!loading && templates.length === 0 && (
            <div className="text-center py-10 text-sm text-muted-foreground">
              저장된 템플릿이 없습니다.<br />
              에디터에서 프로젝트를 템플릿으로 저장할 수 있습니다.
            </div>
          )}
          {!loading && templates.map(t => (
            <div
              key={t.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-muted-foreground/30 transition-all mb-2"
            >
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-foreground">{t.name}</h4>
                {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                <span className="text-[10px] text-muted-foreground">
                  {(t.slides as any[])?.length || 0}장 · {new Date(t.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onLoad(t.slides, t.theme_preset, t.name)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
                >
                  불러오기
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={deleting === t.id}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  {deleting === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
