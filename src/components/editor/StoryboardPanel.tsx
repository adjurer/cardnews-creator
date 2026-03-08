import { useState } from "react";
import {
  Film, Loader2, Play, Clock, Music, Sparkles, ChevronDown, ChevronUp,
  ArrowRight, Type, Eye, Volume2, X, Clapperboard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Slide, Storyboard, StoryboardScene, MotionType, TransitionType } from "@/types/project";

interface Props {
  projectTitle: string;
  slides: Slide[];
  onClose: () => void;
}

const MOTION_LABELS: Record<MotionType, string> = {
  "fade-in": "페이드 인",
  "zoom-in": "줌 인",
  "zoom-out": "줌 아웃",
  "slide-left": "왼쪽 슬라이드",
  "slide-right": "오른쪽 슬라이드",
  "slide-up": "위로 슬라이드",
  "ken-burns": "켄 번스",
  "bounce-in": "바운스 인",
  "typewriter": "타이프라이터",
  "split-reveal": "분할 등장",
  "none": "없음",
};

const TRANSITION_LABELS: Record<TransitionType, string> = {
  "cut": "컷",
  "crossfade": "크로스페이드",
  "wipe-left": "와이프 좌",
  "wipe-up": "와이프 상",
  "zoom-transition": "줌 전환",
  "morph": "모프",
  "glitch": "글리치",
  "none": "없음",
};

const MOTION_COLORS: Record<string, string> = {
  "fade-in": "bg-blue-500/20 text-blue-400",
  "zoom-in": "bg-purple-500/20 text-purple-400",
  "zoom-out": "bg-purple-500/20 text-purple-400",
  "slide-left": "bg-green-500/20 text-green-400",
  "slide-right": "bg-green-500/20 text-green-400",
  "slide-up": "bg-green-500/20 text-green-400",
  "ken-burns": "bg-amber-500/20 text-amber-400",
  "bounce-in": "bg-pink-500/20 text-pink-400",
  "typewriter": "bg-cyan-500/20 text-cyan-400",
  "split-reveal": "bg-red-500/20 text-red-400",
  "none": "bg-muted text-muted-foreground",
};

const PLATFORMS = [
  { id: "instagram-reels", label: "인스타 릴스", desc: "9:16, 30~60초" },
  { id: "youtube-shorts", label: "유튜브 쇼츠", desc: "9:16, 60초 이내" },
  { id: "tiktok", label: "틱톡", desc: "9:16, 15~60초" },
];

const TONES = [
  { id: "professional", label: "전문적" },
  { id: "casual", label: "캐주얼" },
  { id: "energetic", label: "에너지틱" },
  { id: "calm", label: "차분한" },
];

export function StoryboardPanel({ projectTitle, slides, onClose }: Props) {
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [generating, setGenerating] = useState(false);
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  const [platform, setPlatform] = useState("instagram-reels");
  const [tone, setTone] = useState("professional");

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const { generateStoryboard } = await import("@/lib/ai/aiService");
      const result = await generateStoryboard(projectTitle, slides, platform, tone);
      setStoryboard(result);
      setExpandedScene(0);
      toast.success("스토리보드가 생성되었습니다!");
    } catch (e: any) {
      console.error("Storyboard error:", e);
      toast.error(e.message || "스토리보드 생성에 실패했습니다");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-l border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">숏폼 스토리보드</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        {!storyboard ? (
          /* Generation form */
          <div className="p-4 space-y-4">
            <p className="text-xs text-muted-foreground">
              카드뉴스 슬라이드를 기반으로 AI가 숏폼 영상 스토리보드를 자동 생성합니다.
              각 장면의 모션, 전환효과, 나레이션 스크립트가 포함됩니다.
            </p>

            {/* Platform */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">플랫폼</label>
              <div className="grid grid-cols-3 gap-1.5">
                {PLATFORMS.map(p => (
                  <button key={p.id} onClick={() => setPlatform(p.id)}
                    className={cn(
                      "p-2 rounded-lg border text-center transition-all",
                      platform === p.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    )}>
                    <div className="text-[10px] font-medium">{p.label}</div>
                    <div className="text-[9px] text-muted-foreground">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase">톤 & 무드</label>
              <div className="flex flex-wrap gap-1.5">
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[10px] font-medium border transition-all",
                      tone === t.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slide count info */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface border border-border">
              <Film className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground">
                <strong className="text-foreground">{slides.length}장</strong>의 슬라이드로 스토리보드를 생성합니다
              </span>
            </div>

            <button onClick={handleGenerate} disabled={generating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-all">
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  스토리보드 생성 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI 스토리보드 생성
                </>
              )}
            </button>
          </div>
        ) : (
          /* Storyboard result */
          <div className="p-4 space-y-4">
            {/* Summary */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <p className="text-xs text-foreground font-medium">{storyboard.summary}</p>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  총 {storyboard.totalDurationSec}초
                </span>
                <span className="flex items-center gap-1">
                  <Music className="w-3 h-3" />
                  {storyboard.bgmSuggestion}
                </span>
                <span className="flex items-center gap-1">
                  <Film className="w-3 h-3" />
                  {storyboard.scenes.length}컷
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase">타임라인</label>
                <button onClick={() => { setStoryboard(null); setExpandedScene(null); }}
                  className="text-[10px] text-primary hover:underline">다시 생성</button>
              </div>

              {/* Timeline bar */}
              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-surface">
                {storyboard.scenes.map((scene, i) => (
                  <div key={i}
                    onClick={() => setExpandedScene(expandedScene === i ? null : i)}
                    className={cn(
                      "h-full rounded-sm cursor-pointer transition-opacity hover:opacity-80",
                      expandedScene === i ? "opacity-100" : "opacity-60",
                      MOTION_COLORS[scene.motion]?.split(" ")[0] || "bg-primary"
                    )}
                    style={{ flex: scene.durationSec }}
                    title={`씬 ${i + 1}: ${scene.durationSec}초`}
                  />
                ))}
              </div>

              {/* Scenes */}
              <div className="space-y-1.5">
                {storyboard.scenes.map((scene, i) => (
                  <SceneCard
                    key={i}
                    scene={scene}
                    index={i}
                    slideTitle={slides[scene.slideIndex]?.title || `슬라이드 ${scene.slideIndex + 1}`}
                    expanded={expandedScene === i}
                    onToggle={() => setExpandedScene(expandedScene === i ? null : i)}
                    isLast={i === storyboard.scenes.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SceneCard({ scene, index, slideTitle, expanded, onToggle, isLast }: {
  scene: StoryboardScene;
  index: number;
  slideTitle: string;
  expanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  return (
    <div className={cn(
      "rounded-lg border transition-all",
      expanded ? "border-primary/40 bg-primary/5" : "border-border bg-surface hover:border-border"
    )}>
      {/* Header */}
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-3 py-2 text-left">
        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium text-foreground truncate">{slideTitle}</div>
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span>{scene.durationSec}초</span>
            <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-medium", MOTION_COLORS[scene.motion] || "bg-muted text-muted-foreground")}>
              {MOTION_LABELS[scene.motion]}
            </span>
            {!isLast && (
              <span className="flex items-center gap-0.5">
                <ArrowRight className="w-2.5 h-2.5" />
                {TRANSITION_LABELS[scene.transition]}
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-border/50 pt-2.5">
          {/* Motion detail */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground uppercase">
              <Play className="w-3 h-3" /> 모션 상세
            </div>
            <p className="text-[11px] text-foreground leading-relaxed">{scene.motionDetail}</p>
          </div>

          {/* Text animation */}
          {scene.textAnimation && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground uppercase">
                <Type className="w-3 h-3" /> 텍스트 애니메이션
              </div>
              <p className="text-[11px] text-foreground leading-relaxed">{scene.textAnimation}</p>
            </div>
          )}

          {/* Narration */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground uppercase">
              <Volume2 className="w-3 h-3" /> 나레이션
            </div>
            <p className="text-[11px] text-foreground leading-relaxed bg-background/50 rounded-md p-2 border border-border/50 italic">
              "{scene.narration}"
            </p>
          </div>

          {/* Visual note */}
          {scene.visualNote && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[9px] font-semibold text-muted-foreground uppercase">
                <Eye className="w-3 h-3" /> 연출 메모
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{scene.visualNote}</p>
            </div>
          )}

          {/* Emphasis keywords */}
          {scene.emphasis && scene.emphasis.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {scene.emphasis.map((kw, ki) => (
                <span key={ki} className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-medium">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
