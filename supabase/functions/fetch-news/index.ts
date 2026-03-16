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

async function fetchGoogleNewsRss(url: string, category: string, limit: number): Promise<NewsItem[]> {
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
        id: `news-${i}`,
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
    console.error("Google News RSS error:", e);
    return [];
  }
}

// ─── Naver News (via openapi-like search endpoint) ───

async function fetchNaverNews(query: string | null, limit: number): Promise<NewsItem[]> {
  if (!query) query = "뉴스";

  // Use Naver's mobile news search which returns server-rendered HTML
  const url = `https://m.search.naver.com/search.naver?where=m_news&query=${encodeURIComponent(query)}&sort=1&sm=tab_smr`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });

    if (!response.ok) {
      console.error(`Naver fetch failed: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const items: NewsItem[] = [];

    // Parse news_tit elements: <a class="news_tit" href="LINK" title="TITLE">
    const titleRegex = /class="news_tit"[^>]*href="([^"]*)"[^>]*title="([^"]*)"/gi;
    // Parse info_group for source and time
    const infoGroupRegex = /class="info_group"[^>]*>([\s\S]*?)<\/div>/gi;
    const pressRegex = /class="info press"[^>]*>([\s\S]*?)<\/a>/gi;
    const timeInfoRegex = /class="info"[^>]*>(\d+[^<]*전|[\d.]+\.\s*[\d.]+\.\s*[\d.]+[^<]*)<\/span>/gi;
    // Also try to get description
    const descRegex = /class="news_dsc"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/gi;

    const titles: Array<{ link: string; title: string }> = [];
    let m;
    while ((m = titleRegex.exec(html)) !== null) {
      const title = m[2].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
      titles.push({ link: m[1], title });
    }

    const sources: string[] = [];
    while ((m = pressRegex.exec(html)) !== null) {
      sources.push(m[1].replace(/<[^>]*>/g, "").trim());
    }

    const timeInfos: string[] = [];
    while ((m = timeInfoRegex.exec(html)) !== null) {
      timeInfos.push(m[1].replace(/<[^>]*>/g, "").trim());
    }

    const descriptions: string[] = [];
    while ((m = descRegex.exec(html)) !== null) {
      descriptions.push(m[1].replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim());
    }

    console.log(`Naver parse: ${titles.length} titles, ${sources.length} sources, ${timeInfos.length} times`);

    const now = new Date();
    for (let i = 0; i < Math.min(titles.length, limit); i++) {
      const t = titles[i];
      if (t.title.length < 5) continue;

      let date = now.toISOString().split("T")[0];
      let time = "";
      const rawTime = timeInfos[i] || "";

      const hoursAgo = rawTime.match(/(\d+)시간\s*전/);
      const minsAgo = rawTime.match(/(\d+)분\s*전/);
      const daysAgo = rawTime.match(/(\d+)일\s*전/);

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
      }

      items.push({
        id: `naver-${i}`,
        title: t.title,
        source: sources[i] || "네이버뉴스",
        date,
        time: time || undefined,
        category: query || "뉴스",
        summary: descriptions[i] || t.title,
        link: t.link,
      });
    }

    return items;
  } catch (e) {
    console.error("Naver News error:", e);
    return [];
  }
}

// ─── Daum News ───

async function fetchDaumNews(query: string | null, limit: number): Promise<NewsItem[]> {
  if (!query) query = "뉴스";

  const url = `https://search.daum.net/search?w=news&q=${encodeURIComponent(query)}&sort=recency`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
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

    // Daum news titles
    const titleRegex = /class="[^"]*tit-g[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
    const sourceRegex = /class="[^"]*info_cp[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

    const titles: Array<{ link: string; title: string }> = [];
    let m;
    while ((m = titleRegex.exec(html)) !== null) {
      const title = m[2].replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
      if (title.length >= 5) {
        titles.push({ link: m[1], title });
      }
    }

    const sources: string[] = [];
    while ((m = sourceRegex.exec(html)) !== null) {
      sources.push(m[1].replace(/<[^>]*>/g, "").trim());
    }

    console.log(`Daum parse: ${titles.length} titles`);

    const now = new Date();
    for (let i = 0; i < Math.min(titles.length, limit); i++) {
      const t = titles[i];
      items.push({
        id: `daum-${i}`,
        title: t.title,
        source: sources[i] || "다음뉴스",
        date: now.toISOString().split("T")[0],
        category: query || "뉴스",
        summary: t.title,
        link: t.link,
      });
    }

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
      default: {
        const url = query
          ? `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`
          : `https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko`;
        news = await fetchGoogleNewsRss(url, query || "헤드라인", perFeed);
        break;
      }
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
