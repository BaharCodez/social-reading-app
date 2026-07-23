import "server-only";

/* The newsstand: engineering blogs with real RSS/Atom feeds. Uber's feed
   was retired upstream, so it's not on the list. */

export interface DailyArticle {
  source: string;
  title: string;
  url: string;
}

const FEEDS = [
  { source: "Netflix Tech Blog", url: "https://netflixtechblog.com/feed" },
  {
    source: "Pinterest Engineering",
    url: "https://medium.com/feed/pinterest-engineering",
  },
  { source: "Stripe Blog", url: "https://stripe.com/blog/feed.rss" },
  { source: "Cloudflare Blog", url: "https://blog.cloudflare.com/rss/" },
  { source: "Meta Engineering", url: "https://engineering.fb.com/feed/" },
  {
    source: "Google Developers",
    url: "https://developers.googleblog.com/feeds/posts/default",
  },
  { source: "Martin Fowler", url: "https://martinfowler.com/feed.atom" },
  { source: "InfoQ", url: "https://feed.infoq.com/" },
];

/* Just enough XML reading for feed titles + links; not a real parser.
   Handles RSS 2.0 (<item><link>text</link>) and Atom (<entry><link href/>). */
function unescapeXml(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function parseFeed(xml: string, source: string): DailyArticle[] {
  const articles: DailyArticle[] = [];
  const blocks =
    xml.match(/<(?:item|entry)[\s>][\s\S]*?<\/(?:item|entry)>/g) ?? [];
  for (const block of blocks.slice(0, 10)) {
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/)?.[1];
    const url =
      block.match(/<link[^>]*href="([^"]+)"/)?.[1] ??
      block.match(/<link[^>]*>([\s\S]*?)<\/link>/)?.[1];
    if (title && url) {
      articles.push({
        source,
        title: unescapeXml(title),
        url: unescapeXml(url),
      });
    }
  }
  return articles;
}

async function fetchFeed(feed: {
  source: string;
  url: string;
}): Promise<DailyArticle[]> {
  const res = await fetch(feed.url, {
    headers: { "user-agent": "bahars-house/1.0 (+daily room newsstand)" },
    signal: AbortSignal.timeout(6000),
    // One trip to the newsstand per hour is plenty.
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return parseFeed(await res.text(), feed.source);
}

/* Same day → same article, so the pick doesn't shuffle on every refresh. */
function dayHash(day: string) {
  let h = 0;
  for (const c of day) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export async function articleOfTheDay(
  day: string,
): Promise<DailyArticle | null> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const pool = results
    .filter((r) => r.status === "fulfilled")
    .flatMap((r) => r.value);
  if (pool.length === 0) return null;

  // Spread picks across sources: hash chooses the source bucket first,
  // then one of that source's recent posts.
  const sources = [...new Set(pool.map((a) => a.source))];
  const h = dayHash(day);
  const source = sources[h % sources.length];
  const fromSource = pool.filter((a) => a.source === source);
  return fromSource[h % fromSource.length];
}
