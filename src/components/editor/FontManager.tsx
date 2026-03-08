import { useRef } from "react";
import { Upload, Star, Trash2, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFontStore } from "@/store/useFontStore";
import { toast } from "sonner";

interface Props {
  titleFont?: string;
  bodyFont?: string;
  onSetTitleFont: (family: string) => void;
  onSetBodyFont: (family: string) => void;
}

const SYSTEM_FONTS = [
  { family: "Pretendard Variable", label: "프리텐다드 (기본)" },
  { family: "system-ui", label: "시스템 기본" },
  { family: "serif", label: "세리프" },
  { family: "monospace", label: "모노스페이스" },
];

export function FontManager({ titleFont, bodyFont, onSetTitleFont, onSetBodyFont }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { fonts, addFont, removeFont, toggleFavorite } = useFontStore();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await addFont(file);
    if (result) {
      toast.success(`${result.family} 폰트가 추가되었습니다`);
    } else {
      toast.error("지원하지 않는 폰트 형식입니다 (.otf, .ttf, .woff2)");
    }
    e.target.value = "";
  };

  const allFonts = [
    ...SYSTEM_FONTS.map(f => ({ ...f, id: f.family, isSystem: true, isFavorite: false })),
    ...fonts.map(f => ({ id: f.id, family: f.family, label: f.family, isSystem: false, isFavorite: f.isFavorite })),
  ];

  const favorites = allFonts.filter(f => f.isFavorite);

  return (
    <div className="space-y-3">
      {/* Upload */}
      <input ref={fileRef} type="file" accept=".otf,.ttf,.woff2" onChange={handleUpload} className="hidden" />
      <button onClick={() => fileRef.current?.click()}
        className="w-full py-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[11px]">
        <Upload className="w-4 h-4" />
        폰트 파일 업로드 (.otf, .ttf, .woff2)
      </button>

      {/* Font selection */}
      <div className="space-y-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">제목 폰트</span>
        <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto scrollbar-thin">
          {allFonts.map(f => (
            <button key={`title-${f.id}`} onClick={() => onSetTitleFont(f.family)}
              className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-[11px] transition-all",
                titleFont === f.family || (!titleFont && f.family === "Pretendard Variable")
                  ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground"
              )}>
              <span style={{ fontFamily: f.family }} className="truncate flex-1">{f.label}</span>
              {!f.isSystem && (
                <Star className={cn("w-3 h-3 shrink-0", f.isFavorite ? "fill-warning text-warning" : "text-muted-foreground/30")}
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(f.id); }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">본문 폰트</span>
        <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto scrollbar-thin">
          {allFonts.map(f => (
            <button key={`body-${f.id}`} onClick={() => onSetBodyFont(f.family)}
              className={cn("flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left text-[11px] transition-all",
                bodyFont === f.family || (!bodyFont && f.family === "Pretendard Variable")
                  ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-surface hover:text-foreground"
              )}>
              <span style={{ fontFamily: f.family }} className="truncate flex-1">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Uploaded fonts management */}
      {fonts.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">업로드된 폰트</span>
          {fonts.map(f => (
            <div key={f.id} className="flex items-center gap-2 px-2 py-1 rounded-md bg-surface text-[10px]">
              <Type className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate text-foreground">{f.name}</span>
              <button onClick={() => removeFont(f.id)} className="text-destructive/60 hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
