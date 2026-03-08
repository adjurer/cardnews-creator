import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Link, Newspaper, Rss, BookOpen } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { generateId } from "@/lib/utils/helpers";
import { MOCK_NEWS, MOCK_FEEDS, MOCK_EXAMPLES } from "@/mocks/data";
import { cn } from "@/lib/utils";
import type { Project, SourceType } from "@/types/project";

type Tab = "text" | "example" | "news" | "feed" | "url";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "text", label: "텍스트 붙여넣기", icon: FileText },
  { id: "example", label: "예시로 시작하기", icon: BookOpen },
  { id: "news", label: "오늘의 뉴스", icon: Newspaper },
  { id: "feed", label: "피드에서 선택", icon: Rss },
  { id: "url", label: "URL 가져오기", icon: Link },
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
        return { sourceType: "url", content: `URL에서 추출한 내용입니다. ${urlInput}에서 가져온 기사의 핵심 내용을 요약하면 다음과 같습니다. AI 기술의 발전으로 콘텐츠 제작 방식이 근본적으로 변화하고 있습니다. 자동화된 도구들이 크리에이터의 생산성을 높이고 있으며, 개인화된 콘텐츠 전달이 가능해지고 있습니다.` };
      case "news": {
        const items = MOCK_NEWS.filter(n => selectedNews.includes(n.id));
        return { sourceType: "news", content: items.map(n => `${n.title}. ${n.summary}`).join("\n"), title: items[0]?.title };
      }
      case "feed": {
        const entries = MOCK_FEEDS.flatMap(f => f.entries).filter(e => selectedFeedEntries.includes(e.id));
        return { sourceType: "feed", content: entries.map(e => `${e.title}. ${e.preview}`).join("\n"), title: entries[0]?.title };
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
    // Store source info in sessionStorage for generation page
    sessionStorage.setItem("generation-source", JSON.stringify(source));
    setGenerationStatus("generating");
    setGenerationStep(0);
    navigate("/generate");
  };

  return (
    <div className="h-full overflow-auto p-8 scrollbar-thin">
      <div className="max-w-4xl mx-auto animate-fade-in">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> 대시보드로 돌아가기
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">카드뉴스 만들기</h1>
        <p className="text-sm text-muted-foreground mb-8">카드뉴스로 만들 내용을 준비하세요</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary/20 text-primary border border-primary/40"
                  : "bg-surface text-muted-foreground hover:text-foreground border border-transparent"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-panel p-6 min-h-[300px]">
          {activeTab === "text" && (
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="블로그 글, 기사, 메모 등 원본 텍스트를 여기에 붙여넣으세요. 최소 10자 이상 입력해주세요."
              className="w-full h-64 bg-surface rounded-lg p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border"
            />
          )}

          {activeTab === "example" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <p className="text-xs text-muted-foreground mt-1">{ex.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">{ex.slides.length}장 슬라이드</p>
                </button>
              ))}
            </div>
          )}

          {activeTab === "news" && (
            <div className="space-y-2">
              {MOCK_NEWS.map(news => (
                <label
                  key={news.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    selectedNews.includes(news.id) ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-muted-foreground/30"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedNews.includes(news.id)}
                    onChange={() => {
                      setSelectedNews(prev =>
                        prev.includes(news.id) ? prev.filter(id => id !== news.id) : [...prev, news.id]
                      );
                    }}
                    className="mt-1 accent-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">{news.category}</span>
                      <span className="text-xs text-muted-foreground">{news.source}</span>
                    </div>
                    <h3 className="text-sm font-medium text-foreground mt-1">{news.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{news.summary}</p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {activeTab === "feed" && (
            <div className="space-y-6">
              {MOCK_FEEDS.map(feed => (
                <div key={feed.id}>
                  <h3 className="text-sm font-medium text-foreground mb-2">{feed.name}</h3>
                  <div className="space-y-2">
                    {feed.entries.map(entry => (
                      <label
                        key={entry.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                          selectedFeedEntries.includes(entry.id) ? "border-primary bg-primary/10" : "border-border bg-surface"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFeedEntries.includes(entry.id)}
                          onChange={() => {
                            setSelectedFeedEntries(prev =>
                              prev.includes(entry.id) ? prev.filter(id => id !== entry.id) : [...prev, entry.id]
                            );
                          }}
                          className="mt-1 accent-primary"
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
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="https://example.com/article"
                  className="flex-1 bg-surface rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border"
                />
                <button
                  onClick={() => {}}
                  className="px-4 py-2.5 rounded-lg bg-surface text-sm text-foreground border border-border hover:bg-muted transition-colors"
                >
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
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => navigate("/dashboard")} className="px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground">
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
