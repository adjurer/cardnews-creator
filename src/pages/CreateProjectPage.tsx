import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Link, Newspaper, Rss, BookOpen, Search, Loader2 } from "lucide-react";
import { useProjectStore } from "@/store/useProjectStore";
import { generateId } from "@/lib/utils/helpers";
import { MOCK_NEWS, MOCK_FEEDS, MOCK_EXAMPLES, MOCK_KEYWORD_NEWS } from "@/mocks/data";
import { cn } from "@/lib/utils";
import type { Project, SourceType } from "@/types/project";

type Tab = "text" | "example" | "news" | "feed" | "url" | "keyword";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "text", label: "텍스트 붙여넣기", icon: FileText },
  { id: "keyword", label: "키워드 뉴스 검색", icon: Search },
  { id: "example", label: "예시로 시작하기", icon: BookOpen },
  { id: "news", label: "오늘의 뉴스", icon: Newspaper },
  { id: "feed", label: "피드에서 선택", icon: Rss },
  { id: "url", label: "URL 가져오기", icon: Link },
];

const SUGGESTED_KEYWORDS = ["AI", "마케팅", "스타트업", "크리에이터"];

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const { setGenerationStatus, setGenerationStep } = useProjectStore();
  const [activeTab, setActiveTab] = useState<Tab>("text");
  const [textInput, setTextInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [selectedNews, setSelectedNews] = useState<string[]>([]);
  const [selectedFeedEntries, setSelectedFeedEntries] = useState<string[]>([]);
  const [selectedExample, setSelectedExample] = useState<string | null>(null);

  // Keyword search state
  const [keywordInput, setKeywordInput] = useState("");
  const [keywordResults, setKeywordResults] = useState<typeof MOCK_KEYWORD_NEWS["AI"]>([]);
  const [keywordSearching, setKeywordSearching] = useState(false);
  const [keywordSearched, setKeywordSearched] = useState(false);
  const [selectedKeywordNews, setSelectedKeywordNews] = useState<string[]>([]);

  const handleKeywordSearch = async () => {
    if (!keywordInput.trim()) return;
    setKeywordSearching(true);
    setKeywordSearched(false);
    setSelectedKeywordNews([]);
    // Simulate AI search delay
    await new Promise(r => setTimeout(r, 1200));
    // Find matching mock results or generate fallback
    const key = Object.keys(MOCK_KEYWORD_NEWS).find(k =>
      keywordInput.includes(k) || k.includes(keywordInput.trim())
    );
    setKeywordResults(key ? MOCK_KEYWORD_NEWS[key] : [
      {
        id: `kn-gen-1`,
        title: `"${keywordInput}" 관련 최신 동향 분석`,
        source: "AI 뉴스 수집기",
        date: new Date().toISOString().slice(0, 10),
        summary: `"${keywordInput}" 키워드와 관련된 최신 뉴스와 트렌드를 AI가 수집하여 정리한 결과입니다. 해당 분야의 주요 변화와 시사점을 카드뉴스로 만들어보세요.`,
        relevance: 0.90,
      },
      {
        id: `kn-gen-2`,
        title: `${keywordInput}: 2025년 핵심 트렌드 5가지`,
        source: "트렌드 분석 AI",
        date: new Date().toISOString().slice(0, 10),
        summary: `올해 ${keywordInput} 분야에서 가장 주목할 만한 5가지 트렌드를 정리했습니다. 전문가 의견과 데이터를 기반으로 분석한 결과입니다.`,
        relevance: 0.85,
      },
    ]);
    setKeywordSearching(false);
    setKeywordSearched(true);
  };

  const canGenerate = () => {
    switch (activeTab) {
      case "text": return textInput.trim().length > 10;
      case "url": return urlInput.trim().length > 5;
      case "news": return selectedNews.length > 0;
      case "feed": return selectedFeedEntries.length > 0;
      case "example": return selectedExample !== null;
      case "keyword": return selectedKeywordNews.length > 0;
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
      case "keyword": {
        const items = keywordResults.filter(n => selectedKeywordNews.includes(n.id));
        return { sourceType: "news", content: items.map(n => `${n.title}. ${n.summary}`).join("\n"), title: items[0]?.title };
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

          {activeTab === "keyword" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleKeywordSearch()}
                  placeholder="관심 키워드를 입력하세요 (예: AI, 마케팅, 스타트업)"
                  className="flex-1 bg-surface rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border"
                />
                <button
                  onClick={handleKeywordSearch}
                  disabled={!keywordInput.trim() || keywordSearching}
                  className={cn(
                    "px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                    keywordInput.trim() && !keywordSearching
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {keywordSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {keywordSearching ? "검색 중..." : "AI 뉴스 검색"}
                </button>
              </div>

              {/* Suggested keywords */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">추천:</span>
                {SUGGESTED_KEYWORDS.map(kw => (
                  <button
                    key={kw}
                    onClick={() => { setKeywordInput(kw); }}
                    className="px-3 py-1 rounded-full text-xs bg-surface border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {kw}
                  </button>
                ))}
              </div>

              {/* Searching state */}
              {keywordSearching && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">AI가 "{keywordInput}" 관련 뉴스를 수집하고 있습니다...</p>
                </div>
              )}

              {/* Results */}
              {keywordSearched && !keywordSearching && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">{keywordResults.length}개의 관련 뉴스를 찾았습니다</p>
                    {keywordResults.length > 0 && (
                      <button
                        onClick={() => {
                          if (selectedKeywordNews.length === keywordResults.length) {
                            setSelectedKeywordNews([]);
                          } else {
                            setSelectedKeywordNews(keywordResults.map(r => r.id));
                          }
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        {selectedKeywordNews.length === keywordResults.length ? "전체 해제" : "전체 선택"}
                      </button>
                    )}
                  </div>
                  {keywordResults.map(news => (
                    <label
                      key={news.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                        selectedKeywordNews.includes(news.id) ? "border-primary bg-primary/10" : "border-border bg-surface hover:border-muted-foreground/30"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedKeywordNews.includes(news.id)}
                        onChange={() => {
                          setSelectedKeywordNews(prev =>
                            prev.includes(news.id) ? prev.filter(id => id !== news.id) : [...prev, news.id]
                          );
                        }}
                        className="mt-1 accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">관련도 {Math.round(news.relevance * 100)}%</span>
                          <span className="text-xs text-muted-foreground">{news.source}</span>
                          <span className="text-xs text-muted-foreground">{news.date}</span>
                        </div>
                        <h3 className="text-sm font-medium text-foreground mt-1">{news.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{news.summary}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!keywordSearching && !keywordSearched && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">키워드를 입력하면 AI가 관련 뉴스를 수집합니다</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">수집된 뉴스를 선택해 카드뉴스로 만들 수 있습니다</p>
                </div>
              )}
            </div>
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
