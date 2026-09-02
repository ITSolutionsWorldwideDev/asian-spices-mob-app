import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set([
  "asian-spices-web.vercel.app",
  "asian-spices.nl",
  "www.asian-spices.nl",
]);

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
    return absoluteUrl(firstCandidate ?? null, pageUrl);
  }

  return absoluteUrl(
    extractMatch(
      html,
      /<img[^>]+alt=["'][^"']+["'][^>]+src=["']([^"']+)["']/i,
    ),
    pageUrl,
  );
}

function extractYouTubeUrl(html: string) {
  return (
    extractMatch(
      html,
      /(https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|shorts\/)[^"' <]+)/i,
    ) ??
    extractMatch(
      html,
      /(https?:\/\/youtu\.be\/[^"' <]+)/i,
    )
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recipeUrl = searchParams.get("url")?.trim();

  if (!recipeUrl) {
    return NextResponse.json({ error: "Missing `url` query parameter." }, { status: 400 });
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(recipeUrl);
  } catch {
    return NextResponse.json({ error: "Invalid recipe URL." }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
    return NextResponse.json({ error: "Unsupported recipe URL host." }, { status: 400 });
  }

  try {
    const response = await fetch(parsedUrl.toString(), {
      cache: "no-store",
      headers: {
        "User-Agent": "BibiChatbot/1.0 (+https://asian-spices-web.vercel.app)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Recipe page returned ${response.status}.` },
        { status: response.status },
      );
    }

    const html = await response.text();
    const title =
      extractMatch(
        html,
        /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      ) ??
      extractMatch(html, /<title>([^<]+)<\/title>/i);
    const description = extractMatch(
      html,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    );
    const imageUrl = extractImageUrl(html, parsedUrl.toString());
    const youtubeUrl = extractYouTubeUrl(html);

    return NextResponse.json({
      title,
      description,
      imageUrl,
      youtubeUrl,
      recipeUrl: parsedUrl.toString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch recipe preview.",
      },
      { status: 500 },
    );
  }
}
