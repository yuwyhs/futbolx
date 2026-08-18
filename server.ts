import { serveDir } from "jsr:@std/http/file-server";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // 1. Execute Dynamic API Endpoints
  if (path === "/api/stream" || path === "/api/stream.js") {
    try {
      const handler = await import("./api/stream.js");
      // Calls default export function (req, res) or web standard handler
      return await handler.default(req); 
    } catch (err) {
      // Fallback: serve stream.json directly if static
      return serveDir(new Request(new URL("/api/stream.json", req.url), req), { fsRoot: "." });
    }
  }

  if (path === "/api/stream-24-7" || path === "/api/stream-24-7.js") {
    try {
      const handler = await import("./api/stream-24-7.js");
      return await handler.default(req);
    } catch (err) {
      return serveDir(new Request(new URL("/api/stream-24-7.json", req.url), req), { fsRoot: "." });
    }
  }

  // Handle generic /api/*.js dynamic calls
  if (path.startsWith("/api/") && path.endsWith(".js")) {
    try {
      const handler = await import(`.${path}`);
      return await handler.default(req);
    } catch {
      // Skip to file server if import fails
    }
  }

  // 2. Auth Routes
  if (path === "/auth/login") {
    return serveDir(new Request(new URL("/auth/login.html", req.url), req), { fsRoot: "." });
  }
  if (path === "/auth/signup") {
    return serveDir(new Request(new URL("/auth/signup.html", req.url), req), { fsRoot: "." });
  }

  // 3. Dynamic Page Rewrites
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

  // 4. Default Static File Server
  const res = await serveDir(req, { fsRoot: "." });
  if (res.status === 404) {
    return serveDir(new Request(new URL("/index.html", req.url), req), { fsRoot: "." });
  }

  return res;
});
