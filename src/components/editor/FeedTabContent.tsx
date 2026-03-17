import { useState } from "react";
import { Loader2, Plus, RefreshCw, Rss, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type FeedEntry = {
  id: string;
  title: string;
  source: string;
  date: string;
  time?: string;
  summary: string;
};

interface FeedTabContentProps {
  selectedEntries: string[];
  setSelectedEntries: React.Dispatch<React.SetStateAction<string[]>>;
  feedItemsRef?: React.MutableRefObject<FeedEntry[]>;
}

const SAVED_FEEDS_KEY = "cardnews-saved-feeds";

function getSavedFeeds(): { url: string; name: string }[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_FEEDS_KEY) || "[]");
  } catch { return []; }
}

function saveFeed(feed: { url: string; name: string }) {
  const feeds = getSavedFeeds().filter(f => f.url !== feed.url);
  feeds.unshift(feed);
  localStorage.setItem(SAVED_FEEDS_KEY, JSON.stringify(feeds.slice(0, 20)));
}

function removeFeed(url: string) {
  const feeds = getSavedFeeds().filter(f => f.url !== url);
  localStorage.setItem(SAVED_FEEDS_KEY, JSON.stringify(feeds));
}

const POPULAR_FEEDS = [
  { url: "https://feeds.feedburner.com/tvertnet", name: "GeekNews" },
  { url: "https://rss.blog.naver.com/PostRss.nhn?blogId=tech-plus", name: "Tech+" },
  { url: "https://www.yonhapnewstv.co.kr/browse/feed/", name: "연합뉴스TV" },
];

export default function FeedTabContent({ selectedEntries, setSelectedEntries, feedItemsRef }: FeedTabContentProps) {
  const [feedUrl, setFeedUrl] = useState("");
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFeeds, setSavedFeeds] = useState(getSavedFeeds);
  const [activeFeedUrl, setActiveFeedUrl] = useState<string | null>(null);

  const fetchFeed = async (url: string) => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setSelectedEntries([]);
    setActiveFeedUrl(url);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("fetch-news", {
        body: { feedUrl: url.trim(), limit: 20 },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      const items = (data.news || []).map((n: any, i: number) => ({
        id: `feed-${i}-${Date.now()}`,
        title: n.title,
        source: n.source,
        date: n.date,
        time: n.time,
        summary: n.summary,
      }));
      setEntries(items);
      if (feedItemsRef) feedItemsRef.current = items;
      if (items.length > 0) {
        // Auto-save successful feeds
        const feedName = items[0]?.source || new URL(url).hostname;
        saveFeed({ url: url.trim(), name: feedName });
        setSavedFeeds(getSavedFeeds());
      } else {
        setError("피드에서 항목을 찾을 수 없습니다. URL을 확인해주세요.");
      }
    } catch (e: any) {
      console.error("Feed fetch error:", e);
      setError("피드를 불러오지 못했습니다. URL이 올바른 RSS 피드인지 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeed(feedUrl);
  };

  const handleRemoveFeed = (url: string) => {
    removeFeed(url);
    setSavedFeeds(getSavedFeeds());
  };

  return (
    <div className="space-y-3">
      {/* RSS URL input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Rss className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={feedUrl}
            onChange={e => setFeedUrl(e.target.value)}
            placeholder="RSS 피드 URL을 입력하세요 (예: https://example.com/rss)"
            className="w-full pl-9 pr-3 py-2 bg-card rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 border border-border"
          />
        </div>
        <button
          type="submit"
          disabled={!feedUrl.trim() || loading}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            feedUrl.trim() && !loading
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          불러오기
        </button>
      </form>

      {/* Saved + Popular feeds */}
      {entries.length === 0 && !loading && (
        <div className="space-y-3">
          {savedFeeds.length > 0 && (
            <div>
              <h4 className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">저장된 피드</h4>
              <div className="flex flex-wrap gap-1.5">
                {savedFeeds.map(f => (
                  <div key={f.url} className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border bg-card text-xs">
                    <button onClick={() => { setFeedUrl(f.url); fetchFeed(f.url); }} className="text-foreground hover:text-primary transition-colors">
                      {f.name}
                    </button>
                    <button onClick={() => handleRemoveFeed(f.url)} className="text-muted-foreground hover:text-destructive transition-colors ml-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <h4 className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">추천 피드</h4>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_FEEDS.map(f => (
                <button
                  key={f.url}
                  onClick={() => { setFeedUrl(f.url); fetchFeed(f.url); }}
                  className="px-2.5 py-1 rounded-lg border border-border bg-card text-xs text-foreground hover:border-primary/40 hover:text-primary transition-all"
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading/Error */}
      {loading && (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          <span className="text-sm">피드를 불러오는 중...</span>
        </div>
      )}
      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <p className="text-sm text-destructive">{error}</p>
          {activeFeedUrl && (
            <button onClick={() => fetchFeed(activeFeedUrl)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> 다시 시도
            </button>
          )}
        </div>
      )}

      {/* Feed entries */}
      {!loading && entries.length > 0 && (
        <div className="space-y-2 max-h-[240px] overflow-auto scrollbar-thin">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{entries.length}건의 항목</span>
            <button onClick={() => { setEntries([]); setActiveFeedUrl(null); }} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              다른 피드
            </button>
          </div>
          {entries.map(entry => (
            <label
              key={entry.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                selectedEntries.includes(entry.id) ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              )}
            >
              <input
                type="checkbox"
                checked={selectedEntries.includes(entry.id)}
                onChange={() => setSelectedEntries(prev => prev.includes(entry.id) ? prev.filter(id => id !== entry.id) : [...prev, entry.id])}
                className="mt-0.5 accent-primary"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] text-muted-foreground">{entry.source} · {entry.date} {entry.time || ""}</span>
                </div>
                <h3 className="text-sm font-medium text-foreground">{entry.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.summary}</p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
