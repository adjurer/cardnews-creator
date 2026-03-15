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
  category: string;
  summary: string;
  link: string;
}

// Google News RSS categories for Korean news
const CATEGORY_FEEDS: Record<string, string> = {
  "헤드라인": "https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko",
  "Tech": "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko",
  "경제": "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko",
  "사회": "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtdHZHZ0pMVWlnQVAB?hl=ko&gl=KR&ceid=KR:ko",
};

function extractTextFromXml(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([^\\]]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*?)<\\/${tag}>`, "gi");
  const results: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[1] || match[2] || "");
  }
  return results;
}

function extractSourceFromTitle(title: string): { cleanTitle: string; source: string } {
  // Google News titles format: "Article Title - Source Name"
  const lastDash = title.lastIndexOf(" - ");
  if (lastDash > 0) {
    return {
      cleanTitle: title.substring(0, lastDash).trim(),
      source: title.substring(lastDash + 3).trim(),
    };
  }
  return { cleanTitle: title, source: "뉴스" };
}

async function fetchRssFeed(url: string, category: string, limit: number = 5): Promise<NewsItem[]> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CardNewsBot/1.0)" },
    });
    
    if (!response.ok) {
      console.error(`RSS fetch failed for ${category}: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    
    const titles = extractTextFromXml(xml, "title");
    const links = extractTextFromXml(xml, "link");
    const pubDates = extractTextFromXml(xml, "pubDate");
    const descriptions = extractTextFromXml(xml, "description");

    // Skip first title/link (feed title)
    const items: NewsItem[] = [];
    for (let i = 1; i < Math.min(titles.length, limit + 1); i++) {
      const { cleanTitle, source } = extractSourceFromTitle(titles[i]);
      
      // Clean description (remove HTML tags)
      const rawDesc = descriptions[i] || "";
      const cleanDesc = rawDesc.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/gi, " ").trim();
      
      const date = pubDates[i - 1] 
        ? new Date(pubDates[i - 1]).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

      items.push({
        id: `news-${category}-${i}`,
        title: cleanTitle,
        source,
        date,
        category,
        summary: cleanDesc.slice(0, 120) || cleanTitle,
        link: links[i] || "",
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
    const { categories, limit } = await req.json().catch(() => ({ categories: null, limit: 5 }));
    
    const selectedCategories = categories || Object.keys(CATEGORY_FEEDS);
    const perCategory = limit || 5;

    // Fetch all categories in parallel
    const results = await Promise.all(
      selectedCategories
        .filter((cat: string) => CATEGORY_FEEDS[cat])
        .map((cat: string) => fetchRssFeed(CATEGORY_FEEDS[cat], cat, perCategory))
    );

    const allNews = results.flat();

    // Sort by date descending
    allNews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return new Response(JSON.stringify({ news: allNews, fetchedAt: new Date().toISOString() }), {
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
