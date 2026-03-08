import { useState, useRef } from "react";
import type { Slide, SlideType, LayoutType, TextAlign, ThemePreset, SlideImage } from "@/types/project";
import { THEME_LABELS } from "@/lib/themes";
import { MOCK_IMAGE_RESULTS } from "@/mocks/data";
import { cn } from "@/lib/utils";
import { Upload, Sparkles, Search, Image as ImageIcon } from "lucide-react";

interface Props {
  slide: Slide;
  onUpdate: (updates: Partial<Slide>) => void;
  projectTheme: ThemePreset;
}

const SLIDE_TYPES: { value: SlideType; label: string }[] = [
  { value: "cover", label: "커버" },
  { value: "summary", label: "요약" },
  { value: "detail", label: "상세" },
  { value: "list", label: "리스트" },
  { value: "quote", label: "인용" },
  { value: "timeline", label: "타임라인" },
  { value: "cta", label: "CTA" },
];

const LAYOUT_TYPES: { value: LayoutType; label: string }[] = [
  { value: "center-title", label: "중앙 제목" },
  { value: "title-body", label: "제목+본문" },
  { value: "title-image", label: "제목+이미지" },
  { value: "image-overlay", label: "이미지 오버레이" },
  { value: "bullet-list", label: "목록" },
  { value: "timeline", label: "타임라인" },
  { value: "quote", label: "인용" },
  { value: "cta", label: "CTA" },
];

const TEXT_ALIGNS: { value: TextAlign; label: string }[] = [
  { value: "left", label: "좌" },
  { value: "center", label: "중앙" },
  { value: "right", label: "우" },
];

const THEMES: ThemePreset[] = ["dark-minimal", "cyan-accent", "editorial-dark", "warm-neutral", "mono-contrast"];

type ImageTab = "upload" | "ai" | "search";

export function SlideForm({ slide, onUpdate, projectTheme }: Props) {
  const [imageTab, setImageTab] = useState<ImageTab>("upload");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</h4>
      {children}
    </div>
  );

  const inputCls = "w-full bg-surface rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUpdate({ image: { ...slide.image, mode: "upload", url } as SlideImage });
  };

  return (
    <div className="space-y-1 animate-fade-in">
      {/* Metadata */}
      <Section title="슬라이드 설정">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">타입</label>
            <select value={slide.type} onChange={e => onUpdate({ type: e.target.value as SlideType })} className={inputCls}>
              {SLIDE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">정렬</label>
            <div className="flex gap-1">
              {TEXT_ALIGNS.map(a => (
                <button key={a.value}
                  onClick={() => onUpdate({ textAlign: a.value })}
                  className={cn("flex-1 py-1.5 rounded-md text-xs font-medium transition-all",
                    slide.textAlign === a.value ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
                  )}>{a.label}</button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Text fields */}
      <Section title="텍스트">
        <div className="space-y-2">
          <input value={slide.category || ""} onChange={e => onUpdate({ category: e.target.value })}
            placeholder="카테고리" className={inputCls} />
          <input value={slide.title} onChange={e => onUpdate({ title: e.target.value })}
            placeholder="제목" className={cn(inputCls, "font-semibold")} />
          <input value={slide.subtitle || ""} onChange={e => onUpdate({ subtitle: e.target.value })}
            placeholder="부제목" className={inputCls} />
          <input value={slide.highlight || ""} onChange={e => onUpdate({ highlight: e.target.value })}
            placeholder="하이라이트" className={inputCls} />
          <textarea value={slide.body || ""} onChange={e => onUpdate({ body: e.target.value })}
            placeholder="본문" rows={3} className={cn(inputCls, "resize-none")} />
          <textarea
            value={slide.bullets?.join("\n") || ""}
            onChange={e => onUpdate({ bullets: e.target.value.split("\n").filter(Boolean) })}
            placeholder="목록 항목 (줄바꿈으로 구분)"
            rows={3} className={cn(inputCls, "resize-none")}
          />
          <input value={slide.cta || ""} onChange={e => onUpdate({ cta: e.target.value })}
            placeholder="CTA 텍스트" className={inputCls} />
          <input value={slide.sourceLabel || ""} onChange={e => onUpdate({ sourceLabel: e.target.value })}
            placeholder="출처" className={inputCls} />
        </div>
      </Section>

      {/* Layout */}
      <Section title="레이아웃">
        <div className="grid grid-cols-4 gap-1.5">
          {LAYOUT_TYPES.map(l => (
            <button key={l.value}
              onClick={() => onUpdate({ layoutType: l.value })}
              className={cn("py-2 px-1 rounded-md text-[10px] font-medium transition-all text-center",
                slide.layoutType === l.value ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent"
              )}>{l.label}</button>
          ))}
        </div>
      </Section>

      {/* Theme */}
      <Section title="테마">
        <div className="flex gap-1.5 flex-wrap">
          {THEMES.map(t => (
            <button key={t}
              onClick={() => onUpdate({ themePreset: t })}
              className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                slide.themePreset === t ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent"
              )}>{THEME_LABELS[t]}</button>
          ))}
        </div>
      </Section>

      {/* Image */}
      <Section title="이미지">
        <div className="flex gap-1 mb-3">
          {([
            { id: "upload" as ImageTab, label: "첨부 이미지", icon: Upload },
            { id: "ai" as ImageTab, label: "AI 이미지", icon: Sparkles },
            { id: "search" as ImageTab, label: "검색 이미지", icon: Search },
          ]).map(tab => (
            <button key={tab.id}
              onClick={() => setImageTab(tab.id)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                imageTab === tab.id ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
              )}>
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

        {imageTab === "upload" && (
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">클릭하거나 드래그하여 업로드</span>
            </button>
          </div>
        )}

        {imageTab === "ai" && (
          <div className="space-y-2">
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="이미지 프롬프트 입력" className={inputCls} />
            <button onClick={() => {
              const mockUrl = MOCK_IMAGE_RESULTS[Math.floor(Math.random() * MOCK_IMAGE_RESULTS.length)];
              onUpdate({ image: { mode: "generate", url: mockUrl, prompt: aiPrompt } as SlideImage });
            }} className="w-full py-2 rounded-md bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition-colors">
              AI 이미지 생성 (Mock)
            </button>
          </div>
        )}

        {imageTab === "search" && (
          <div className="space-y-3">
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="검색어 입력" className={inputCls} />
            <div className="grid grid-cols-4 gap-1.5">
              {MOCK_IMAGE_RESULTS.map((url, i) => (
                <button key={i} onClick={() => onUpdate({ image: { mode: "search", url } as SlideImage })}
                  className={cn("aspect-square rounded-md overflow-hidden border-2 transition-all",
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
              <span className="text-xs text-muted-foreground">현재 이미지</span>
              <button onClick={() => onUpdate({ image: undefined })} className="text-xs text-destructive hover:underline">제거</button>
            </div>
            <div className="w-full h-20 rounded-md overflow-hidden">
              <img src={slide.image.url} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground">투명도</label>
                <input type="range" min="0" max="1" step="0.05"
                  value={slide.image.overlayOpacity ?? 0.5}
                  onChange={e => onUpdate({ image: { ...slide.image!, overlayOpacity: parseFloat(e.target.value) } })}
                  className="w-full accent-primary h-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">크기</label>
                <input type="range" min="0.5" max="2" step="0.05"
                  value={slide.image.scale ?? 1}
                  onChange={e => onUpdate({ image: { ...slide.image!, scale: parseFloat(e.target.value) } })}
                  className="w-full accent-primary h-1"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">둥글기</label>
                <input type="range" min="0" max="24" step="1"
                  value={slide.image.borderRadius ?? 0}
                  onChange={e => onUpdate({ image: { ...slide.image!, borderRadius: parseInt(e.target.value) } })}
                  className="w-full accent-primary h-1"
                />
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
