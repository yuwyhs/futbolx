import { serveDir } from "jsr:@std/http/file-server";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // ---------- API ROUTES ----------

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
    return serveDir(new Request(new URL("/auth/login.html", req.url), req), { fsRoot: "." });
  }
  if (path === "/auth/signup") {
    return serveDir(new Request(new URL("/auth/signup.html", req.url), req), { fsRoot: "." });
  }
  if (path === "/dashboard") {
    return serveDir(new Request(new URL("/dashboard.html", req.url), req), { fsRoot: "." });
  }
  if (path.startsWith("/live/")) {
    return serveDir(new Request(new URL("/live.html", req.url), req), { fsRoot: "." });
  }
  if (path.startsWith("/live-24-7/")) {
    return serveDir(new Request(new URL("/live-24-7.html", req.url), req), { fsRoot: "." });
  }
  if (path === "/vip") {
    return serveDir(new Request(new URL("/vip.html", req.url), req), { fsRoot: "." });
  }
  if (path === "/24-7") {
    return serveDir(new Request(new URL("/24-7.html", req.url), req), { fsRoot: "." });
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
    return serveDir(new Request(new URL("/index.html", req.url), req), { fsRoot: "." });
  }

  return res;
});
