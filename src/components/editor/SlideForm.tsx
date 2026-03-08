import { useState, useRef, useEffect } from "react";
import type { Slide, SlideType, LayoutType, TextAlign, ThemePreset, SlideImage, SlideLogo, SlideTypography, SlideColors, SlideVisibility, SlidePosition, ElementKey, ElementOverride, AutoLayoutPreset, ExportSize, OverlayDirection } from "@/types/project";
import { THEME_LABELS } from "@/lib/themes";
import { MOCK_IMAGE_RESULTS } from "@/mocks/data";
import { LayerPanel } from "./LayerPanel";
import { FontManager } from "./FontManager";
import { ImageCropPreview } from "./ImageCropPreview";
import { OverlayDirectionGrid } from "./OverlayDirectionGrid";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { useFontStore } from "@/store/useFontStore";
import { AUTO_LAYOUT_PRESETS, applyAutoLayout } from "@/lib/autoLayout";
import {
  Upload, Sparkles, Search, Image as ImageIcon,
  Type, Palette, LayoutTemplate, Layers, TypeIcon,
  AlignLeft, AlignCenter, AlignRight, Minus, Plus, Bold,
  LayoutGrid, X, Star
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

type EditorTab = "text" | "style" | "layout" | "image" | "layers" | "font";
type ImageTab = "upload" | "ai" | "search";

export function SlideForm({ slide, onUpdate, projectTheme, selectedElement, onSelectElement, exportSize }: Props) {
  const [editorTab, setEditorTab] = useState<EditorTab>("text");
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
      elementOverrides: {
        ...currentOverrides,
        image: { ...imageOverride, hidden: false },
      },
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

  // Auto-switch to element inspector when element selected
  useEffect(() => {
    if (selectedElement) {
      if (selectedElement === "image") setEditorTab("image");
      else if (["title", "subtitle", "body", "category", "highlight", "cta", "sourceLabel", "bullets"].includes(selectedElement)) {
        // Stay on current tab if it's relevant
        if (!["text", "style"].includes(editorTab)) setEditorTab("text");
      }
    }
  }, [selectedElement]);

  useEffect(() => {
    if (editorTab !== "image") return;
    if (!slide.image?.url) return;
    if (slide.elementOverrides?.image?.hidden !== true) return;

    const currentOverrides = slide.elementOverrides || {};
    onUpdate({
      elementOverrides: {
        ...currentOverrides,
        image: {
          ...(currentOverrides.image || {}),
          hidden: false,
        },
      },
    });
  }, [editorTab, slide.image?.url, slide.elementOverrides?.image?.hidden, slide.elementOverrides, onUpdate]);

  const TABS: { id: EditorTab; label: string; icon: any }[] = [
    { id: "text", label: "텍스트", icon: Type },
    { id: "style", label: "스타일", icon: Palette },
    { id: "layout", label: "레이아웃", icon: LayoutTemplate },
    { id: "image", label: "이미지", icon: ImageIcon },
    { id: "layers", label: "레이어", icon: Layers },
    { id: "font", label: "폰트", icon: TypeIcon },
  ];

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
    <div className="animate-fade-in">
      {/* Tab bar — sticky */}
      <div className="flex gap-0.5 mb-3 p-0.5 bg-surface rounded-lg flex-wrap sticky top-0 z-10">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setEditorTab(tab.id)}
            className={cn("flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-medium transition-all flex-1 justify-center min-w-0",
              editorTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}>
            <tab.icon className="w-3 h-3 shrink-0" /> <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TEXT TAB */}
      {editorTab === "text" && (
        <div className="space-y-3">
          <div className="p-3 bg-surface rounded-lg space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1 block">요소 표시</span>
            <Toggle label="카테고리" checked={vis.showCategory !== false} onChange={v => updateVis({ showCategory: v })} />
            <Toggle label="부제목" checked={vis.showSubtitle !== false} onChange={v => updateVis({ showSubtitle: v })} />
            <Toggle label="하이라이트" checked={vis.showHighlight !== false} onChange={v => updateVis({ showHighlight: v })} />
            <Toggle label="본문" checked={vis.showBody !== false} onChange={v => updateVis({ showBody: v })} />
            <Toggle label="목록" checked={vis.showBullets !== false} onChange={v => updateVis({ showBullets: v })} />
            <Toggle label="CTA" checked={vis.showCta !== false} onChange={v => updateVis({ showCta: v })} />
            <Toggle label="출처" checked={vis.showSourceLabel !== false} onChange={v => updateVis({ showSourceLabel: v })} />
          </div>
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
                <label className="text-[10px] text-muted-foreground block mb-1">하이라이트 배지</label>
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
        </div>
      )}

      {/* STYLE TAB (Typography + Colors + Text Box) */}
      {editorTab === "style" && (
        <div className="space-y-4">
          {/* Text align */}
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">정렬</span>
            <div className="flex gap-1">
              {([{ value: "left" as TextAlign, icon: AlignLeft }, { value: "center" as TextAlign, icon: AlignCenter }, { value: "right" as TextAlign, icon: AlignRight }]).map(a => (
                <button key={a.value} onClick={() => onUpdate({ textAlign: a.value })}
                  className={cn("flex-1 py-2 rounded-lg flex items-center justify-center transition-all",
                    slide.textAlign === a.value ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
                  )}><a.icon className="w-4 h-4" /></button>
              ))}
            </div>
          </div>

          {/* Title typography */}
          <div className="p-3 bg-surface rounded-lg space-y-2.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">제목 타이포</span>
            <Range label="크기" value={typo.titleSize ?? 28} min={14} max={60} step={1} onChange={v => updateTypo({ titleSize: v })} unit="px" />
            <Range label="굵기" value={typo.titleWeight ?? 700} min={300} max={900} step={100} onChange={v => updateTypo({ titleWeight: v })} />
            <Range label="줄간격" value={typo.titleLineHeight ?? 1.3} min={0.8} max={2.0} step={0.05} onChange={v => updateTypo({ titleLineHeight: v })} />
            <Range label="자간" value={typo.titleLetterSpacing ?? 0} min={-0.1} max={0.2} step={0.01} onChange={v => updateTypo({ titleLetterSpacing: v })} unit="em" />
          </div>

          {/* Body typography */}
          <div className="p-3 bg-surface rounded-lg space-y-2.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">본문 타이포</span>
            <Range label="크기" value={typo.bodySize ?? 16} min={10} max={32} step={1} onChange={v => updateTypo({ bodySize: v })} unit="px" />
            <Range label="굵기" value={typo.bodyWeight ?? 400} min={300} max={700} step={100} onChange={v => updateTypo({ bodyWeight: v })} />
            <Range label="줄간격" value={typo.bodyLineHeight ?? 1.6} min={1.0} max={2.5} step={0.05} onChange={v => updateTypo({ bodyLineHeight: v })} />
            <Range label="자간" value={typo.bodyLetterSpacing ?? 0} min={-0.05} max={0.15} step={0.01} onChange={v => updateTypo({ bodyLetterSpacing: v })} unit="em" />
          </div>

          {/* Position */}
          <div className="p-3 bg-surface rounded-lg space-y-2.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">위치/크기</span>
            <Range label="좌우 여백" value={pos.contentPaddingX ?? 8} min={3} max={20} step={1} onChange={v => updatePos({ contentPaddingX: v })} unit="%" />
            <Range label="상하 여백" value={pos.contentPaddingY ?? 8} min={3} max={20} step={1} onChange={v => updatePos({ contentPaddingY: v })} unit="%" />
            <Range label="텍스트 박스 폭" value={pos.titleBoxWidth ?? 100} min={50} max={100} step={5} onChange={v => updatePos({ titleBoxWidth: v })} unit="%" />
            <div>
              <span className="text-[10px] text-muted-foreground mb-1 block">세로 정렬</span>
              <div className="flex gap-1">
                {(["start", "center", "end"] as const).map(a => (
                  <button key={a} onClick={() => updatePos({ contentAlign: a })}
                    className={cn("flex-1 py-1.5 rounded-lg text-[10px] font-medium",
                      (pos.contentAlign || "center") === a ? "bg-primary/20 text-primary" : "bg-card text-muted-foreground"
                    )}>{a === "start" ? "상단" : a === "center" ? "중앙" : "하단"}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected element text box */}
          {selectedElement && selectedElement !== "image" && (
            <div className="p-3 bg-surface rounded-lg space-y-2.5 border border-primary/20">
              <span className="text-[10px] text-primary uppercase tracking-wider font-semibold block">
                {selectedElement} 텍스트 박스
              </span>
              <ColorInput label="배경색" value={selectedOverride.boxBg || "#000000"} onChange={v => updateOverride(selectedElement, { boxBg: v })} />
              <Range label="배경 투명도" value={selectedOverride.boxBgOpacity ?? 0} min={0} max={1} step={0.05} onChange={v => updateOverride(selectedElement, { boxBgOpacity: v })} />
              <Range label="안쪽 여백" value={selectedOverride.boxPadding ?? 0} min={0} max={30} step={1} onChange={v => updateOverride(selectedElement, { boxPadding: v })} unit="px" />
              <Range label="둥글기" value={selectedOverride.boxRadius ?? 0} min={0} max={24} step={1} onChange={v => updateOverride(selectedElement, { boxRadius: v })} unit="px" />
              <Range label="X 오프셋" value={selectedOverride.offsetX ?? 0} min={-50} max={50} step={1} onChange={v => updateOverride(selectedElement, { offsetX: v })} unit="px" />
              <Range label="Y 오프셋" value={selectedOverride.offsetY ?? 0} min={-50} max={50} step={1} onChange={v => updateOverride(selectedElement, { offsetY: v })} unit="px" />
            </div>
          )}

          {/* Theme preset */}
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">테마</span>
            <div className="flex gap-1.5 flex-wrap">
              {THEMES.map(t => (
                <button key={t} onClick={() => onUpdate({ themePreset: t })}
                  className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                    slide.themePreset === t ? "bg-primary/20 text-primary border border-primary/40" : "bg-surface text-muted-foreground border border-transparent"
                  )}>{THEME_LABELS[t]}</button>
              ))}
            </div>
          </div>

          {/* Custom colors */}
          <div className="p-3 bg-surface rounded-lg space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">커스텀 색상</span>
            <div className="grid grid-cols-2 gap-3">
              <ColorInput label="배경" value={colors.backgroundColor || "#0d1117"} onChange={v => updateColors({ backgroundColor: v })} />
              <ColorInput label="텍스트" value={colors.textColor || "#f0f6fc"} onChange={v => updateColors({ textColor: v })} />
              <ColorInput label="강조" value={colors.accentColor || "#39d2c0"} onChange={v => updateColors({ accentColor: v })} />
              <ColorInput label="하이라이트" value={colors.highlightBg || "#39d2c0"} onChange={v => updateColors({ highlightBg: v })} />
            </div>
          </div>

          {/* Gradient */}
          <div>
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

          {/* Container style */}
          <div className="p-3 bg-surface rounded-lg space-y-2.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">컨테이너</span>
            <Range label="둥글기" value={colors.containerRadius ?? 0} min={0} max={32} step={2} onChange={v => updateColors({ containerRadius: v })} unit="px" />
            <Range label="그림자" value={colors.shadowIntensity ?? 0} min={0} max={1} step={0.1} onChange={v => updateColors({ shadowIntensity: v })} />
            <Toggle label="테두리" checked={colors.borderEnabled ?? false} onChange={v => updateColors({ borderEnabled: v })} />
          </div>
        </div>
      )}

      {/* LAYOUT TAB */}
      {editorTab === "layout" && (
        <div className="space-y-4">
          {/* Auto Layout */}
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">오토 레이아웃</span>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.entries(AUTO_LAYOUT_PRESETS) as [AutoLayoutPreset, typeof AUTO_LAYOUT_PRESETS[AutoLayoutPreset]][]).map(([key, config]) => (
                <button key={key} onClick={() => handleAutoLayout(key)}
                  className={cn("p-2.5 rounded-lg text-left transition-all border",
                    (slide.autoLayout || "none") === key ? "bg-primary/10 border-primary/40" : "bg-surface border-transparent hover:border-border"
                  )}>
                  <span className="text-[12px] mr-1">{config.icon}</span>
                  <span className="text-[10px] font-medium text-foreground">{config.label}</span>
                  <span className="text-[8px] text-muted-foreground block mt-0.5">{config.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Layout */}
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">레이아웃 타입</span>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUT_OPTIONS.map(l => (
                <button key={l.value} onClick={() => onUpdate({ layoutType: l.value })}
                  className={cn("p-3 rounded-lg text-left transition-all border",
                    slide.layoutType === l.value ? "bg-primary/10 border-primary/40" : "bg-surface border-transparent hover:border-border"
                  )}>
                  <span className="text-[11px] font-medium text-foreground block">{l.label}</span>
                  <span className="text-[9px] text-muted-foreground">{l.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">슬라이드 유형</span>
            <div className="flex gap-1 flex-wrap">
              {(["cover", "summary", "detail", "list", "quote", "cta"] as SlideType[]).map(t => (
                <button key={t} onClick={() => onUpdate({ type: t })}
                  className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                    slide.type === t ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
                  )}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* IMAGE TAB */}
      {editorTab === "image" && (
        <div className="space-y-3">
          <div className="flex gap-1">
            {([
              { id: "upload" as ImageTab, label: "첨부", icon: Upload },
              { id: "ai" as ImageTab, label: "AI 생성", icon: Sparkles },
              { id: "search" as ImageTab, label: "검색", icon: Search },
            ]).map(tab => (
              <button key={tab.id} onClick={() => setImageTab(tab.id)}
                className={cn("flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                  imageTab === tab.id ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
                )}><tab.icon className="w-3 h-3" /> {tab.label}</button>
            ))}
          </div>

          {imageTab === "upload" && (
            <>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <ImageIcon className="w-6 h-6" /><span className="text-[10px]">클릭하여 이미지 업로드</span>
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
                AI 이미지 생성 (Mock)
              </button>
            </div>
          )}

          {imageTab === "search" && (
            <div className="space-y-2">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="검색어 입력" className={inputCls} />
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">현재 이미지</span>
                <button onClick={() => onUpdate({ image: undefined })} className="text-[10px] text-destructive hover:underline">제거</button>
              </div>

              {/* Visual crop/viewport tool */}
              <ImageCropPreview
                image={slide.image}
                exportSize={exportSize}
                onUpdate={(updates) => updateImage(updates)}
              />

              {/* Position & Scale */}
              <div className="p-3 bg-surface rounded-lg space-y-2.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">위치 / 크기</span>
                <Range label="X 위치" value={slide.image.posX ?? 0} min={-50} max={50} step={1} onChange={v => updateImage({ posX: v })} unit="%" />
                <Range label="Y 위치" value={slide.image.posY ?? 0} min={-50} max={50} step={1} onChange={v => updateImage({ posY: v })} unit="%" />
                <Range label="확대/축소" value={slide.image.scale ?? 1} min={0.5} max={2.5} step={0.05} onChange={v => updateImage({ scale: v })} unit="x" />
              </div>

              {/* Overlay */}
              <div className="p-3 bg-surface rounded-lg space-y-2.5">
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
                      <Slider
                        value={slide.image.overlayRange ?? [0, 70]}
                        min={0}
                        max={100}
                        step={5}
                        onValueChange={(v) => updateImage({ overlayRange: v as [number, number] })}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Blur */}
              <div className="p-3 bg-surface rounded-lg space-y-2.5">
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
                      <Slider
                        value={slide.image.overlayBlurRange ?? [0, 30]}
                        min={0}
                        max={100}
                        step={5}
                        onValueChange={(v) => updateImage({ overlayBlurRange: v as [number, number] })}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Filters */}
              <div className="p-3 bg-surface rounded-lg space-y-2.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">필터 효과</span>
                <Range label="밝기" value={slide.image.brightness ?? 1} min={0.3} max={2} step={0.05} onChange={v => updateImage({ brightness: v })} />
                <Range label="대비" value={slide.image.contrast ?? 1} min={0.3} max={2} step={0.05} onChange={v => updateImage({ contrast: v })} />
                <Range label="채도" value={slide.image.saturate ?? 1} min={0} max={3} step={0.05} onChange={v => updateImage({ saturate: v })} />
                
                <Range label="흑백" value={slide.image.grayscale ?? 0} min={0} max={1} step={0.05} onChange={v => updateImage({ grayscale: v })} />
                <Range label="세피아" value={slide.image.sepia ?? 0} min={0} max={1} step={0.05} onChange={v => updateImage({ sepia: v })} />
                <Range label="색조 회전" value={slide.image.hueRotate ?? 0} min={0} max={360} step={5} onChange={v => updateImage({ hueRotate: v })} unit="°" />
                {/* Reset button */}
                <button onClick={() => updateImage({ brightness: 1, contrast: 1, saturate: 1, blur: 0, grayscale: 0, sepia: 0, hueRotate: 0 })}
                  className="w-full py-1.5 rounded-lg text-[10px] text-muted-foreground hover:text-foreground bg-card hover:bg-muted border border-border transition-colors">
                  필터 초기화
                </button>
              </div>
            </div>
          )}

          {/* Logo section */}
          <div className="p-3 bg-surface rounded-lg space-y-2.5 border border-border">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">로고</span>
              {slide.logo?.url && (
                <button onClick={() => onUpdate({ logo: undefined })} className="text-[10px] text-destructive hover:underline flex items-center gap-0.5">
                  <X className="w-3 h-3" /> 제거
                </button>
              )}
            </div>
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
                  <div className="w-10 h-10 rounded bg-card border border-border flex items-center justify-center overflow-hidden">
                    <img src={slide.logo.url} alt="Logo" className="max-w-full max-h-full object-contain" />
                  </div>
                  <button onClick={() => logoInputRef.current?.click()} className="text-[10px] text-primary hover:underline">변경</button>
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
                          (slide.logo?.position || "top-left") === p ? "bg-primary/20 text-primary" : "bg-card text-muted-foreground"
                        )}>
                        {p === "top-left" ? "↖ 좌상" : p === "top-center" ? "↑ 상단" : p === "top-right" ? "↗ 우상" :
                         p === "bottom-left" ? "↙ 좌하" : p === "bottom-center" ? "↓ 하단" : "↘ 우하"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LAYERS TAB */}
      {editorTab === "layers" && (
        <LayerPanel
          slide={slide}
          selectedElement={selectedElement}
          onSelectElement={onSelectElement}
          onUpdateOverride={updateOverride}
        />
      )}

      {/* FONT TAB */}
      {editorTab === "font" && (
        <FontManager
          titleFont={typo.titleFontFamily}
          bodyFont={typo.bodyFontFamily}
          onSetTitleFont={f => updateTypo({ titleFontFamily: f })}
          onSetBodyFont={f => updateTypo({ bodyFontFamily: f })}
        />
      )}
    </div>
  );
}
