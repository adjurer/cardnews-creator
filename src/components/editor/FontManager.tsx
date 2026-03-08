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

const BUILTIN_FONTS = [
  { family: "Pretendard Variable", label: "프리텐다드", weights: "100–900", desc: "카드뉴스 기본" },
  { family: "Freesentation", label: "프리젠테이션", weights: "100–900", desc: "프레젠테이션 특화" },
  { family: "Paperlogy", label: "페이퍼로지", weights: "100–900", desc: "부드러운 감성" },
  { family: "A2z", label: "에이투지", weights: "100–900", desc: "자율주행 브랜드" },
];

const SAMPLE_TEXT = "카드뉴스 디자인 Aa 123";

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
    ...BUILTIN_FONTS.map(f => ({ ...f, id: f.family, isBuiltin: true, isFavorite: false })),
    ...fonts.map(f => ({ id: f.id, family: f.family, label: f.family, weights: "", desc: "업로드 폰트", isBuiltin: false, isFavorite: f.isFavorite })),
  ];

  const FontCard = ({ font, isTitle }: { font: typeof allFonts[0]; isTitle: boolean }) => {
    const isSelected = isTitle
      ? (titleFont === font.family || (!titleFont && font.family === "Pretendard Variable"))
      : (bodyFont === font.family || (!bodyFont && font.family === "Pretendard Variable"));
    const setFont = isTitle ? onSetTitleFont : onSetBodyFont;

    return (
      <button
        onClick={() => setFont(font.family)}
        className={cn(
          "w-full text-left px-3 py-2 rounded-lg transition-all border",
          isSelected ? "bg-primary/10 border-primary/40" : "bg-surface border-transparent hover:border-border"
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-semibold text-foreground">{font.label}</span>
          <div className="flex items-center gap-1">
            {font.weights && <span className="text-[8px] text-muted-foreground">{font.weights}</span>}
            {!font.isBuiltin && (
              <Star
                className={cn("w-3 h-3 cursor-pointer", font.isFavorite ? "fill-warning text-warning" : "text-muted-foreground/30")}
                onClick={(e) => { e.stopPropagation(); toggleFavorite(font.id); }}
              />
            )}
          </div>
        </div>
        <p style={{ fontFamily: font.family }} className="text-[13px] text-muted-foreground truncate leading-tight">
          {SAMPLE_TEXT}
        </p>
        {font.desc && <span className="text-[8px] text-muted-foreground/60">{font.desc}</span>}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Upload */}
      <input ref={fileRef} type="file" accept=".otf,.ttf,.woff2" onChange={handleUpload} className="hidden" />
      <button onClick={() => fileRef.current?.click()}
        className="w-full py-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-[11px]">
        <Upload className="w-4 h-4" />
        폰트 파일 업로드 (.otf, .ttf, .woff2)
      </button>

      {/* Title font */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">제목 폰트</span>
        <div className="space-y-1 max-h-[180px] overflow-y-auto scrollbar-thin">
          {allFonts.map(f => <FontCard key={`t-${f.id}`} font={f} isTitle />)}
        </div>
      </div>

      {/* Body font */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">본문 폰트</span>
        <div className="space-y-1 max-h-[180px] overflow-y-auto scrollbar-thin">
          {allFonts.map(f => <FontCard key={`b-${f.id}`} font={f} isTitle={false} />)}
        </div>
      </div>

      {/* Uploaded fonts management */}
      {fonts.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">업로드된 폰트 관리</span>
          {fonts.map(f => (
            <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-surface text-[10px]">
              <Type className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate text-foreground">{f.name}</span>
              <span className="text-[8px] text-muted-foreground">{f.format}</span>
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
