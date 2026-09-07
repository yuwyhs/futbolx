import { serveDir } from "jsr:@std/http/file-server";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // ---------- API ROUTES ----------

  // /api/stream -> api/stream.json
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
      return new Response(
        JSON.stringify({
          success: false,
          categories: [],
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
  }

  // /api/stream-24-7 -> api/stream-24-7.json
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
      return new Response(
        JSON.stringify({
          success: false,
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
  }

  // Any other /api/*.json
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
      return new Response(
        JSON.stringify({
          success: false,
          streams: [],
        }),
        {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }
  }

  // ---------- PAGE ROUTES ----------

  // /auth/login -> /auth/login.html
  if (path === "/auth/login") {
    return serveDir(
      new Request(new URL("/auth/login.html", req.url), req),
      { fsRoot: "." },
    );
  }

  // /auth/signup -> /auth/signup.html
  if (path === "/auth/signup") {
    return serveDir(
      new Request(new URL("/auth/signup.html", req.url), req),
      { fsRoot: "." },
    );
  }

  // /dashboard -> /dashboard.html
  if (path === "/dashboard") {
    return serveDir(
      new Request(new URL("/dashboard.html", req.url), req),
      { fsRoot: "." },
    );
  }

  // /live/* -> /live.html
  if (path.startsWith("/live/")) {
    return serveDir(
      new Request(new URL("/live.html", req.url), req),
      { fsRoot: "." },
    );
  }

  // /live-24-7/* -> /live-24-7.html
  if (path.startsWith("/live-24-7/")) {
    return serveDir(
      new Request(new URL("/live-24-7.html", req.url), req),
      { fsRoot: "." },
    );
  }

  // /vip -> /vip.html
  if (path === "/vip") {
    return serveDir(
      new Request(new URL("/vip.html", req.url), req),
      { fsRoot: "." },
    );
  }

  // /24-7 -> /24-7.html
  if (path === "/24-7") {
    return serveDir(
      new Request(new URL("/24-7.html", req.url), req),
      { fsRoot: "." },
    );
  }

  // ---------- STATIC FILES ----------

  const res = await serveDir(req, {
    fsRoot: ".",
    urlRoot: "",
    showDirListing: false,
    enableCors: true,
  });

  // ---------- FALLBACK ----------

  // Anything that isn't a real file goes to index.html
  if (res.status === 404) {
    return serveDir(
      new Request(new URL("/index.html", req.url), req),
      { fsRoot: "." },
    );
  }

  return res;
});
