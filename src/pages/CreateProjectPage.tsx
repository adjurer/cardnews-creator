import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, FileText, Link, Newspaper, Rss, BookOpen, BookTemplate, Sparkles } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { MOCK_EXAMPLES } from "@/mocks/data";
import { cn } from "@/lib/utils";
import NewsTabContent from "@/components/editor/NewsTabContent";
import FeedTabContent from "@/components/editor/FeedTabContent";
import TemplateListDialog from "@/components/editor/TemplateListDialog";
import BriefStep from "@/components/create/BriefStep";
import type { SourceType, Slide } from "@/types/project";
import type { Brief } from "@/components/create/BriefStep";

type Tab = "text" | "example" | "news" | "feed" | "url";
type Step = "source" | "brief";

const TABS: { id: Tab; label: string; icon: any; desc: string }[] = [
  { id: "text", label: "텍스트", icon: FileText, desc: "블로그, 기사, 메모" },
  { id: "example", label: "예시", icon: BookOpen, desc: "샘플로 시작" },
  { id: "news", label: "뉴스", icon: Newspaper, desc: "실시간 뉴스" },
  { id: "feed", label: "피드", icon: Rss, desc: "RSS 피드" },
  { id: "url", label: "URL", icon: Link, desc: "웹 콘텐츠" },
];

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const { setGenerationStatus, setGenerationStep } = useProjectStore();
  const [step, setStep] = useState<Step>("source");
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [selectedNews, setSelectedNews] = useState<string[]>([]);
  const [selectedFeedEntries, setSelectedFeedEntries] = useState<string[]>([]);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [brief, setBrief] = useState<Brief>({
    projectTitle: "",
    coreMessage: "",
    goal: "",
    targetAudience: "",
    tone: "professional",
    platform: "instagram",
    slideCount: 7,
    cta: "",
    brandKeywords: "",
    memo: "",
  });

  const newsItemsRef = useRef<Array<{ id: string; title: string; source: string; date: string; time?: string; category: string; summary: string }>>([]);
  const feedItemsRef = useRef<Array<{ id: string; title: string; source: string; date: string; time?: string; summary: string }>>([]);

  const canProceed = () => {
    switch (activeTab) {
      case "text": return textInput.trim().length > 10;
      case "url": return urlInput.trim().length > 5;
      case "news": return selectedNews.length > 0;
      case "feed": return selectedFeedEntries.length > 0;
      case "example": return selectedExample !== null;
    }
  };

  const getSourceContent = (): { sourceType: SourceType; content: string; title?: string } => {
    switch (activeTab) {
      case "text":
        return { sourceType: "text", content: textInput };
      case "url":
        return { sourceType: "url", content: `URL에서 추출한 내용입니다. ${urlInput}에서 가져온 기사의 핵심 내용을 요약하면 다음과 같습니다. AI 기술의 발전으로 콘텐츠 제작 방식이 근본적으로 변화하고 있습니다.` };
      case "news": {
        const items = newsItemsRef.current.filter(n => selectedNews.includes(n.id));
        return { sourceType: "news", content: items.map(n => `${n.title}. ${n.summary}`).join("\n"), title: items[0]?.title };
      }
      case "feed": {
        const entries = feedItemsRef.current.filter(e => selectedFeedEntries.includes(e.id));
        return { sourceType: "feed", content: entries.map(e => `${e.title}. ${e.summary}`).join("\n"), title: entries[0]?.title };
      }
      case "example": {
        const ex = MOCK_EXAMPLES.find(e => e.id === selectedExample);
        return { sourceType: "example", content: ex?.slides.map(s => `${s.title}. ${s.body || ""}`).join("\n") || "", title: ex?.title };
      }
    }
  };

  const getSourceSummary = () => {
    switch (activeTab) {
      case "text": return textInput.slice(0, 100) + (textInput.length > 100 ? "..." : "");
      case "url": return urlInput;
      case "news": {
        const items = newsItemsRef.current.filter(n => selectedNews.includes(n.id));
        return items.map(n => n.title).join(", ");
      }
      case "feed": {
        const entries = feedItemsRef.current.filter(e => selectedFeedEntries.includes(e.id));
        return entries.map(e => e.title).join(", ");
      }
      case "example": {
        const ex = MOCK_EXAMPLES.find(e => e.id === selectedExample);
        return ex?.title || "";
      }
    }
  };

  const handleGoToBrief = () => {
    if (!canProceed()) return;
    // Auto-fill brief title from source
    const source = getSourceContent();
    if (!brief.projectTitle && source.title) {
      setBrief(b => ({ ...b, projectTitle: source.title || "" }));
    }
    setStep("brief");
  };

  const handleGenerate = () => {
    const source = getSourceContent();
    sessionStorage.setItem("generation-source", JSON.stringify({ ...source, brief }));
    setGenerationStatus("generating");
    setGenerationStep(0);
    navigate("/generate");
  };

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      <div className="max-w-6xl mx-auto p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => step === "brief" ? setStep("source") : navigate("/dashboard")} className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">카드뉴스 만들기</h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {step === "source" ? "Step 1. 소스 입력" : "Step 2. 제작 브리프"}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              step === "source" ? "bg-primary/10 border-primary/40 text-primary" : "bg-surface border-border text-muted-foreground"
            )}>
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">1</span>
              소스
            </div>
            <div className="w-6 h-px bg-border" />
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              step === "brief" ? "bg-primary/10 border-primary/40 text-primary" : "bg-surface border-border text-muted-foreground"
            )}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                step === "brief" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>2</span>
              브리프
            </div>
          </div>
        </div>

        {step === "source" ? (
          <div className="flex gap-6">
            {/* Left: Source input */}
            <div className="flex-1 min-w-0">
              {/* Tab selector */}
              <div className="flex gap-1.5 mb-4">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                      activeTab === tab.id
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content area */}
              <div className="rounded-xl border border-border bg-card p-5 min-h-[320px]">
                {activeTab === "text" && (
                  <textarea
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    placeholder="블로그 글, 기사, 메모 등 원본 텍스트를 여기에 붙여넣으세요.&#10;&#10;최소 10자 이상 입력해주세요."
                    className="w-full h-64 bg-surface rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border"
                  />
                )}

                {activeTab === "example" && (
                  <div className="grid grid-cols-2 gap-3">
                    {MOCK_EXAMPLES.map(ex => (
                      <button
                        key={ex.id}
                        onClick={() => setSelectedExample(ex.id)}
                        className={cn(
                          "text-left p-4 rounded-lg border transition-all",
                          selectedExample === ex.id ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-muted-foreground/30"
                        )}
                      >
                        <h3 className="font-medium text-foreground text-sm">{ex.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ex.description}</p>
                        <span className="text-[10px] text-primary mt-2 inline-block">{ex.slides.length}장</span>
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === "news" && (
                  <NewsTabContent selectedNews={selectedNews} setSelectedNews={setSelectedNews} newsItemsRef={newsItemsRef} />
                )}

                {activeTab === "feed" && (
                  <FeedTabContent selectedEntries={selectedFeedEntries} setSelectedEntries={setSelectedFeedEntries} feedItemsRef={feedItemsRef} />
                )}

                {activeTab === "url" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
                        placeholder="https://example.com/article"
                        className="flex-1 bg-surface rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border"
                      />
                      <button className="px-4 py-2.5 rounded-lg bg-surface text-sm text-foreground border border-border hover:bg-muted transition-colors">추출</button>
                    </div>
                    {urlInput && (
                      <div className="p-4 rounded-lg bg-surface border border-border">
                        <p className="text-xs text-muted-foreground">URL에서 콘텐츠를 추출합니다</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom actions */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate("/dashboard")} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">취소</button>
                  <button onClick={() => setTemplateDialogOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/30 transition-all">
                    <BookTemplate className="w-3.5 h-3.5" /> 템플릿
                  </button>
                </div>
                <button onClick={handleGoToBrief} disabled={!canProceed()}
                  className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                    canProceed() ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}>
                  다음: 브리프 설정 <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Preview / Summary */}
            <div className="w-[300px] shrink-0 hidden lg:block">
              <div className="sticky top-6 space-y-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-semibold text-foreground">제작 미리보기</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-12">소스</span>
                      <span className="text-[10px] text-primary font-medium">
                        {TABS.find(t => t.id === activeTab)?.label}
                      </span>
                    </div>
                    {canProceed() && (
                      <>
                        <div className="h-px bg-border" />
                        <p className="text-[11px] text-muted-foreground line-clamp-4">{getSourceSummary()}</p>
                      </>
                    )}
                    {!canProceed() && (
                      <p className="text-[11px] text-muted-foreground/60 italic mt-2">소스를 입력하면 여기에 요약이 표시됩니다</p>
                    )}
                  </div>
                </div>

                {/* Visual mockup */}
                <div className="rounded-xl border border-border bg-surface/50 p-4">
                  <div className="aspect-[4/5] rounded-lg bg-gradient-to-br from-primary/10 via-background to-accent/10 border border-border/50 flex items-center justify-center">
                    <div className="text-center px-6">
                      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="w-5 h-5 text-primary/60" />
                      </div>
                      <p className="text-[11px] text-muted-foreground">AI가 생성할 카드뉴스가<br />여기에 표시됩니다</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <BriefStep
            brief={brief}
            onBriefChange={setBrief}
            sourceSummary={getSourceSummary()}
            sourceType={TABS.find(t => t.id === activeTab)?.label || ""}
            onBack={() => setStep("source")}
            onGenerate={handleGenerate}
          />
        )}

        <TemplateListDialog
          open={templateDialogOpen}
          onClose={() => setTemplateDialogOpen(false)}
          onLoad={(slides, themePreset, name) => {
            const templateSource = {
              sourceType: "example" as SourceType,
              content: slides.map((s: Slide) => `${s.title}. ${s.body || ""}`).join("\n"),
              title: name,
              templateSlides: slides,
              templateTheme: themePreset,
            };
            sessionStorage.setItem("generation-source", JSON.stringify(templateSource));
            setTemplateDialogOpen(false);
            navigate("/generate");
          }}
        />
      </div>
    </div>
  );
}
