import { Sparkles, ArrowLeft, ArrowRight, Target, MessageSquare, Users, Palette, Monitor, Hash, PenLine, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Brief {
  projectTitle: string;
  coreMessage: string;
  goal: string;
  targetAudience: string;
  tone: string;
  platform: string;
  slideCount: number;
  cta: string;
  brandKeywords: string;
  memo: string;
}

const TONES = [
  { id: "professional", label: "전문적" },
  { id: "friendly", label: "친근한" },
  { id: "bold", label: "강렬한" },
  { id: "minimal", label: "미니멀" },
  { id: "emotional", label: "감성적" },
  { id: "humorous", label: "유머러스" },
];

const PLATFORMS = [
  { id: "instagram", label: "인스타그램" },
  { id: "blog", label: "블로그" },
  { id: "linkedin", label: "링크드인" },
  { id: "newsletter", label: "뉴스레터" },
  { id: "presentation", label: "프레젠테이션" },
];

interface BriefStepProps {
  brief: Brief;
  onBriefChange: (b: Brief) => void;
  sourceSummary: string;
  sourceType: string;
  onBack: () => void;
  onGenerate: () => void;
}

export default function BriefStep({ brief, onBriefChange, sourceSummary, sourceType, onBack, onGenerate }: BriefStepProps) {
  const update = (key: keyof Brief, value: string | number) => {
    onBriefChange({ ...brief, [key]: value });
  };

  return (
    <div className="flex gap-6">
      {/* Left: Brief form */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Primary fields */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <PenLine className="w-3.5 h-3.5 text-primary" /> 기본 설정
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-[11px] text-muted-foreground mb-1.5 block">프로젝트 제목</label>
              <input value={brief.projectTitle} onChange={e => update("projectTitle", e.target.value)}
                placeholder="AI가 자동 생성 (비워두면 소스 기반 생성)"
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border" />
            </div>
            <div className="col-span-2">
              <label className="text-[11px] text-muted-foreground mb-1.5 block flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> 핵심 메시지
              </label>
              <input value={brief.coreMessage} onChange={e => update("coreMessage", e.target.value)}
                placeholder="이 카드뉴스를 통해 전달할 핵심 한 줄"
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block flex items-center gap-1">
                <Target className="w-3 h-3" /> 목표
              </label>
              <input value={brief.goal} onChange={e => update("goal", e.target.value)}
                placeholder="정보 전달, 브랜딩, 홍보 등"
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block flex items-center gap-1">
                <Users className="w-3 h-3" /> 타깃 독자
              </label>
              <input value={brief.targetAudience} onChange={e => update("targetAudience", e.target.value)}
                placeholder="마케터, 대학생, 기업 임원 등"
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border" />
            </div>
          </div>
        </div>

        {/* Tone & Platform */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-primary" /> 스타일 & 플랫폼
          </h3>

          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block">톤앤매너</label>
            <div className="flex flex-wrap gap-1.5">
              {TONES.map(t => (
                <button key={t.id} onClick={() => update("tone", t.id)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    brief.tone === t.id ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                  )}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block flex items-center gap-1">
              <Monitor className="w-3 h-3" /> 게시 플랫폼
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORMS.map(p => (
                <button key={p.id} onClick={() => update("platform", p.id)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    brief.platform === p.id ? "bg-primary/10 border-primary/40 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                  )}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-2 block">희망 슬라이드 수: {brief.slideCount}장</label>
            <input type="range" min={4} max={12} value={brief.slideCount}
              onChange={e => update("slideCount", parseInt(e.target.value))}
              className="w-full accent-primary h-1" />
            <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
              <span>4장</span><span>8장</span><span>12장</span>
            </div>
          </div>
        </div>

        {/* Additional */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-foreground flex items-center gap-2">
            <StickyNote className="w-3.5 h-3.5 text-primary" /> 추가 설정
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block">CTA 문구</label>
              <input value={brief.cta} onChange={e => update("cta", e.target.value)}
                placeholder="지금 시작하세요"
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border" />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground mb-1.5 block flex items-center gap-1">
                <Hash className="w-3 h-3" /> 브랜드 키워드
              </label>
              <input value={brief.brandKeywords} onChange={e => update("brandKeywords", e.target.value)}
                placeholder="쉼표로 구분"
                className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border" />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1.5 block">추가 메모</label>
            <textarea value={brief.memo} onChange={e => update("memo", e.target.value)}
              placeholder="AI에게 전달할 추가 지시사항이 있다면 입력하세요"
              rows={3}
              className="w-full bg-surface rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button onClick={onBack} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> 소스 수정
          </button>
          <button onClick={onGenerate}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all">
            <Sparkles className="w-4 h-4" /> 카드뉴스 생성
          </button>
        </div>
      </div>

      {/* Right: Brief summary */}
      <div className="w-[300px] shrink-0 hidden lg:block">
        <div className="sticky top-6 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-semibold text-foreground">브리프 요약</h3>
            </div>
            <div className="space-y-2.5 text-[11px]">
              <SummaryRow label="소스" value={sourceType} />
              <SummaryRow label="소스 내용" value={sourceSummary} truncate />
              {brief.projectTitle && <SummaryRow label="제목" value={brief.projectTitle} />}
              {brief.coreMessage && <SummaryRow label="핵심 메시지" value={brief.coreMessage} />}
              {brief.goal && <SummaryRow label="목표" value={brief.goal} />}
              {brief.targetAudience && <SummaryRow label="타깃" value={brief.targetAudience} />}
              <SummaryRow label="톤" value={TONES.find(t => t.id === brief.tone)?.label || brief.tone} />
              <SummaryRow label="플랫폼" value={PLATFORMS.find(p => p.id === brief.platform)?.label || brief.platform} />
              <SummaryRow label="슬라이드" value={`${brief.slideCount}장`} />
              {brief.cta && <SummaryRow label="CTA" value={brief.cta} />}
              {brief.brandKeywords && <SummaryRow label="키워드" value={brief.brandKeywords} />}
            </div>
          </div>

          {/* Visual preview mockup */}
          <div className="rounded-xl border border-border bg-surface/50 p-4">
            <div className="aspect-[4/5] rounded-lg bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-border/50 flex flex-col items-center justify-center gap-3 px-6">
              <div className="w-full space-y-2">
                <div className="h-2 bg-primary/20 rounded-full w-3/4 mx-auto" />
                <div className="h-1.5 bg-muted rounded-full w-1/2 mx-auto" />
                <div className="mt-4 space-y-1.5">
                  {Array.from({ length: Math.min(brief.slideCount, 6) }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-primary/15 shrink-0" />
                      <div className="h-1.5 bg-muted/60 rounded-full flex-1" />
                    </div>
                  ))}
                </div>
                {brief.cta && (
                  <div className="mt-4 mx-auto px-4 py-1.5 bg-primary/15 rounded-md w-fit">
                    <span className="text-[9px] text-primary font-medium">{brief.cta}</span>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">{brief.slideCount}장 · {TONES.find(t => t.id === brief.tone)?.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, truncate }: { label: string; value: string; truncate?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-16 shrink-0">{label}</span>
      <span className={cn("text-foreground font-medium", truncate && "line-clamp-2")}>{value}</span>
    </div>
  );
}
