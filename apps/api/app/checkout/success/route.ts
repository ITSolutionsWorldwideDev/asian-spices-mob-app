import { NextRequest, NextResponse } from "next/server";

function appendQuery(baseUrl: string, params: URLSearchParams) {
  const query = params.toString();
  if (!query) return baseUrl;
  return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}${query}`;
}

function buildDeepLink(req: NextRequest) {
  const appReturnUrl = req.nextUrl.searchParams.get("appReturnUrl")?.trim();
  const baseDeepLink = appReturnUrl || "asainspicesmobapp://payment-return";
  const params = new URLSearchParams(req.nextUrl.searchParams);
  params.delete("appReturnUrl");
  return appendQuery(baseDeepLink, params);
}

export async function GET(req: NextRequest) {
  const deepLink = buildDeepLink(req);

  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Returning to app...</title>
  </head>
  <body style="font-family: Arial, sans-serif; padding: 24px;">
    <p>Returning to app...</p>
    <p>If the app does not open automatically, tap below:</p>
    <p><a href="${deepLink}">Open Asian Spices App</a></p>
    <script>
      window.location.replace(${JSON.stringify(deepLink)});
      setTimeout(function () {
        window.location.href = ${JSON.stringify(deepLink)};
      }, 800);
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
