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

// ─── Google News RSS ───

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

async function fetchGoogleNews(query: string | null, limit: number): Promise<NewsItem[]> {
  const url = query
    ? `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`
    : `https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko`;

  const category = query || "헤드라인";

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });

    if (!response.ok) {
      console.error(`Google RSS fetch failed: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    const rssItems = extractRssItems(xml);
    const items: NewsItem[] = [];

    for (let i = 0; i < Math.min(rssItems.length, limit); i++) {
      const rss = rssItems[i];
      const { cleanTitle, source } = extractSourceFromTitle(rss.title);
      if (cleanTitle === "Google 뉴스" || cleanTitle.length < 5) continue;

      const pubDateObj = rss.pubDate ? new Date(rss.pubDate) : new Date();
      const date = pubDateObj.toISOString().split("T")[0];
      const time = `${String(pubDateObj.getHours()).padStart(2, "0")}:${String(pubDateObj.getMinutes()).padStart(2, "0")}`;

      items.push({
        id: `google-${i}`,
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
    console.error("Google News error:", e);
    return [];
  }
}

// ─── Naver News HTML Parser ───

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, ""); // strip remaining tags
}

async function fetchNaverNews(query: string | null, limit: number): Promise<NewsItem[]> {
  if (!query) query = "오늘";

  const url = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(query)}&sort=1&sm=tab_smr&nso=so:dd,p:all`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      },
    });

    if (!response.ok) {
      console.error(`Naver fetch failed: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const items: NewsItem[] = [];

    // Extract news items using news_tit class (title + link)
    const titleRegex = /<a[^>]*class="news_tit"[^>]*href="([^"]*)"[^>]*title="([^"]*)"/gi;
    // Extract press/source
    const pressRegex = /<a[^>]*class="info press"[^>]*>([^<]*)<\/a>/gi;
    // Extract relative time info
    const timeRegex = /<span class="info">\s*(\d+[^\s<]*전|[\d.]+\.[\d.]+\.[\d.]+[^<]*|\d{4}\.\d{2}\.\d{2}\.?[^<]*)<\/span>/gi;

    const titles: Array<{ link: string; title: string }> = [];
    let m;
    while ((m = titleRegex.exec(html)) !== null) {
      titles.push({ link: m[1], title: decodeHtmlEntities(m[2]) });
    }

    const sources: string[] = [];
    while ((m = pressRegex.exec(html)) !== null) {
      sources.push(decodeHtmlEntities(m[1]).trim());
    }

    const times: string[] = [];
    while ((m = timeRegex.exec(html)) !== null) {
      times.push(decodeHtmlEntities(m[1]).trim());
    }

    for (let i = 0; i < Math.min(titles.length, limit); i++) {
      const t = titles[i];
      if (t.title.length < 5) continue;

      const rawTime = times[i] || "";
      const now = new Date();
      let date = now.toISOString().split("T")[0];
      let time = "";

      // Parse relative time like "3시간 전", "25분 전"
      const hoursAgo = rawTime.match(/(\d+)시간\s*전/);
      const minsAgo = rawTime.match(/(\d+)분\s*전/);
      const daysAgo = rawTime.match(/(\d+)일\s*전/);
      const dateMatch = rawTime.match(/(\d{4})\.(\d{2})\.(\d{2})/);

      if (hoursAgo) {
        const d = new Date(now.getTime() - parseInt(hoursAgo[1]) * 3600000);
        date = d.toISOString().split("T")[0];
        time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      } else if (minsAgo) {
        const d = new Date(now.getTime() - parseInt(minsAgo[1]) * 60000);
        date = d.toISOString().split("T")[0];
        time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      } else if (daysAgo) {
        const d = new Date(now.getTime() - parseInt(daysAgo[1]) * 86400000);
        date = d.toISOString().split("T")[0];
      } else if (dateMatch) {
        date = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }

      items.push({
        id: `naver-${i}`,
        title: t.title,
        source: sources[i] || "네이버뉴스",
        date,
        time: time || undefined,
        category: query || "헤드라인",
        summary: t.title,
        link: t.link,
      });
    }

    console.log(`Naver: parsed ${items.length} items for "${query}"`);
    return items;
  } catch (e) {
    console.error("Naver News error:", e);
    return [];
  }
}

// ─── Daum News HTML Parser ───

async function fetchDaumNews(query: string | null, limit: number): Promise<NewsItem[]> {
  if (!query) query = "오늘";

  const url = `https://search.daum.net/search?w=news&q=${encodeURIComponent(query)}&sort=recency`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });

    if (!response.ok) {
      console.error(`Daum fetch failed: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const items: NewsItem[] = [];

    // Daum news titles in <a class="tit-g clamp-g" ...>
    const titleRegex = /<a[^>]*class="[^"]*tit-g[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const sourceRegex = /<span[^>]*class="[^"]*wrap_comm[^"]*"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/gi;

    const titles: Array<{ link: string; title: string }> = [];
    let m;
    while ((m = titleRegex.exec(html)) !== null) {
      const title = decodeHtmlEntities(m[2]).trim();
      if (title.length >= 5) {
        titles.push({ link: m[1], title });
      }
    }

    const sources: string[] = [];
    while ((m = sourceRegex.exec(html)) !== null) {
      sources.push(decodeHtmlEntities(m[1]).trim());
    }

    const now = new Date();
    for (let i = 0; i < Math.min(titles.length, limit); i++) {
      const t = titles[i];
      items.push({
        id: `daum-${i}`,
        title: t.title,
        source: sources[i] || "다음뉴스",
        date: now.toISOString().split("T")[0],
        category: query || "헤드라인",
        summary: t.title,
        link: t.link,
      });
    }

    console.log(`Daum: parsed ${items.length} items for "${query}"`);
    return items;
  } catch (e) {
    console.error("Daum News error:", e);
    return [];
  }
}

// ─── Main Handler ───

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, portal, limit } = await req.json().catch(() => ({ query: null, portal: "google", limit: 10 }));

    const selectedPortal = portal || "google";
    const perFeed = limit || 10;

    let news: NewsItem[] = [];

    switch (selectedPortal) {
      case "naver":
        news = await fetchNaverNews(query, perFeed);
        break;
      case "daum":
        news = await fetchDaumNews(query, perFeed);
        break;
      case "google":
      default:
        news = await fetchGoogleNews(query, perFeed);
        break;
    }

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
