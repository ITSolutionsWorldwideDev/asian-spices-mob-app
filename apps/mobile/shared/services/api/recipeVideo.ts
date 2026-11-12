const YOUTUBE_THUMBNAIL_FALLBACK = "https://img.youtube.com/vi/aqz-KE-bpKQ/hqdefault.jpg";

/** YouTube requires a valid embed origin/referrer in WebViews (fixes error 153). */
export const REEL_EMBED_ORIGIN = "https://com.mavia321.asainspicesmobapp";

export function buildYouTubeEmbedHtml(videoId: string, muted: boolean): string {
  const muteParam = muted ? 1 : 0;
  const embedSrc =
    `https://www.youtube-nocookie.com/embed/${videoId}` +
    `?autoplay=1&playsinline=1&controls=0&rel=0&modestbranding=1` +
    `&loop=1&playlist=${videoId}&mute=${muteParam}&enablejsapi=1`;

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #000; overflow: hidden; }
      iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
    </style>
  </head>
  <body>
    <iframe
      id="yt"
      src="${embedSrc}"
      title="Recipe reel"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
    <script>
      var iframe = document.getElementById("yt");
      iframe.addEventListener("load", function () {
        iframe.contentWindow.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*");
      });
      window.addEventListener("message", function (e) {
        try {
          var data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
          var duration = data && data.info && data.info.duration;
          if (duration && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ duration: duration }));
          }
        } catch (err) {}
      });
    </script>
  </body>
</html>`;
}

export function extractYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.includes("youtube.com")) {
      if (parsed.pathname.startsWith("/shorts/")) {
        const id = parsed.pathname.split("/")[2];
        return id || null;
      }

      if (parsed.pathname.startsWith("/embed/")) {
        const id = parsed.pathname.split("/")[2];
        return id || null;
      }

      const id = parsed.searchParams.get("v");
      return id || null;
    }

    if (host.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim();
      return id || null;
    }

    return null;
  } catch {
    return null;
  }
}

export function getYouTubeThumbnail(url?: string | null): string {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    return YOUTUBE_THUMBNAIL_FALLBACK;
  }
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function isYouTubeLink(url?: string | null) {
  return extractYouTubeVideoId(url) !== null;
}

export function isDirectVideoUrl(url?: string | null) {
  if (!url) return false;
  return /^(https?:\/\/|file:).+\.(mp4|m3u8|mov)(\?.*)?$/i.test(url);
}

export function formatCompactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value || 0);
}

export function formatVideoClock(seconds: number): string {
  if (!seconds || seconds <= 0) return "";
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

async function getYouTubeDurationSeconds(videoId: string): Promise<number> {
  try {
    const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "ANDROID",
            clientVersion: "19.10.39",
          },
        },
        videoId,
      }),
    });
    const data = (await res.json()) as { videoDetails?: { lengthSeconds?: string } };
    return Number(data?.videoDetails?.lengthSeconds) || 0;
  } catch {
    return 0;
  }
}

export async function getYouTubeStatsMap(videoIds: string[]) {
  const ids = [...new Set(videoIds.filter(Boolean))];
  const rows = await Promise.all(
    ids.map(async (id) => {
      try {
        const [votesRes, durationSeconds] = await Promise.all([
          fetch(`https://returnyoutubedislikeapi.com/votes?videoId=${encodeURIComponent(id)}`),
          getYouTubeDurationSeconds(id),
        ]);
        const data = (await votesRes.json()) as {
          likes?: number;
          rawLikes?: number;
          viewCount?: number;
          comments?: number;
        };
        return [
          id,
          {
            likes: Number(data.likes) || Number(data.rawLikes) || 0,
            views: Number(data.viewCount) || 0,
            comments: Number(data.comments) || 0,
            durationSeconds,
          },
        ] as const;
      } catch {
        return [id, { likes: 0, views: 0, comments: 0, durationSeconds: 0 }] as const;
      }
    }),
  );
  return Object.fromEntries(rows);
}
