import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set([
  "asian-spices-web.vercel.app",
  "asian-spices.nl",
  "www.asian-spices.nl",
]);

type EmbeddedProductData = {
  title: string | null;
  description: string | null;
  base_price: string | null;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ? decodeHtml(match[1].trim()) : null;
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function absoluteUrl(value: string | null, baseUrl: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function normalizePrice(rawPrice: string | null) {
  if (!rawPrice) {
    return null;
  }

  const trimmed = rawPrice.trim();
  if (!trimmed) {
    return null;
  }

  if (/^[Â£$â‚¬]/.test(trimmed)) {
    return trimmed;
  }

  return `\u00A3${trimmed}`;
}

function extractEmbeddedProductData(html: string, slug: string): EmbeddedProductData {
  const escapedSlug = escapeForRegExp(slug);
  const slugPattern = new RegExp(`"slug":"${escapedSlug}"`);
  const slugMatch = slugPattern.exec(html);

  if (!slugMatch || slugMatch.index < 0) {
    return {
      title: null,
      description: null,
      base_price: null,
    };
  }

  const chunk = html.slice(
    Math.max(0, slugMatch.index - 2500),
    Math.min(html.length, slugMatch.index + 12000),
  );

  return {
    title: extractMatch(chunk, /"name":"([^"]+)"/i),
    description: extractMatch(chunk, /"description":"([^"]+)"/i),
    base_price:
      extractMatch(chunk, /"price":"([^"]+)"/i) ??
      extractMatch(chunk, /"price":([0-9]+(?:\.[0-9]{1,2})?)/i),
  };
}

function extractRawPrice(html: string, slug: string) {
  const embedded = extractEmbeddedProductData(html, slug);
  if (embedded.base_price) {
    return embedded.base_price;
  }

  return (
    extractMatch(html, /"price":"([^"]+)"/i) ??
    extractMatch(html, /"price":([0-9]+(?:\.[0-9]{1,2})?)/i) ??
    extractMatch(
      html,
      /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i,
    )
  );
}

function extractImageUrl(html: string, pageUrl: string) {
  const ogImage = extractMatch(
    html,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  );
  if (ogImage) {
    return absoluteUrl(ogImage, pageUrl);
  }

  const preloadSrcSet = extractMatch(
    html,
    /<link[^>]+rel=["']preload["'][^>]+as=["']image["'][^>]+imageSrcSet=["']([^"']+)["']/i,
  );
  if (preloadSrcSet) {
    const firstCandidate = preloadSrcSet
      .split(",")[0]
      ?.trim()
      .split(" ")[0]
      ?.trim();
    const firstUrl = absoluteUrl(firstCandidate ?? null, pageUrl);
    if (firstUrl) {
      return firstUrl;
    }
  }

  const heroImage = extractMatch(
    html,
    /<img[^>]+alt=["'][^"']+["'][^>]+src=["']([^"']+)["']/i,
  );
  return absoluteUrl(heroImage, pageUrl);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productUrl = searchParams.get("url")?.trim();

  if (!productUrl) {
    return NextResponse.json({ error: "Missing `url` query parameter." }, { status: 400 });
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(productUrl);
  } catch {
    return NextResponse.json({ error: "Invalid product URL." }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
    return NextResponse.json({ error: "Unsupported product URL host." }, { status: 400 });
  }

  try {
    const slug = parsedUrl.pathname.split("/").filter(Boolean).pop() ?? "";
    const response = await fetch(parsedUrl.toString(), {
      cache: "no-store",
      headers: {
        "User-Agent": "BibiChatbot/1.0 (+https://asian-spices-web.vercel.app)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Product page returned ${response.status}.` },
        { status: response.status },
      );
    }

    const html = await response.text();
    const embedded = extractEmbeddedProductData(html, slug);
    const title =
      embedded.title ??
      extractMatch(
        html,
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      ) ??
      extractMatch(html, /<title>([^<]+)<\/title>/i);
    const description =
      embedded.description ??
      extractMatch(
        html,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      );
    const rawPrice = extractRawPrice(html, slug);
    const imageUrl = extractImageUrl(html, parsedUrl.toString());

    return NextResponse.json({
      title,
      description,
      price: normalizePrice(rawPrice),
      imageUrl,
      productUrl: parsedUrl.toString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch product preview.",
      },
      { status: 500 },
    );
  }
}
