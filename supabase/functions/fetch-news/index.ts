import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  time?: string;
  category: string;
  summary: string;
  link: string;
}

// Portal-specific search URL builders
const PORTAL_SEARCH: Record<string, (query: string) => string> = {
  google: (query: string) =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`,
  naver: (query: string) =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+site:naver.com&hl=ko&gl=KR&ceid=KR:ko`,
  daum: (query: string) =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+site:daum.net&hl=ko&gl=KR&ceid=KR:ko`,
};

// Default headline feeds per portal
const PORTAL_HEADLINES: Record<string, string> = {
  google: "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko",
  naver: "https://news.google.com/rss/search?q=site:naver.com&hl=ko&gl=KR&ceid=KR:ko",
  daum: "https://news.google.com/rss/search?q=site:daum.net&hl=ko&gl=KR&ceid=KR:ko",
};

function extractItems(xml: string): Array<{ title: string; link: string; pubDate: string }> {
  const items: Array<{ title: string; link: string; pubDate: string }> = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || "";
    const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() || "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || "";
    items.push({ title, link, pubDate });
  }
  return items;
}

function extractSourceFromTitle(title: string): { cleanTitle: string; source: string } {
  const lastDash = title.lastIndexOf(" - ");
  if (lastDash > 0) {
    return {
      cleanTitle: title.substring(0, lastDash).trim(),
      source: title.substring(lastDash + 3).trim(),
    };
  }
  return { cleanTitle: title, source: "뉴스" };
}

async function fetchRssFeed(url: string, category: string, limit: number = 10): Promise<NewsItem[]> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CardNewsBot/1.0)" },
    });
    
    if (!response.ok) {
      console.error(`RSS fetch failed for ${category}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const rssItems = extractItems(xml);

    const items: NewsItem[] = [];
    for (let i = 0; i < Math.min(rssItems.length, limit); i++) {
      const rss = rssItems[i];
      const { cleanTitle, source } = extractSourceFromTitle(rss.title);
      
      if (cleanTitle === "Google 뉴스" || cleanTitle.length < 5) continue;
      
      const pubDateObj = rss.pubDate ? new Date(rss.pubDate) : new Date();
      const date = pubDateObj.toISOString().split("T")[0];
      const time = `${String(pubDateObj.getHours()).padStart(2,"0")}:${String(pubDateObj.getMinutes()).padStart(2,"0")}`;

      items.push({
        id: `news-${category}-${i}`,
        title: cleanTitle,
        source,
        date,
        time,
        category,
        summary: cleanTitle,
        link: rss.link,
      });
    }

    return items;
  } catch (e) {
    console.error(`Error fetching RSS for ${category}:`, e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, portal, limit } = await req.json().catch(() => ({ query: null, portal: "google", limit: 10 }));
    
    const selectedPortal = portal || "google";
    const perFeed = limit || 10;

    let feedUrl: string;
    let category: string;

    if (query && query.trim()) {
      // Keyword search mode
      const searchBuilder = PORTAL_SEARCH[selectedPortal] || PORTAL_SEARCH.google;
      feedUrl = searchBuilder(query.trim());
      category = query.trim();
    } else {
      // Headlines mode
      feedUrl = PORTAL_HEADLINES[selectedPortal] || PORTAL_HEADLINES.google;
      category = "헤드라인";
    }

    const news = await fetchRssFeed(feedUrl, category, perFeed);

    // Sort by date descending
    news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return new Response(JSON.stringify({ news, fetchedAt: new Date().toISOString() }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-news error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
