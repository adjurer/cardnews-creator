import { useState } from "react";
import { Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemplateSaveDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  saving: boolean;
}

export default function TemplateSaveDialog({ open, onClose, onSave, saving }: TemplateSaveDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!open) return null;

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-xl p-5 w-full max-w-md mx-4 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">템플릿으로 저장</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">템플릿 이름 *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예: 기술 뉴스 템플릿"
              className="w-full px-3 py-2 bg-background rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">설명 (선택)</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="간단한 설명"
              className="w-full px-3 py-2 bg-background rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground">취소</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className={cn(
              "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all",
              name.trim() && !saving ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
