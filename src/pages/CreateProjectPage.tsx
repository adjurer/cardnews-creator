import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Link, Newspaper, Rss, BookOpen, BookTemplate } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { MOCK_EXAMPLES } from "@/mocks/data";
import { cn } from "@/lib/utils";
import NewsTabContent from "@/components/editor/NewsTabContent";
import FeedTabContent from "@/components/editor/FeedTabContent";
import TemplateListDialog from "@/components/editor/TemplateListDialog";
import type { SourceType, Slide } from "@/types/project";

type Tab = "text" | "example" | "news" | "feed" | "url";

const TABS: { id: Tab; label: string; icon: any; desc: string }[] = [
  { id: "text", label: "텍스트 붙여넣기", icon: FileText, desc: "블로그, 기사, 메모 등" },
  { id: "example", label: "예시로 시작", icon: BookOpen, desc: "샘플 카드뉴스" },
  { id: "news", label: "오늘의 뉴스", icon: Newspaper, desc: "뉴스 선택" },
  { id: "feed", label: "피드에서 선택", icon: Rss, desc: "뉴스레터/피드" },
  { id: "url", label: "URL 가져오기", icon: Link, desc: "웹 콘텐츠 추출" },
];

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const { setGenerationStatus, setGenerationStep } = useProjectStore();
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [selectedNews, setSelectedNews] = useState<string[]>([]);
  const [selectedFeedEntries, setSelectedFeedEntries] = useState<string[]>([]);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  const newsItemsRef = useRef<Array<{ id: string; title: string; source: string; date: string; time?: string; category: string; summary: string }>>([]);
  const feedItemsRef = useRef<Array<{ id: string; title: string; source: string; date: string; time?: string; summary: string }>>([]);

  const canGenerate = () => {
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

  const handleGenerate = () => {
    if (!canGenerate()) return;
    const source = getSourceContent();
    sessionStorage.setItem("generation-source", JSON.stringify(source));
    setGenerationStatus("generating");
    setGenerationStep(0);
    navigate("/generate");
  };

  return (
    <div className="h-full overflow-auto p-6 lg:p-8 scrollbar-thin">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> 작업 목록
        </button>

        <h1 className="text-xl font-bold text-foreground mb-1">카드뉴스 만들기</h1>
        <p className="text-xs text-muted-foreground mb-6">카드뉴스로 만들 내용을 준비하세요</p>

        {/* Tab selector as cards */}
        <div className="grid grid-cols-5 gap-2 mb-5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all border",
                activeTab === tab.id
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[11px] font-medium leading-tight">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="rounded-xl border border-border bg-card p-5 min-h-[280px]">
          {activeTab === "text" && (
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="블로그 글, 기사, 메모 등 원본 텍스트를 여기에 붙여넣으세요.&#10;&#10;최소 10자 이상 입력해주세요."
              className="w-full h-56 bg-surface rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border"
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
                    selectedExample === ex.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface hover:border-muted-foreground/30"
                  )}
                >
                  <h3 className="font-medium text-foreground text-sm">{ex.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ex.description}</p>
                  <span className="text-[10px] text-primary mt-2 inline-block">{ex.slides.length}장 슬라이드</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === "news" && (
            <NewsTabContent
              selectedNews={selectedNews}
              setSelectedNews={setSelectedNews}
            />
          )}

          {activeTab === "feed" && (
            <div className="space-y-5 max-h-[320px] overflow-auto scrollbar-thin">
              {MOCK_FEEDS.map(feed => (
                <div key={feed.id}>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{feed.name}</h3>
                  <div className="space-y-1.5">
                    {feed.entries.map(entry => (
                      <label
                        key={entry.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          selectedFeedEntries.includes(entry.id) ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFeedEntries.includes(entry.id)}
                          onChange={() => setSelectedFeedEntries(prev => prev.includes(entry.id) ? prev.filter(id => id !== entry.id) : [...prev, entry.id])}
                          className="mt-0.5 accent-primary"
                        />
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{entry.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{entry.preview}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "url" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://example.com/article"
                  className="flex-1 bg-surface rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border"
                />
                <button className="px-4 py-2.5 rounded-lg bg-surface text-sm text-foreground border border-border hover:bg-muted transition-colors">
                  추출
                </button>
              </div>
              {urlInput && (
                <div className="p-4 rounded-lg bg-surface border border-border">
                  <p className="text-xs text-muted-foreground">URL에서 콘텐츠를 추출합니다 (MVP: mock 데이터 사용)</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between mt-5">
          <button onClick={() => navigate("/dashboard")} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground">
            취소
          </button>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate()}
            className={cn(
              "px-6 py-2.5 rounded-lg text-sm font-medium transition-all",
              canGenerate()
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            카드뉴스 만들기
          </button>
        </div>
      </div>
    </div>
  );
}
