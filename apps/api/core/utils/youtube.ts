// core/shared/utils/youtube.ts
/* export function extractYoutubeId(url: string) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v");
    }

    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1);
    }

    return null;
  } catch {
    return null;
  }
}


export function extractYoutubeData(url: string) {
  try {
    const parsed = new URL(url);

    const validHosts = [
      "youtube.com",
      "www.youtube.com",
      "m.youtube.com",
      "youtu.be",
    ];

    const isValidHost = validHosts.some(
      (host) =>
        parsed.hostname === host ||
        parsed.hostname.endsWith(`.${host}`),
    );

    if (!isValidHost) {
      return null;
    }

    let videoId: string | null = null;

    // youtube.com/watch?v=
    if (parsed.pathname === "/watch") {
      videoId = parsed.searchParams.get("v");
    }

    // youtu.be/abc123
    else if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.slice(1);
    }

    // youtube.com/embed/abc123
    else if (parsed.pathname.startsWith("/embed/")) {
      videoId = parsed.pathname.split("/embed/")[1];
    }

    // youtube.com/shorts/abc123
    else if (parsed.pathname.startsWith("/shorts/")) {
      videoId = parsed.pathname.split("/shorts/")[1];
    }

    if (!videoId || videoId.length < 6) {
      return null;
    }

    return {
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    };
  } catch {
    return null;
  }
} */