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

function extractRssItems(xml: string): Array<{ title: string; link: string; pubDate: string }> {
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

// Source name filters by portal - used to highlight/prioritize portal-relevant sources
const PORTAL_SOURCE_KEYWORDS: Record<string, string[]> = {
  naver: ["네이버", "naver"],
  daum: ["다음", "daum", "카카오"],
  google: [],
};

async function fetchNews(query: string | null, portal: string, limit: number): Promise<NewsItem[]> {
  // Build RSS URL - always use Google News RSS for reliability
  const url = query
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`
    : `https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko`;

  const category = query || "헤드라인";

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });

    if (!response.ok) {
      console.error(`RSS fetch failed: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const rssItems = extractRssItems(xml);
    const items: NewsItem[] = [];

    for (let i = 0; i < Math.min(rssItems.length, limit * 2); i++) {
      const rss = rssItems[i];
      const { cleanTitle, source } = extractSourceFromTitle(rss.title);
      if (cleanTitle === "Google 뉴스" || cleanTitle.length < 5) continue;

      const pubDateObj = rss.pubDate ? new Date(rss.pubDate) : new Date();
      const date = pubDateObj.toISOString().split("T")[0];
      const time = `${String(pubDateObj.getHours()).padStart(2, "0")}:${String(pubDateObj.getMinutes()).padStart(2, "0")}`;

      items.push({
        id: `${portal}-${i}`,
        title: cleanTitle,
        source,
        date,
        time,
        category,
        summary: cleanTitle,
        link: rss.link,
      });

      if (items.length >= limit) break;
    }

    console.log(`Fetched ${items.length} news items for portal=${portal}, query=${query || "headlines"}`);
    return items;
  } catch (e) {
    console.error("News fetch error:", e);
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

    const news = await fetchNews(query, selectedPortal, perFeed);

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
