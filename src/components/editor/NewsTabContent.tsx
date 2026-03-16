import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type NewsItem = {
  id: string;
  title: string;
  source: string;
  date: string;
  time?: string;
  category: string;
  summary: string;
};

const PORTALS = [
  { id: "google", label: "Google 뉴스" },
  { id: "naver", label: "네이버 뉴스" },
  { id: "daum", label: "다음 뉴스" },
];

interface NewsTabContentProps {
  selectedNews: string[];
  setSelectedNews: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function NewsTabContent({ selectedNews, setSelectedNews }: NewsTabContentProps) {
  const [portal, setPortal] = useState("google");
  const [keyword, setKeyword] = useState("");
  const [liveNews, setLiveNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchNews = async (query?: string) => {
    setNewsLoading(true);
    setNewsError(null);
    try {
      const body: Record<string, any> = { limit: 10, portal };
      if (query && query.trim()) {
        body.query = query.trim();
      }
      const { data, error } = await supabase.functions.invoke("fetch-news", { body });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setLiveNews(data.news || []);
      setHasSearched(true);
    } catch (e: any) {
      console.error("Failed to fetch news:", e);
      setNewsError("뉴스를 불러오지 못했습니다. 다시 시도해주세요.");
    } finally {
      setNewsLoading(false);
    }
  };

  // Load headlines on first mount
  useEffect(() => {
    if (!hasSearched && !newsLoading) {
      fetchNews();
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      setSelectedNews([]);
      fetchNews(keyword);
    }
  };

  const handlePortalChange = (newPortal: string) => {
    setPortal(newPortal);
    setLiveNews([]);
    setSelectedNews([]);
    setHasSearched(false);
  };

  // Re-fetch when portal changes
  useEffect(() => {
    if (!hasSearched) {
      fetchNews(keyword || undefined);
    }
  }, [portal]);

  return (
    <div className="space-y-3">
      {/* Portal selector */}
      <div className="flex gap-1.5">
        {PORTALS.map(p => (
          <button
            key={p.id}
            onClick={() => handlePortalChange(p.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
              portal === p.id
                ? "bg-primary/10 border-primary/40 text-primary"
                : "bg-surface border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Keyword search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="키워드를 입력하세요 (예: AI, 경제, 반도체)"
            className="w-full pl-9 pr-3 py-2 bg-surface rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border"
          />
        </div>
        <button
          type="submit"
          disabled={!keyword.trim() || newsLoading}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            keyword.trim() && !newsLoading
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          검색
        </button>
      </form>

      {/* Results */}
      <div className="space-y-2 max-h-[240px] overflow-auto scrollbar-thin">
        {newsLoading && (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">뉴스를 검색하는 중...</span>
          </div>
        )}
        {newsError && (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-sm text-destructive">{newsError}</p>
            <button onClick={() => fetchNews(keyword || undefined)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> 다시 시도
            </button>
          </div>
        )}
        {!newsLoading && !newsError && liveNews.length === 0 && hasSearched && (
          <div className="text-center py-10 text-sm text-muted-foreground">검색 결과가 없습니다.</div>
        )}
        {!newsLoading && liveNews.length > 0 && (
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">
              {keyword ? `"${keyword}" 검색 결과` : "실시간 헤드라인"} · {liveNews.length}건
            </span>
            <button onClick={() => fetchNews(keyword || undefined)} className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors">
              <RefreshCw className="w-3 h-3" /> 새로고침
            </button>
          </div>
        )}
        {liveNews.map(news => (
          <label
            key={news.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
              selectedNews.includes(news.id) ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
            )}
          >
            <input
              type="checkbox"
              checked={selectedNews.includes(news.id)}
              onChange={() => setSelectedNews(prev => prev.includes(news.id) ? prev.filter(id => id !== news.id) : [...prev, news.id])}
              className="mt-0.5 accent-primary"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">{news.category}</span>
                <span className="text-[10px] text-muted-foreground">{news.source} · {news.date} {news.time || ""}</span>
              </div>
              <h3 className="text-sm font-medium text-foreground">{news.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{news.summary}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
