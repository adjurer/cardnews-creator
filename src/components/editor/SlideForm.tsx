import { useState, useRef } from "react";
import type { Slide, SlideType, LayoutType, TextAlign, ThemePreset, SlideImage } from "@/types/project";
import { THEME_LABELS } from "@/lib/themes";
import { MOCK_IMAGE_RESULTS } from "@/mocks/data";
import { cn } from "@/lib/utils";
import { Upload, Sparkles, Search, Image as ImageIcon, ChevronDown } from "lucide-react";

interface Props {
  slide: Slide;
  onUpdate: (updates: Partial<Slide>) => void;
  projectTheme: ThemePreset;
}

const LAYOUT_OPTIONS: { value: LayoutType; label: string }[] = [
  { value: "center-title", label: "중앙 제목" },
  { value: "title-body", label: "제목+본문" },
  { value: "image-overlay", label: "이미지 오버레이" },
  { value: "bullet-list", label: "목록" },
  { value: "quote", label: "인용" },
  { value: "cta", label: "CTA" },
];

const TEXT_ALIGNS: { value: TextAlign; label: string }[] = [
  { value: "left", label: "좌" },
  { value: "center", label: "중앙" },
  { value: "right", label: "우" },
];

const THEMES: ThemePreset[] = ["dark-minimal", "cyan-accent", "editorial-dark", "warm-neutral"];

type ImageTab = "upload" | "ai" | "search";

export function SlideForm({ slide, onUpdate, projectTheme }: Props) {
  const [imageTab, setImageTab] = useState<ImageTab>("upload");
  const [aiPrompt, setAiPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ text: true, style: true });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (key: string) => setOpenSections(p => ({ ...p, [key]: !p[key] }));

  const inputCls = "w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUpdate({ image: { ...slide.image, mode: "upload", url } as SlideImage });
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="border-b border-border last:border-0">
      <button onClick={() => toggleSection(id)} className="flex items-center justify-between w-full py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground">
        {title}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", openSections[id] && "rotate-180")} />
      </button>
      {openSections[id] && <div className="pb-4">{children}</div>}
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Text */}
      <Section id="text" title="텍스트">
        <div className="space-y-2">
          <input value={slide.category || ""} onChange={e => onUpdate({ category: e.target.value })} placeholder="카테고리" className={cn(inputCls, "text-xs")} />
          <input value={slide.title} onChange={e => onUpdate({ title: e.target.value })} placeholder="제목" className={cn(inputCls, "font-semibold")} />
          <input value={slide.subtitle || ""} onChange={e => onUpdate({ subtitle: e.target.value })} placeholder="부제목" className={inputCls} />
          <input value={slide.highlight || ""} onChange={e => onUpdate({ highlight: e.target.value })} placeholder="하이라이트" className={inputCls} />
          <textarea value={slide.body || ""} onChange={e => onUpdate({ body: e.target.value })} placeholder="본문" rows={3} className={cn(inputCls, "resize-none")} />
          <textarea
            value={slide.bullets?.join("\n") || ""}
            onChange={e => onUpdate({ bullets: e.target.value.split("\n").filter(Boolean) })}
            placeholder="목록 항목 (줄바꿈으로 구분)" rows={2} className={cn(inputCls, "resize-none")}
          />
          <input value={slide.cta || ""} onChange={e => onUpdate({ cta: e.target.value })} placeholder="CTA 텍스트" className={inputCls} />
        </div>
      </Section>

      {/* Style */}
      <Section id="style" title="스타일">
        {/* Text align */}
        <div className="mb-3">
          <label className="text-[10px] text-muted-foreground mb-1.5 block">정렬</label>
          <div className="flex gap-1">
            {TEXT_ALIGNS.map(a => (
              <button key={a.value} onClick={() => onUpdate({ textAlign: a.value })}
                className={cn("flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                  slide.textAlign === a.value ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
                )}>{a.label}</button>
            ))}
          </div>
        </div>

        {/* Layout */}
        <div className="mb-3">
          <label className="text-[10px] text-muted-foreground mb-1.5 block">레이아웃</label>
          <div className="grid grid-cols-3 gap-1.5">
            {LAYOUT_OPTIONS.map(l => (
              <button key={l.value} onClick={() => onUpdate({ layoutType: l.value })}
                className={cn("py-2 rounded-lg text-[10px] font-medium transition-all text-center",
                  slide.layoutType === l.value ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent"
                )}>{l.label}</button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className="text-[10px] text-muted-foreground mb-1.5 block">색상 프리셋</label>
          <div className="flex gap-1.5 flex-wrap">
            {THEMES.map(t => (
              <button key={t} onClick={() => onUpdate({ themePreset: t })}
                className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                  slide.themePreset === t ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent"
                )}>{THEME_LABELS[t]}</button>
            ))}
          </div>
        </div>
      </Section>

      {/* Image */}
      <Section id="image" title="이미지">
        <div className="flex gap-1 mb-3">
          {([
            { id: "upload" as ImageTab, label: "첨부", icon: Upload },
            { id: "ai" as ImageTab, label: "AI 생성", icon: Sparkles },
            { id: "search" as ImageTab, label: "검색", icon: Search },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setImageTab(tab.id)}
              className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                imageTab === tab.id ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
              )}>
              <tab.icon className="w-3 h-3" /> {tab.label}
            </button>
          ))}
        </div>

        {imageTab === "upload" && (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ImageIcon className="w-6 h-6" />
              <span className="text-[10px]">클릭하여 이미지 업로드</span>
            </button>
          </>
        )}

        {imageTab === "ai" && (
          <div className="space-y-2">
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="이미지 프롬프트 입력" className={inputCls} />
            <button onClick={() => {
              const mockUrl = MOCK_IMAGE_RESULTS[Math.floor(Math.random() * MOCK_IMAGE_RESULTS.length)];
              onUpdate({ image: { mode: "generate", url: mockUrl, prompt: aiPrompt } as SlideImage });
            }} className="w-full py-2 rounded-lg bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition-colors">
              AI 이미지 생성 (Mock)
            </button>
          </div>
        )}

        {imageTab === "search" && (
          <div className="space-y-2">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="검색어 입력" className={inputCls} />
            <div className="grid grid-cols-4 gap-1.5">
              {MOCK_IMAGE_RESULTS.map((url, i) => (
                <button key={i} onClick={() => onUpdate({ image: { mode: "search", url } as SlideImage })}
                  className={cn("aspect-square rounded-lg overflow-hidden border-2 transition-all",
                    slide.image?.url === url ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                  )}>
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Image adjustments */}
        {slide.image?.url && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">현재 이미지</span>
              <button onClick={() => onUpdate({ image: undefined })} className="text-[10px] text-destructive hover:underline">제거</button>
            </div>
            <div className="w-full h-16 rounded-lg overflow-hidden">
              <img src={slide.image.url} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] text-muted-foreground">투명도</label>
                <input type="range" min="0" max="1" step="0.05"
                  value={slide.image.overlayOpacity ?? 0.5}
                  onChange={e => onUpdate({ image: { ...slide.image!, overlayOpacity: parseFloat(e.target.value) } })}
                  className="w-full accent-primary h-1" />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">크기</label>
                <input type="range" min="0.5" max="2" step="0.05"
                  value={slide.image.scale ?? 1}
                  onChange={e => onUpdate({ image: { ...slide.image!, scale: parseFloat(e.target.value) } })}
                  className="w-full accent-primary h-1" />
              </div>
              <div>
                <label className="text-[9px] text-muted-foreground">둥글기</label>
                <input type="range" min="0" max="24" step="1"
                  value={slide.image.borderRadius ?? 0}
                  onChange={e => onUpdate({ image: { ...slide.image!, borderRadius: parseInt(e.target.value) } })}
                  className="w-full accent-primary h-1" />
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
