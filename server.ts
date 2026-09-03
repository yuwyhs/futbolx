import { serveDir } from "jsr:@std/http/file-server";

// ---------- FLUSSONIC TOKEN HELPERS ----------

async function sha1Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function randomHex(bytes = 8): string {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);

  return Array.from(array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // ---------- API ROUTES ----------

  // /api/token?stream=test
  if (path === "/api/token" || path === "/api/token/") {
    try {
      const stream = url.searchParams.get("stream");

      if (!stream) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Missing stream parameter",
          }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          },
        );
      }

      const SECRET_KEY =
        Deno.env.get("STREAM_SECRET_KEY") ||
        "my_super_secret_key_123";

      const CDN_BASE_URL =
        Deno.env.get("CDN_BASE_URL") ||
        "https://germany.fut.ryzn.pro";

      // Get client IP from proxy headers
      const forwardedFor = req.headers.get("x-forwarded-for");

      const userIp =
        forwardedFor?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";

      // TEMPORARY DEBUG
      console.log("TOKEN DEBUG:", {
        stream,
        userIp,
        forwardedFor,
        realIp: req.headers.get("x-real-ip"),
        cfConnectingIp: req.headers.get("cf-connecting-ip"),
        host: req.headers.get("host"),
        cdn: CDN_BASE_URL,
      });

      const now = Math.floor(Date.now() / 1000);

      const start = now - 300;
      const end = now + 60;

      const salt = randomHex(8);

      // Same Flussonic SHA1 formula used by token.js
      const stringToHash =
        `${stream}${userIp}${start}${end}${SECRET_KEY}${salt}`;

      const hash = await sha1Hex(stringToHash);

      const token = `${hash}-${salt}-${end}-${start}`;

      const tokenizedUrl =
        `${CDN_BASE_URL.replace(/\/+$/, "")}/${stream}/index.m3u8?token=${token}`;

      return new Response(
        JSON.stringify({
          url: tokenizedUrl,
          debug: {
            stream,
            userIp,
            forwardedFor,
            realIp: req.headers.get("x-real-ip"),
            cfConnectingIp: req.headers.get("cf-connecting-ip"),
            host: req.headers.get("host"),
            cdn: CDN_BASE_URL,
            start,
            end,
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    } catch (error) {
      console.error("Token handler failed:", error);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Token handler failed",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
  }

  // /api/stream  →  serve api/stream.json
  if (path === "/api/stream" || path === "/api/stream/") {
    try {
      const file = await Deno.readFile("./api/stream.json");
      return new Response(file, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch {
      return new Response(JSON.stringify({ success: false, categories: [] }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // /api/stream-24-7  →  serve api/stream-24-7.json
  if (path === "/api/stream-24-7" || path === "/api/stream-24-7/") {
    try {
      const file = await Deno.readFile("./api/stream-24-7.json");
      return new Response(file, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch {
      return new Response(JSON.stringify({ success: false }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Any other /api/*.json (football.json, nba.json, etc.)
  if (path.startsWith("/api/") && path.endsWith(".json")) {
    try {
      const file = await Deno.readFile(`.${path}`);
      return new Response(file, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } catch {
      return new Response(JSON.stringify({ success: false, streams: [] }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Optional: support dynamic .js handlers if you ever need them
  if (path.startsWith("/api/") && path.endsWith(".js")) {
    try {
      const handler = await import(`.${path}`);

      if (typeof handler.default === "function") {
        return await handler.default(req);
      }
    } catch {
      // fall through
    }
  }

  // ---------- PAGE REWRITES ----------

  if (path === "/auth/login") {
    return serveDir(
      new Request(new URL("/auth/login.html", req.url), req),
      { fsRoot: "." },
    );
  }

  if (path === "/auth/signup") {
    return serveDir(
      new Request(new URL("/auth/signup.html", req.url), req),
      { fsRoot: "." },
    );
  }

  if (path === "/dashboard") {
    return serveDir(
      new Request(new URL("/dashboard.html", req.url), req),
      { fsRoot: "." },
    );
  }

  if (path.startsWith("/live/")) {
    return serveDir(
      new Request(new URL("/live.html", req.url), req),
      { fsRoot: "." },
    );
  }

  if (path.startsWith("/live-24-7/")) {
    return serveDir(
      new Request(new URL("/live-24-7.html", req.url), req),
      { fsRoot: "." },
    );
  }

  if (path === "/vip") {
    return serveDir(
      new Request(new URL("/vip.html", req.url), req),
      { fsRoot: "." },
    );
  }

  if (path === "/24-7") {
    return serveDir(
      new Request(new URL("/24-7.html", req.url), req),
      { fsRoot: "." },
    );
  }

  // ---------- STATIC FILES + FALLBACK ----------

  const res = await serveDir(req, {
    fsRoot: ".",
    urlRoot: "",
    showDirListing: false,
    enableCors: true,
  });

  // SPA fallback
  if (res.status === 404) {
    return serveDir(
      new Request(new URL("/index.html", req.url), req),
      { fsRoot: "." },
    );
  }

  return res;
});
