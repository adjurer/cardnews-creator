import { useState, useRef, useEffect } from "react";
import { generateSlideImage } from "@/lib/ai/aiService";
import type { Slide, SlideType, LayoutType, TextAlign, ThemePreset, SlideImage, SlideLogo, SlideTypography, SlideColors, SlideVisibility, SlidePosition, ElementKey, ElementOverride, AutoLayoutPreset, ExportSize, OverlayDirection } from "@/types/project";
import { THEME_LABELS } from "@/lib/themes";
import { MOCK_IMAGE_RESULTS } from "@/mocks/data";
import { LayerPanel } from "./LayerPanel";
import { FontManager } from "./FontManager";
import { ImageCropPreview } from "./ImageCropPreview";
import { OverlayDirectionGrid } from "./OverlayDirectionGrid";
import { StylePresetPanel } from "./StylePresetPanel";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useFontStore } from "@/store/useFontStore";
import { AUTO_LAYOUT_PRESETS, applyAutoLayout } from "@/lib/autoLayout";
import {
  Upload, Sparkles, Search, Image as ImageIcon,
  Type, Palette, LayoutTemplate, Layers, TypeIcon,
  AlignLeft, AlignCenter, AlignRight, Minus, Plus, Bold,
  LayoutGrid, X, Star, ChevronDown, ChevronRight, BookMarked
} from "lucide-react";

interface Props {
  slide: Slide;
  onUpdate: (updates: Partial<Slide>) => void;
  projectTheme: ThemePreset;
  selectedElement: ElementKey | null;
  onSelectElement: (key: ElementKey | null) => void;
  exportSize?: ExportSize;
}

const LAYOUT_OPTIONS: { value: LayoutType; label: string; desc: string }[] = [
  { value: "center-title", label: "중앙 제목", desc: "제목 중심" },
  { value: "title-body", label: "제목+본문", desc: "기본 레이아웃" },
  { value: "image-overlay", label: "이미지 오버레이", desc: "전체 이미지" },
  { value: "bullet-list", label: "목록", desc: "번호 리스트" },
  { value: "quote", label: "인용", desc: "인용문" },
  { value: "cta", label: "CTA", desc: "행동유도" },
];

const THEMES: ThemePreset[] = ["dark-minimal", "cyan-accent", "editorial-dark", "warm-neutral", "mono-contrast"];

const GRADIENT_PRESETS = [
  { value: "none", label: "없음" },
  { value: "dark-fade", label: "다크 페이드" },
  { value: "primary-glow", label: "프라이머리 글로우" },
  { value: "warm-sunset", label: "웜 선셋" },
  { value: "cool-ocean", label: "쿨 오션" },
  { value: "purple-haze", label: "퍼플 헤이즈" },
] as const;

type ImageTab = "upload" | "ai" | "search";

/* ── Collapsible Section ── */
function Section({ title, icon: Icon, defaultOpen = true, children, badge }: {
  title: string; icon: any; defaultOpen?: boolean; children: React.ReactNode; badge?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-surface hover:bg-muted/50 transition-colors">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[11px] font-semibold text-foreground flex-1 text-left">{title}</span>
        {badge && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">{badge}</span>}
        {open ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
      </button>
      {open && <div className="p-3 space-y-3 bg-card">{children}</div>}
    </div>
  );
}

export function SlideForm({ slide, onUpdate, projectTheme, selectedElement, onSelectElement, exportSize }: Props) {
  const [imageTab, setImageTab] = useState<ImageTab>("upload");
  const [aiPrompt, setAiPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const inputCls = "w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border";

  const typo = slide.typography || {};
  const colors = slide.colors || {};
  const vis = slide.visibility || {};
  const pos = slide.position || {};

  const updateTypo = (u: Partial<SlideTypography>) => onUpdate({ typography: { ...typo, ...u } });
  const updateColors = (u: Partial<SlideColors>) => onUpdate({ colors: { ...colors, ...u } });
  const updateVis = (u: Partial<SlideVisibility>) => onUpdate({ visibility: { ...vis, ...u } });
  const updatePos = (u: Partial<SlidePosition>) => onUpdate({ position: { ...pos, ...u } });
  const updateOverride = (key: ElementKey, u: Partial<ElementOverride>) => {
    const current = slide.elementOverrides || {};
    onUpdate({ elementOverrides: { ...current, [key]: { ...current[key], ...u } } });
  };
  const batchUpdateOverrides = (updates: Record<ElementKey, Partial<ElementOverride>>) => {
    const current = slide.elementOverrides || {};
    const merged = { ...current };
    for (const [key, u] of Object.entries(updates)) {
      merged[key as ElementKey] = { ...merged[key as ElementKey], ...u };
    }
    onUpdate({ elementOverrides: merged });
  };

  const updateImage = (u: Partial<SlideImage>) => {
    const currentImage = (slide.image || { mode: "upload", url: "" }) as SlideImage;
    const currentOverrides = slide.elementOverrides || {};
    const imageOverride = currentOverrides.image || {};
    onUpdate({
      image: { ...currentImage, ...u },
      elementOverrides: { ...currentOverrides, image: { ...imageOverride, hidden: false } },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateImage({ mode: "upload", url });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUpdate({ logo: { ...slide.logo, url, width: slide.logo?.width ?? 60 } as SlideLogo });
  };

  const handleAutoLayout = (preset: AutoLayoutPreset) => {
    const updates = applyAutoLayout(preset, slide);
    onUpdate(updates);
  };

  // Auto-restore image visibility when image section visible
  useEffect(() => {
    if (!slide.image?.url) return;
    if (slide.elementOverrides?.image?.hidden !== true) return;
    const currentOverrides = slide.elementOverrides || {};
    onUpdate({
      elementOverrides: { ...currentOverrides, image: { ...(currentOverrides.image || {}), hidden: false } },
    });
  }, [slide.image?.url, slide.elementOverrides?.image?.hidden]);

  const Range = ({ label, value, min, max, step, onChange, unit }: {
    label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] text-foreground tabular-nums">{parseFloat(value.toFixed(4))}{unit}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onChange(Math.max(min, +(value - step).toFixed(4)))} className="p-0.5 rounded hover:bg-surface text-muted-foreground"><Minus className="w-3 h-3" /></button>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="flex-1 accent-primary h-1" />
        <button onClick={() => onChange(Math.min(max, +(value + step).toFixed(4)))} className="p-0.5 rounded hover:bg-surface text-muted-foreground"><Plus className="w-3 h-3" /></button>
      </div>
    </div>
  );

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between py-1 cursor-pointer group">
      <span className="text-[11px] text-muted-foreground group-hover:text-foreground">{label}</span>
      <button onClick={() => onChange(!checked)} className={cn("w-8 h-4.5 rounded-full transition-colors relative", checked ? "bg-primary" : "bg-surface border border-border")}>
        <div className={cn("w-3.5 h-3.5 rounded-full bg-foreground absolute top-0.5 transition-transform", checked ? "translate-x-4" : "translate-x-0.5")} />
      </button>
    </label>
  );

  const ColorInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-6 h-6 rounded border border-border cursor-pointer bg-transparent" />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );

  const selectedOverride = selectedElement ? (slide.elementOverrides?.[selectedElement] || {}) : {};

  return (
    <div className="animate-fade-in space-y-2">

      {/* ═══ 1. TEXT FIELDS ═══ */}
      <Section title="텍스트" icon={Type} defaultOpen={true}>
        <div className="space-y-2">
          {vis.showCategory !== false && (
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">카테고리</label>
              <input value={slide.category || ""} onChange={e => onUpdate({ category: e.target.value })} placeholder="카테고리" className={cn(inputCls, "text-xs")} />
            </div>
          )}
          <div>
            <label className="text-[10px] text-muted-foreground block mb-1">제목</label>
            <input value={slide.title} onChange={e => onUpdate({ title: e.target.value })} placeholder="제목" className={cn(inputCls, "font-semibold")} />
          </div>
          {vis.showSubtitle !== false && (
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">부제목</label>
              <input value={slide.subtitle || ""} onChange={e => onUpdate({ subtitle: e.target.value })} placeholder="부제목" className={inputCls} />
            </div>
          )}
          {vis.showHighlight !== false && (
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">하이라이트</label>
              <input value={slide.highlight || ""} onChange={e => onUpdate({ highlight: e.target.value })} placeholder="하이라이트 배지" className={inputCls} />
            </div>
          )}
          {vis.showBody !== false && (
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">본문</label>
              <textarea value={slide.body || ""} onChange={e => onUpdate({ body: e.target.value })} placeholder="본문" rows={3} className={cn(inputCls, "resize-none")} />
            </div>
          )}
          {vis.showBullets !== false && (
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">목록 (줄바꿈 구분)</label>
              <textarea value={slide.bullets?.join("\n") || ""} onChange={e => onUpdate({ bullets: e.target.value.split("\n").filter(Boolean) })} placeholder="목록 항목" rows={2} className={cn(inputCls, "resize-none")} />
            </div>
          )}
          {vis.showCta !== false && (
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">CTA</label>
              <input value={slide.cta || ""} onChange={e => onUpdate({ cta: e.target.value })} placeholder="CTA 텍스트" className={inputCls} />
            </div>
          )}
          {vis.showSourceLabel !== false && (
            <div>
              <label className="text-[10px] text-muted-foreground block mb-1">출처</label>
              <input value={slide.sourceLabel || ""} onChange={e => onUpdate({ sourceLabel: e.target.value })} placeholder="출처" className={cn(inputCls, "text-xs")} />
            </div>
          )}
        </div>
      </Section>

      {/* ═══ 2. THEME + COLOR ═══ */}
      <Section title="색상 프리셋" icon={Palette} defaultOpen={true}>
        <div className="flex gap-1.5 flex-wrap">
          {THEMES.map(t => (
            <button key={t} onClick={() => onUpdate({ themePreset: t })}
              className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                slide.themePreset === t ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent"
              )}>{THEME_LABELS[t]}</button>
          ))}
        </div>
      </Section>

      {/* ═══ 2.5 STYLE PRESETS ═══ */}
      <Section title="스타일 프리셋" icon={BookMarked} defaultOpen={false}>
        <StylePresetPanel
          slide={slide}
          onApplyPreset={(updates) => {
            onUpdate({
              themePreset: updates.themePreset,
              ...(updates.typography && { typography: { ...typo, ...updates.typography } }),
              ...(updates.colors && { colors: { ...colors, ...updates.colors } }),
              ...(updates.position && { position: { ...pos, ...updates.position } }),
            });
          }}
        />
      </Section>

      {/* ═══ 3. LAYOUT ═══ */}
      <Section title="레이아웃" icon={LayoutTemplate} defaultOpen={true}>
        {/* 3x3 grid + Auto layouts side by side */}
        <div className="flex gap-3">
          {/* 3x3 alignment grid */}
          <div className="shrink-0">
            <span className="text-[10px] text-muted-foreground mb-1.5 block">콘텐츠 정렬</span>
            <div className="inline-grid grid-cols-3 gap-0.5 p-1 bg-surface rounded-lg border border-border">
              {(["start-left", "start-center", "start-right",
                "center-left", "center-center", "center-right",
                "end-left", "end-center", "end-right"] as const).map(combo => {
                const [vAlign, hAlign] = combo.split("-") as ["start" | "center" | "end", "left" | "center" | "right"];
                const isActive = (pos.contentAlign || "center") === vAlign && slide.textAlign === hAlign;
                return (
                  <button key={combo}
                    onClick={() => onUpdate({ textAlign: hAlign, position: { ...pos, contentAlign: vAlign } })}
                    className={cn("w-7 h-7 rounded flex items-center justify-center transition-all",
                      isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}>
                    <div className={cn("w-2 h-2 rounded-sm", isActive ? "bg-primary-foreground" : "bg-current")} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Auto layout presets */}
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground mb-1.5 block">오토 레이아웃</span>
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(AUTO_LAYOUT_PRESETS).filter(([k]) => k !== "none").map(([key, cfg]) => (
                <button key={key} onClick={() => handleAutoLayout(key as AutoLayoutPreset)}
                  title={cfg.description}
                  className={cn("py-1.5 px-1 rounded-md text-[9px] font-medium transition-all text-center leading-tight truncate",
                    slide.autoLayout === key ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent hover:border-border"
                  )}>
                  <span className="block text-xs mb-0.5">{cfg.icon}</span>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Layout type grid */}
        <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-border">
          {LAYOUT_OPTIONS.map(l => (
            <button key={l.value} onClick={() => onUpdate({ layoutType: l.value })}
              className={cn("py-2 rounded-lg text-[10px] font-medium transition-all text-center",
                slide.layoutType === l.value ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent"
              )}>{l.label}</button>
          ))}
        </div>
      </Section>

      {/* ═══ 4. IMAGE ═══ */}
      <Section title="이미지" icon={ImageIcon} defaultOpen={!!slide.image?.url}>
        <div className="flex gap-1 mb-2">
          {([
            { id: "upload" as ImageTab, label: "첨부 이미지", icon: Upload },
            { id: "ai" as ImageTab, label: "자동 이미지", icon: Sparkles },
            { id: "search" as ImageTab, label: "검색 이미지", icon: Search },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setImageTab(tab.id)}
              className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                imageTab === tab.id ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
              )}><tab.icon className="w-3 h-3" /> {tab.label}</button>
          ))}
        </div>

        {imageTab === "upload" && (
          <>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full py-5 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
              <ImageIcon className="w-5 h-5" /><span className="text-[10px]">클릭하여 이미지 업로드</span>
            </button>
          </>
        )}

        {imageTab === "ai" && (
          <div className="space-y-2">
            <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="이미지 프롬프트 입력" className={inputCls} />
            <button onClick={() => {
              const mockUrl = MOCK_IMAGE_RESULTS[Math.floor(Math.random() * MOCK_IMAGE_RESULTS.length)];
              updateImage({ mode: "generate", url: mockUrl, prompt: aiPrompt });
            }} className="w-full py-2 rounded-lg bg-primary/15 text-primary text-xs font-medium hover:bg-primary/25 transition-colors">
              AI 이미지 생성
            </button>
          </div>
        )}

        {imageTab === "search" && (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="검색어 입력" className={cn(inputCls, "flex-1")} />
              <button className="px-3 py-2 rounded-lg bg-surface text-xs text-foreground border border-border hover:bg-muted">
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {MOCK_IMAGE_RESULTS.map((url, i) => (
                <button key={i} onClick={() => updateImage({ mode: "search", url })}
                  className={cn("aspect-square rounded-lg overflow-hidden border-2 transition-all",
                    slide.image?.url === url ? "border-primary" : "border-transparent hover:border-muted-foreground/30"
                  )}><img src={url} alt="" className="w-full h-full object-cover" /></button>
              ))}
            </div>
          </div>
        )}

        {slide.image?.url && (
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">현재 이미지</span>
              <button onClick={() => onUpdate({ image: undefined })} className="text-[10px] text-destructive hover:underline flex items-center gap-0.5"><X className="w-3 h-3" /> 제거</button>
            </div>

            <ImageCropPreview image={slide.image} exportSize={exportSize} onUpdate={(updates) => updateImage(updates)} />

            {/* Position & Scale */}
            <Range label="X 위치" value={slide.image.posX ?? 0} min={-50} max={50} step={1} onChange={v => updateImage({ posX: v })} unit="%" />
            <Range label="Y 위치" value={slide.image.posY ?? 0} min={-50} max={50} step={1} onChange={v => updateImage({ posY: v })} unit="%" />
            <Range label="확대/축소" value={slide.image.scale ?? 1} min={0.5} max={2.5} step={0.05} onChange={v => updateImage({ scale: v })} unit="x" />

            {/* Overlay */}
            <div className="pt-2 border-t border-border space-y-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">오버레이</span>
              <Range label="투명도" value={slide.image.overlayOpacity ?? 0} min={0} max={1} step={0.05} onChange={v => updateImage({ overlayOpacity: v })} />
              {(slide.image.overlayOpacity ?? 0) > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">방향</span>
                    <OverlayDirectionGrid value={slide.image.overlayDirection ?? "center"} onChange={v => updateImage({ overlayDirection: v })} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">범위</span>
                      <span className="text-[10px] text-muted-foreground">{(slide.image.overlayRange ?? [0, 70])[0]}% – {(slide.image.overlayRange ?? [0, 70])[1]}%</span>
                    </div>
                    <Slider value={slide.image.overlayRange ?? [0, 70]} min={0} max={100} step={5} onValueChange={(v) => updateImage({ overlayRange: v as [number, number] })} className="w-full" />
                  </div>
                </>
              )}
            </div>

            {/* Blur */}
            <div className="pt-2 border-t border-border space-y-2">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">블러</span>
              <Range label="강도" value={slide.image.overlayBlur ?? 0} min={0} max={40} step={1} onChange={v => updateImage({ overlayBlur: v })} unit="px" />
              {(slide.image.overlayBlur ?? 0) > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">방향</span>
                    <OverlayDirectionGrid value={slide.image.overlayBlurDirection ?? "center"} onChange={v => updateImage({ overlayBlurDirection: v })} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">범위</span>
                      <span className="text-[10px] text-muted-foreground">{(slide.image.overlayBlurRange ?? [0, 30])[0]}% – {(slide.image.overlayBlurRange ?? [0, 30])[1]}%</span>
                    </div>
                    <Slider value={slide.image.overlayBlurRange ?? [0, 30]} min={0} max={100} step={5} onValueChange={(v) => updateImage({ overlayBlurRange: v as [number, number] })} className="w-full" />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ═══ 5. TEXT STYLE ═══ */}
      <Section title="텍스트 스타일" icon={Bold} defaultOpen={!!selectedElement}>
        {/* Dynamic typography — based on selected element */}
        {(() => {
          const el = selectedElement;
          if (!el || el === "image" || el === "logo") {
            return (
              <p className="text-[10px] text-muted-foreground text-center py-3">캔버스에서 요소를 선택하면 스타일을 편집할 수 있습니다</p>
            );
          }
          
          const sizeConfig: Record<string, { field: keyof SlideTypography; fallback: number; min: number; max: number }> = {
            title:       { field: "titleSize",       fallback: 28, min: 14, max: 80 },
            highlight:   { field: "highlightSize",   fallback: typo.bodySize ?? 16, min: 10, max: 80 },
            subtitle:    { field: "subtitleSize",     fallback: (typo.bodySize ?? 16) + 2, min: 10, max: 60 },
            category:    { field: "categorySize",     fallback: 12, min: 8, max: 48 },
            body:        { field: "bodySize",          fallback: 16, min: 8, max: 60 },
            bullets:     { field: "bulletSize",        fallback: (typo.bodySize ?? 16) - 1, min: 8, max: 48 },
            cta:         { field: "ctaSize",           fallback: typo.bodySize ?? 16, min: 10, max: 80 },
            sourceLabel: { field: "sourceLabelSize",   fallback: 11, min: 8, max: 36 },
          };

          const defaultLineHeight: Record<string, number> = {
            title: 1.3, highlight: 1.3, subtitle: 1.5, category: 1.3,
            body: 1.6, bullets: 1.6, cta: 1.4, sourceLabel: 1.4,
          };
          const defaultLetterSpacing: Record<string, number> = {
            title: 0, highlight: 0, subtitle: 0, category: 0.05,
            body: 0, bullets: 0, cta: 0, sourceLabel: 0,
          };

          const cfg = sizeConfig[el];
          const elOverride = slide.elementOverrides?.[el] || {};
          const isTitleLevel = el === "title" || el === "highlight";
          const hasBox = true; // All elements can have box styling

          return (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">{el}</span>
                <span className="text-[9px] text-muted-foreground">선택됨</span>
              </div>
              {/* Quick text align */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground mr-auto">정렬</span>
                {([
                  { value: "left" as TextAlign, icon: AlignLeft },
                  { value: "center" as TextAlign, icon: AlignCenter },
                  { value: "right" as TextAlign, icon: AlignRight },
                ] as const).map(a => (
                  <button key={a.value} onClick={() => onUpdate({ textAlign: a.value })}
                    className={cn("p-1.5 rounded-md transition-colors",
                      slide.textAlign === a.value ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-surface"
                    )}>
                    <a.icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
              {cfg && (
                <Range label="크기" value={(typo as any)[cfg.field] ?? cfg.fallback} min={cfg.min} max={cfg.max} step={1} onChange={v => updateTypo({ [cfg.field]: v })} unit="px" />
              )}
              {/* Per-element weight — step 1 for variable fonts */}
              <Range label="굵기" value={elOverride.fontWeight ?? (isTitleLevel ? (typo.titleWeight ?? 700) : (typo.bodyWeight ?? 400))} min={100} max={900} step={1} onChange={v => updateOverride(el, { fontWeight: v })} />
              {/* Per-element color */}
              <ColorInput label="색상" value={elOverride.color || colors.textColor || "#f0f6fc"} onChange={v => updateOverride(el, { color: v })} />
              {/* Per-element line height */}
              <Range label="줄간격" value={elOverride.lineHeight ?? defaultLineHeight[el] ?? 1.5} min={0.8} max={3.0} step={0.05} onChange={v => updateOverride(el, { lineHeight: v })} />
              {/* Per-element letter spacing */}
              <Range label="자간" value={elOverride.letterSpacing ?? defaultLetterSpacing[el] ?? 0} min={-0.1} max={0.3} step={0.01} onChange={v => updateOverride(el, { letterSpacing: v })} unit="em" />
              {/* Per-element box width */}
              <Range label="박스 폭" value={elOverride.boxWidth ?? 100} min={10} max={100} step={1} onChange={v => updateOverride(el, { boxWidth: v })} unit="%" />
              {/* Box controls for highlight & CTA */}
              {hasBox && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">박스</span>
                  <Range label="내부 여백" value={elOverride.boxPadding ?? (el === "cta" ? 10 : 4)} min={0} max={40} step={1} onChange={v => updateOverride(el, { boxPadding: v })} unit="px" />
                  <Range label="모서리" value={elOverride.boxRadius ?? (el === "cta" ? 999 : 4)} min={0} max={999} step={1} onChange={v => updateOverride(el, { boxRadius: v })} unit="px" />
                  <ColorInput label="배경색" value={elOverride.boxBg || colors.accentColor || "#39d2c0"} onChange={v => updateOverride(el, { boxBg: v })} />
                  <Range label="배경 투명도" value={elOverride.boxBgOpacity ?? 1} min={0} max={1} step={0.05} onChange={v => updateOverride(el, { boxBgOpacity: v })} />
                </div>
              )}
            </div>
          );
        })()}
        {/* Position */}
        <div className="space-y-2 pt-3 border-t border-border">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">여백</span>
          <Range label="좌우 여백" value={pos.contentPaddingX ?? 8} min={3} max={20} step={1} onChange={v => updatePos({ contentPaddingX: v })} unit="%" />
          <Range label="상하 여백" value={pos.contentPaddingY ?? 8} min={3} max={20} step={1} onChange={v => updatePos({ contentPaddingY: v })} unit="%" />
          <Range label="텍스트 박스 폭" value={pos.titleBoxWidth ?? 100} min={50} max={100} step={5} onChange={v => updatePos({ titleBoxWidth: v })} unit="%" />
        </div>
      </Section>

      {/* ═══ 6. ADVANCED COLOR (collapsed by default) ═══ */}
      <Section title="커스텀 색상" icon={Palette} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <ColorInput label="배경" value={colors.backgroundColor || "#0d1117"} onChange={v => updateColors({ backgroundColor: v })} />
          <ColorInput label="텍스트" value={colors.textColor || "#f0f6fc"} onChange={v => updateColors({ textColor: v })} />
          <ColorInput label="강조" value={colors.accentColor || "#39d2c0"} onChange={v => updateColors({ accentColor: v })} />
          <ColorInput label="하이라이트" value={colors.highlightBg || "#39d2c0"} onChange={v => updateColors({ highlightBg: v })} />
        </div>
        {/* Gradient */}
        <div className="pt-2 border-t border-border">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">그라디언트</span>
          <div className="grid grid-cols-3 gap-1.5">
            {GRADIENT_PRESETS.map(g => (
              <button key={g.value} onClick={() => updateColors({ gradientPreset: g.value })}
                className={cn("py-2 rounded-lg text-[10px] font-medium transition-all text-center",
                  (colors.gradientPreset || "none") === g.value ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent"
                )}>{g.label}</button>
            ))}
          </div>
        </div>

      </Section>

      {/* ═══ 7. LAYERS ═══ */}
      <Section title="레이어" icon={Layers} defaultOpen={true}>
        <LayerPanel
          slide={slide}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
          onUpdateOverride={updateOverride}
          onBatchUpdateOverrides={batchUpdateOverrides}
          onToggleVisibility={u => updateVis(u)}
        />
      </Section>

      {/* ═══ 9. LOGO (collapsed by default) ═══ */}
      <Section title="로고" icon={Star} defaultOpen={false}>
        <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        {!slide.logo?.url ? (
          <button onClick={() => logoInputRef.current?.click()}
            className="w-full py-4 rounded-lg border border-dashed border-border hover:border-primary/50 flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Star className="w-5 h-5" />
            <span className="text-[10px]">로고 이미지 업로드</span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded bg-surface border border-border flex items-center justify-center overflow-hidden">
                <img src={slide.logo.url} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <button onClick={() => logoInputRef.current?.click()} className="text-[10px] text-primary hover:underline">변경</button>
              <button onClick={() => onUpdate({ logo: undefined })} className="text-[10px] text-destructive hover:underline flex items-center gap-0.5">
                <X className="w-3 h-3" /> 제거
              </button>
            </div>
            <Range label="가로 크기" value={slide.logo.width ?? 60} min={20} max={500} step={5} onChange={v => onUpdate({ logo: { ...slide.logo!, width: v } })} unit="px" />
            <Range label="투명도" value={slide.logo.opacity ?? 1} min={0.1} max={1} step={0.05} onChange={v => onUpdate({ logo: { ...slide.logo!, opacity: v } })} />
            <Range label="여백" value={slide.logo.margin ?? 24} min={8} max={80} step={4} onChange={v => onUpdate({ logo: { ...slide.logo!, margin: v } })} unit="px" />
            <div>
              <span className="text-[10px] text-muted-foreground mb-1 block">위치</span>
              <div className="grid grid-cols-3 gap-1">
                {(["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"] as const).map(p => (
                  <button key={p} onClick={() => onUpdate({ logo: { ...slide.logo!, position: p } })}
                    className={cn("py-1.5 rounded text-[9px] font-medium",
                      (slide.logo?.position || "top-left") === p ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
                    )}>
                    {p === "top-left" ? "↖ 좌상" : p === "top-center" ? "↑ 상단" : p === "top-right" ? "↗ 우상" :
                     p === "bottom-left" ? "↙ 좌하" : p === "bottom-center" ? "↓ 하단" : "↘ 우하"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}
