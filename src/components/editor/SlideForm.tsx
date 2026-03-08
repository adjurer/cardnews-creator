import { useState, useRef } from "react";
import type { Slide, SlideType, LayoutType, TextAlign, ThemePreset, SlideImage, SlideTypography, SlideColors, SlideVisibility, SlidePosition } from "@/types/project";
import { THEME_LABELS } from "@/lib/themes";
import { MOCK_IMAGE_RESULTS } from "@/mocks/data";
import { cn } from "@/lib/utils";
import {
  Upload, Sparkles, Search, Image as ImageIcon, ChevronDown,
  Type, Palette, LayoutTemplate, Eye, Move, AlignLeft, AlignCenter, AlignRight,
  Bold, Minus, Plus
} from "lucide-react";

interface Props {
  slide: Slide;
  onUpdate: (updates: Partial<Slide>) => void;
  projectTheme: ThemePreset;
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

type EditorTab = "text" | "typography" | "colors" | "layout" | "image";

type ImageTab = "upload" | "ai" | "search";

export function SlideForm({ slide, onUpdate, projectTheme }: Props) {
  const [editorTab, setEditorTab] = useState<EditorTab>("text");
  const [imageTab, setImageTab] = useState<ImageTab>("upload");
  const [aiPrompt, setAiPrompt] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputCls = "w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border";

  const updateTypo = (updates: Partial<SlideTypography>) =>
    onUpdate({ typography: { ...slide.typography, ...updates } });
  const updateColors = (updates: Partial<SlideColors>) =>
    onUpdate({ colors: { ...slide.colors, ...updates } });
  const updateVis = (updates: Partial<SlideVisibility>) =>
    onUpdate({ visibility: { ...slide.visibility, ...updates } });
  const updatePos = (updates: Partial<SlidePosition>) =>
    onUpdate({ position: { ...slide.position, ...updates } });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onUpdate({ image: { ...slide.image, mode: "upload", url } as SlideImage });
  };

  const typo = slide.typography || {};
  const colors = slide.colors || {};
  const vis = slide.visibility || {};
  const pos = slide.position || {};

  const TABS: { id: EditorTab; label: string; icon: any }[] = [
    { id: "text", label: "텍스트", icon: Type },
    { id: "typography", label: "타이포", icon: Bold },
    { id: "colors", label: "색상", icon: Palette },
    { id: "layout", label: "레이아웃", icon: LayoutTemplate },
    { id: "image", label: "이미지", icon: ImageIcon },
  ];

  const RangeControl = ({ label, value, min, max, step, onChange, unit }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; unit?: string;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] text-foreground tabular-nums">{value}{unit}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button onClick={() => onChange(Math.max(min, value - step))}
          className="p-0.5 rounded hover:bg-surface text-muted-foreground"><Minus className="w-3 h-3" /></button>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-primary h-1" />
        <button onClick={() => onChange(Math.min(max, value + step))}
          className="p-0.5 rounded hover:bg-surface text-muted-foreground"><Plus className="w-3 h-3" /></button>
      </div>
    </div>
  );

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="flex items-center justify-between py-1 cursor-pointer group">
      <span className="text-[11px] text-muted-foreground group-hover:text-foreground">{label}</span>
      <button onClick={() => onChange(!checked)}
        className={cn("w-8 h-4.5 rounded-full transition-colors relative", checked ? "bg-primary" : "bg-surface border border-border")}>
        <div className={cn("w-3.5 h-3.5 rounded-full bg-foreground absolute top-0.5 transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5")} />
      </button>
    </label>
  );

  const ColorInput = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-6 h-6 rounded border border-border cursor-pointer bg-transparent" />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Tab bar */}
      <div className="flex gap-0.5 mb-3 p-0.5 bg-surface rounded-lg">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setEditorTab(tab.id)}
            className={cn("flex items-center gap-1 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all flex-1 justify-center",
              editorTab === tab.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}>
            <tab.icon className="w-3 h-3" /> {tab.label}
          </button>
        ))}
      </div>

      {/* TEXT TAB */}
      {editorTab === "text" && (
        <div className="space-y-3">
          {/* Visibility toggles */}
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

          {/* Text fields */}
          <div className="space-y-2">
            {vis.showCategory !== false && (
              <input value={slide.category || ""} onChange={e => onUpdate({ category: e.target.value })} placeholder="카테고리" className={cn(inputCls, "text-xs")} />
            )}
            <input value={slide.title} onChange={e => onUpdate({ title: e.target.value })} placeholder="제목" className={cn(inputCls, "font-semibold")} />
            {vis.showSubtitle !== false && (
              <input value={slide.subtitle || ""} onChange={e => onUpdate({ subtitle: e.target.value })} placeholder="부제목" className={inputCls} />
            )}
            {vis.showHighlight !== false && (
              <input value={slide.highlight || ""} onChange={e => onUpdate({ highlight: e.target.value })} placeholder="하이라이트 배지" className={inputCls} />
            )}
            {vis.showBody !== false && (
              <textarea value={slide.body || ""} onChange={e => onUpdate({ body: e.target.value })} placeholder="본문" rows={3} className={cn(inputCls, "resize-none")} />
            )}
            {vis.showBullets !== false && (
              <textarea
                value={slide.bullets?.join("\n") || ""}
                onChange={e => onUpdate({ bullets: e.target.value.split("\n").filter(Boolean) })}
                placeholder="목록 항목 (줄바꿈으로 구분)" rows={2} className={cn(inputCls, "resize-none")}
              />
            )}
            {vis.showCta !== false && (
              <input value={slide.cta || ""} onChange={e => onUpdate({ cta: e.target.value })} placeholder="CTA 텍스트" className={inputCls} />
            )}
            {vis.showSourceLabel !== false && (
              <input value={slide.sourceLabel || ""} onChange={e => onUpdate({ sourceLabel: e.target.value })} placeholder="출처" className={cn(inputCls, "text-xs")} />
            )}
          </div>
        </div>
      )}

      {/* TYPOGRAPHY TAB */}
      {editorTab === "typography" && (
        <div className="space-y-4">
          {/* Text align */}
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">정렬</span>
            <div className="flex gap-1">
              {([
                { value: "left" as TextAlign, icon: AlignLeft },
                { value: "center" as TextAlign, icon: AlignCenter },
                { value: "right" as TextAlign, icon: AlignRight },
              ]).map(a => (
                <button key={a.value} onClick={() => onUpdate({ textAlign: a.value })}
                  className={cn("flex-1 py-2 rounded-lg flex items-center justify-center transition-all",
                    slide.textAlign === a.value ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground"
                  )}>
                  <a.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Title typography */}
          <div className="p-3 bg-surface rounded-lg space-y-2.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">제목</span>
            <RangeControl label="크기" value={typo.titleSize ?? 28} min={14} max={60} step={1} onChange={v => updateTypo({ titleSize: v })} unit="px" />
            <RangeControl label="굵기" value={typo.titleWeight ?? 700} min={300} max={900} step={100} onChange={v => updateTypo({ titleWeight: v })} />
            <RangeControl label="줄간격" value={typo.titleLineHeight ?? 1.3} min={0.8} max={2.0} step={0.05} onChange={v => updateTypo({ titleLineHeight: v })} />
            <RangeControl label="자간" value={typo.titleLetterSpacing ?? 0} min={-0.1} max={0.2} step={0.01} onChange={v => updateTypo({ titleLetterSpacing: v })} unit="em" />
          </div>

          {/* Body typography */}
          <div className="p-3 bg-surface rounded-lg space-y-2.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">본문</span>
            <RangeControl label="크기" value={typo.bodySize ?? 16} min={10} max={32} step={1} onChange={v => updateTypo({ bodySize: v })} unit="px" />
            <RangeControl label="굵기" value={typo.bodyWeight ?? 400} min={300} max={700} step={100} onChange={v => updateTypo({ bodyWeight: v })} />
            <RangeControl label="줄간격" value={typo.bodyLineHeight ?? 1.6} min={1.0} max={2.5} step={0.05} onChange={v => updateTypo({ bodyLineHeight: v })} />
            <RangeControl label="자간" value={typo.bodyLetterSpacing ?? 0} min={-0.05} max={0.15} step={0.01} onChange={v => updateTypo({ bodyLetterSpacing: v })} unit="em" />
          </div>

          {/* Position */}
          <div className="p-3 bg-surface rounded-lg space-y-2.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">위치/크기</span>
            <RangeControl label="좌우 여백" value={pos.contentPaddingX ?? 8} min={3} max={20} step={1} onChange={v => updatePos({ contentPaddingX: v })} unit="%" />
            <RangeControl label="상하 여백" value={pos.contentPaddingY ?? 8} min={3} max={20} step={1} onChange={v => updatePos({ contentPaddingY: v })} unit="%" />
            <RangeControl label="텍스트 박스 폭" value={pos.titleBoxWidth ?? 100} min={50} max={100} step={5} onChange={v => updatePos({ titleBoxWidth: v })} unit="%" />
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
        </div>
      )}

      {/* COLORS TAB */}
      {editorTab === "colors" && (
        <div className="space-y-4">
          {/* Theme preset */}
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">테마 프리셋</span>
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
              <ColorInput label="하이라이트 배경" value={colors.highlightBg || "#39d2c0"} onChange={v => updateColors({ highlightBg: v })} />
            </div>
          </div>

          {/* Gradient */}
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">그라디언트</span>
            <div className="grid grid-cols-3 gap-1.5">
              {GRADIENT_PRESETS.map(g => (
                <button key={g.value} onClick={() => updateColors({ gradientPreset: g.value })}
                  className={cn("py-2 rounded-lg text-[10px] font-medium transition-all text-center",
                    (colors.gradientPreset || "none") === g.value
                      ? "bg-primary/20 text-primary border border-primary/40"
                      : "bg-surface text-muted-foreground border border-transparent"
                  )}>{g.label}</button>
              ))}
            </div>
          </div>

          {/* Style controls */}
          <div className="p-3 bg-surface rounded-lg space-y-2.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">스타일</span>
            <RangeControl label="컨테이너 둥글기" value={colors.containerRadius ?? 0} min={0} max={32} step={2} onChange={v => updateColors({ containerRadius: v })} unit="px" />
            <RangeControl label="그림자 강도" value={colors.shadowIntensity ?? 0} min={0} max={1} step={0.1} onChange={v => updateColors({ shadowIntensity: v })} />
            <Toggle label="테두리" checked={colors.borderEnabled ?? false} onChange={v => updateColors({ borderEnabled: v })} />
          </div>
        </div>
      )}

      {/* LAYOUT TAB */}
      {editorTab === "layout" && (
        <div className="space-y-4">
          <div>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 block">레이아웃 선택</span>
            <div className="grid grid-cols-2 gap-2">
              {LAYOUT_OPTIONS.map(l => (
                <button key={l.value} onClick={() => onUpdate({ layoutType: l.value })}
                  className={cn("p-3 rounded-lg text-left transition-all border",
                    slide.layoutType === l.value
                      ? "bg-primary/10 border-primary/40"
                      : "bg-surface border-transparent hover:border-border"
                  )}>
                  <span className="text-[11px] font-medium text-foreground block">{l.label}</span>
                  <span className="text-[9px] text-muted-foreground">{l.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Slide type */}
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">현재 이미지</span>
                <button onClick={() => onUpdate({ image: undefined })} className="text-[10px] text-destructive hover:underline">제거</button>
              </div>
              <div className="w-full h-16 rounded-lg overflow-hidden">
                <img src={slide.image.url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-3 bg-surface rounded-lg space-y-2.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">이미지 조절</span>
                <RangeControl label="X 위치" value={slide.image.posX ?? 0} min={-50} max={50} step={1} onChange={v => onUpdate({ image: { ...slide.image!, posX: v } })} unit="%" />
                <RangeControl label="Y 위치" value={slide.image.posY ?? 0} min={-50} max={50} step={1} onChange={v => onUpdate({ image: { ...slide.image!, posY: v } })} unit="%" />
                <RangeControl label="확대/축소" value={slide.image.scale ?? 1} min={0.5} max={2.5} step={0.05} onChange={v => onUpdate({ image: { ...slide.image!, scale: v } })} unit="x" />
                <RangeControl label="오버레이" value={slide.image.overlayOpacity ?? 0.5} min={0} max={1} step={0.05} onChange={v => onUpdate({ image: { ...slide.image!, overlayOpacity: v } })} />
                <RangeControl label="블러" value={slide.image.blur ?? 0} min={0} max={20} step={1} onChange={v => onUpdate({ image: { ...slide.image!, blur: v } })} unit="px" />
                <RangeControl label="밝기" value={slide.image.brightness ?? 1} min={0.3} max={1.5} step={0.05} onChange={v => onUpdate({ image: { ...slide.image!, brightness: v } })} />
                <RangeControl label="둥글기" value={slide.image.borderRadius ?? 0} min={0} max={32} step={1} onChange={v => onUpdate({ image: { ...slide.image!, borderRadius: v } })} unit="px" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
