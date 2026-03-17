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

interface RssItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
}

function extractRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i)?.[1]?.trim() || "";
    const link = block.match(/<link>([\s\S]*?)<\/link>/i)?.[1]?.trim() || "";
    const pubDate = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() || "";
    const description = block.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i)?.[1]?.trim() || "";
    items.push({ title, link, pubDate, description });
  }
  return items;
}

function stripHtml(html: string): string {
  // Decode HTML entities first, then strip tags
  const decoded = html
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
  return decoded.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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

async function fetchWithRetry(url: string, retries = 2): Promise<Response | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
      });
      if (resp.ok) return resp;
      console.error(`Fetch attempt ${i + 1} failed: ${resp.status} for ${url}`);
    } catch (e) {
      console.error(`Fetch attempt ${i + 1} error:`, e);
    }
    if (i < retries) await new Promise(r => setTimeout(r, 500 * (i + 1)));
  }
  return null;
}

function buildRssUrl(portal: string, query: string | null): string[] {
  // Return array of URLs to try in order (fallback chain)
  const urls: string[] = [];

  if (portal === "naver" && query) {
    // Naver news search RSS
    urls.push(`https://news.search.naver.com/rss?query=${encodeURIComponent(query)}&field=0&nx_search_query=${encodeURIComponent(query)}`);
  }

  if (portal === "daum" && query) {
    // Daum doesn't have public RSS search, use Google with site filter
    urls.push(`https://news.google.com/rss/search?q=${encodeURIComponent(query + " site:v.daum.net")}&hl=ko&gl=KR&ceid=KR:ko`);
  }

  // Google News RSS as primary or fallback
  if (query) {
    urls.push(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`);
  } else {
    urls.push(`https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko`);
  }

  return urls;
}

// Also supports fetching arbitrary RSS feed URLs
async function fetchRssFeed(feedUrl: string, limit: number): Promise<NewsItem[]> {
  const resp = await fetchWithRetry(feedUrl);
  if (!resp) return [];
  const xml = await resp.text();
  const rssItems = extractRssItems(xml);
  const items: NewsItem[] = [];

  for (let i = 0; i < Math.min(rssItems.length, limit * 2); i++) {
    const rss = rssItems[i];
    const { cleanTitle, source } = extractSourceFromTitle(rss.title);
    if (cleanTitle.length < 5) continue;

    const pubDateObj = rss.pubDate ? new Date(rss.pubDate) : new Date();
    const date = pubDateObj.toISOString().split("T")[0];
    const time = `${String(pubDateObj.getHours()).padStart(2, "0")}:${String(pubDateObj.getMinutes()).padStart(2, "0")}`;
    const summary = rss.description ? stripHtml(rss.description).slice(0, 120) : cleanTitle;

    items.push({
      id: `feed-${i}-${Date.now()}`,
      title: cleanTitle,
      source,
      date,
      time,
      category: "RSS",
      summary,
      link: rss.link,
    });

    if (items.length >= limit) break;
  }
  return items;
}

async function fetchNews(query: string | null, portal: string, limit: number): Promise<NewsItem[]> {
  const urls = buildRssUrl(portal, query);
  const category = query || "헤드라인";

  for (const url of urls) {
    const resp = await fetchWithRetry(url);
    if (!resp) continue;

    const xml = await resp.text();
    const rssItems = extractRssItems(xml);
    const items: NewsItem[] = [];

    for (let i = 0; i < Math.min(rssItems.length, limit * 2); i++) {
      const rss = rssItems[i];
      const { cleanTitle, source } = extractSourceFromTitle(rss.title);
      if (cleanTitle === "Google 뉴스" || cleanTitle.length < 5) continue;

      const pubDateObj = rss.pubDate ? new Date(rss.pubDate) : new Date();
      const date = pubDateObj.toISOString().split("T")[0];
      const time = `${String(pubDateObj.getHours()).padStart(2, "0")}:${String(pubDateObj.getMinutes()).padStart(2, "0")}`;
      const summary = rss.description ? stripHtml(rss.description).slice(0, 120) : cleanTitle;

      items.push({
        id: `${portal}-${i}-${Date.now()}`,
        title: cleanTitle,
        source,
        date,
        time,
        category,
        summary,
        link: rss.link,
      });

      if (items.length >= limit) break;
    }

    if (items.length > 0) {
      console.log(`Fetched ${items.length} news from ${url}`);
      return items;
    }
  }

  console.error(`No news fetched for portal=${portal}, query=${query}`);
  return [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { query, portal, limit, feedUrl } = body as any;

    // If feedUrl is provided, fetch that RSS feed directly
    if (feedUrl) {
      const items = await fetchRssFeed(feedUrl, limit || 20);
      return new Response(JSON.stringify({ news: items, fetchedAt: new Date().toISOString() }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const news = await fetchNews(query || null, portal || "google", limit || 10);

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
