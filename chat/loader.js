// FutbolX Chat Loader
// Mounts the separated chat UI/admin markup and then starts the chat engine.
(async function loadFutbolXChat() {
  const mount = document.getElementById("futbolx-chat-mount");
  if (!mount) return;

  try {
    // Chat CSS is loaded separately so live.html no longer contains chat styling.
    if (!document.querySelector('link[data-futbolx-chat-css]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "/chat/chat.css";
      css.dataset.futbolxChatCss = "true";
      document.head.appendChild(css);
    }

    const [chatRes, adminRes] = await Promise.all([
      fetch("/chat/chat.html", { cache: "no-store" }),
      fetch("/chat/admin.html", { cache: "no-store" })
    ]);

    if (!chatRes.ok) throw new Error(`Chat UI HTTP ${chatRes.status}`);
    if (!adminRes.ok) throw new Error(`Admin UI HTTP ${adminRes.status}`);

    mount.innerHTML = await chatRes.text();
    document.body.insertAdjacentHTML("beforeend", await adminRes.text());

    // Keep the same event-id behavior the old inline chat used.
    window.CHAT_EVENT_ID = window.CHAT_EVENT_ID || window.location.pathname.split("/").pop() || "lobby";

    await import("/chat/chat.js");
  } catch (error) {
    console.error("FutbolX chat failed to load:", error);
    mount.innerHTML = '<div class="alert alert-secondary">Chat is temporarily unavailable.</div>';
  }
})();
