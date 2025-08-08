import React, { useEffect, useState } from "react";
import { CometChatUIKit, UIKitSettingsBuilder } from "@cometchat/chat-uikit-react";
import { CometChatMessages } from "@cometchat/chat-uikit-react";
import { COMETCHAT_CONSTANTS } from "../cometchat-config";
import jwplayer from "jwplayer";
import { Api } from "../assets/js/api";
import "../assets/css/main.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const Live = () => {
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [videoPlayerInstance, setVideoPlayerInstance] = useState(null);

  // Initialize CometChat
  useEffect(() => {
    const UIKitSettings = new UIKitSettingsBuilder()
      .setAppId(COMETCHAT_CONSTANTS.APP_ID)
      .setRegion(COMETCHAT_CONSTANTS.REGION)
      .setAuthKey(COMETCHAT_CONSTANTS.AUTH_KEY)
      .subscribePresenceForAllUsers()
      .build();

    CometChatUIKit.init(UIKitSettings)
      .then(() => {
        CometChatUIKit.login("futbolx_owner").then(() => {
          updateOnlineUsers();
          setInterval(updateOnlineUsers, 10000);
        });
      })
      .catch(console.error);

    const updateOnlineUsers = () => {
      fetch(`https://${COMETCHAT_CONSTANTS.APP_ID}.cometchat.io/v3/users?status=online`, {
        headers: {
          appId: COMETCHAT_CONSTANTS.APP_ID,
          apiKey: COMETCHAT_CONSTANTS.API_KEY,
        },
      })
        .then((res) => res.json())
        .then((data) => setOnlineUsers(data.data.length || 0))
        .catch(() => setOnlineUsers("N/A"));
    };
  }, []);

  // Fetch Stream Data
  useEffect(() => {
    const api = new Api(`${window.location.origin}/api`);
    const uriName = window.location.pathname.split("/").pop();
    fetch(`${api.baseUrl}/stream`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !Array.isArray(data.streams)) throw new Error("Invalid stream data");
        const stream = data.streams
          .flatMap((category) => category.streams)
          .find((s) => s.uri_name === uriName);
        if (!stream) throw new Error("Stream not found");
        setEvent(stream);
        const now = Math.floor(Date.now() / 1000);
        const startTime = new Date(stream.starts_at + "+03:00").getTime() / 1000;
        const endTime = stream.ends_at
          ? new Date(stream.ends_at + "+03:00").getTime() / 1000
          : startTime + 3 * 3600;
        setIsLive((startTime <= now && now <= endTime) || stream.always_live === 1);
      })
      .catch((err) => setError(err.message));
  }, []);

  // Theme Toggle
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-bs-theme", newTheme);
  };

  // Initialize Player
  const initPlayer = (streamUrl) => {
    const isM3U8 = streamUrl.toLowerCase().endsWith(".m3u8");
    const embedPlayer = document.getElementById("embedPlayer");
    const videoPlayerContainer = document.getElementById("videoPlayerContainer");
    const videoPlayer = document.getElementById("videoPlayer");

    if (isM3U8) {
      embedPlayer.style.display = "none";
      videoPlayerContainer.style.display = "block";
      if (videoPlayerInstance) {
        videoPlayerInstance.remove();
      }
      const instance = jwplayer("videoPlayer").setup({
        file: streamUrl,
        autostart: true,
        width: "100%",
        aspectratio: "16:9",
        mute: false,
        controls: true,
      });
      setVideoPlayerInstance(instance);
      instance.on("error", () => {
        setError("Failed to load M3U8 stream. Please try another stream.");
      });
    } else {
      videoPlayerContainer.style.display = "none";
      embedPlayer.style.display = "block";
      if (videoPlayerInstance) {
        videoPlayerInstance.remove();
        setVideoPlayerInstance(null);
      }
      embedPlayer.src = streamUrl;
    }
  };

  // Fullscreen Handler
  const handleFullscreen = () => {
    const isM3U8 = event?.streams[0]?.url.toLowerCase().endsWith(".m3u8");
    const element = isM3U8 ? document.getElementById("videoPlayer") : document.getElementById("embedPlayer");
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(() => setError("Fullscreen not supported"));
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    } else {
      setError("Fullscreen not supported");
    }
  };

  // Tip Countdown
  useEffect(() => {
    const countdownTimer = document.getElementById("countdownTimer");
    const tipContainer = document.querySelector(".tip-container");
    const tipAlert = document.querySelector(".alert-info");
    let seconds = 10;

    if (!countdownTimer || !tipContainer || !tipAlert) return;

    tipContainer.style.height = `${tipAlert.offsetHeight}px`;
    const interval = setInterval(() => {
      seconds--;
      countdownTimer.textContent = `${seconds}s`;
      if (seconds <= 0) {
        tipAlert.classList.add("fade-out");
        setTimeout(() => {
          tipContainer.style.height = "0";
          tipAlert.style.display = "none";
        }, 500);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize Offcanvas
  useEffect(() => {
    const offcanvasElement = document.getElementById("sidebarMenu");
    if (typeof bootstrap !== "undefined" && offcanvasElement) {
      const offcanvas = new bootstrap.Offcanvas(offcanvasElement);
      offcanvasElement.addEventListener("hidden.bs.offcanvas", () => {
        console.log("Offcanvas closed");
      });
    }
  }, []);

  return (
    <div className={`container-fluid main-content ${theme}`}>
      <nav className="top-bar fixed-top">
        <div className="container-fluid">
          <button className="btn btn-dark" data-bs-toggle="offcanvas" data-bs-target="#sidebarMenu">
            <i className="fas fa-bars"></i>
          </button>
          <span className="futbolx-brand">FutbolX</span>
        </div>
      </nav>
      <div className="offcanvas offcanvas-start" id="sidebarMenu">
        <div className="offcanvas-header">
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas"></button>
        </div>
        <div className="offcanvas-body">
          <ul className="nav flex-column">
            <li className="nav-item"><a className="nav-link" href="/">Home</a></li>
            <li className="nav-item"><a className="nav-link" href="/request">Request</a></li>
            <li className="nav-item"><a className="nav-link" href="/vods">VODs</a></li>
            <li className="nav-item"><a className="nav-link" href="https://discord.gg/CmRcPbBB2k">Discord</a></li>
            <li className="nav-item"><a className="nav-link" href="/vip">VIP</a></li>
            <li className="nav-item"><a className="nav-link" href="/auth/login">Login</a></li>
            <li className="nav-item"><button className="nav-link btn btn-link">Logout</button></li>
            <li className="nav-item">
              <button onClick={toggleTheme} className="nav-link btn btn-link">
                <i className={`fas fa-${theme === "dark" ? "moon" : "sun"}`}></i>
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <div className="tip-container">
              <div className="alert alert-info">
                <strong>Tip:</strong> For an ad-free experience, consider installing an ad blocker like
                <a href="https://ublockorigin.com">uBlock Origin</a> or <a href="https://adguard.com">AdGuard</a>.
                <span id="countdownTimer">10s</span>
              </div>
            </div>
            <div className="d-flex align-items-center mb-3">
              <a href="/" className="btn btn-back"><i className="fas fa-arrow-left"></i> Back to Home</a>
              <button
                onClick={() => initPlayer(event?.streams[0]?.url)}
                className="btn btn-danger ms-3"
                disabled={!isLive}
              >
                {isLive ? "Click to Start Livestream" : "Event Not Live"}
              </button>
              <button onClick={handleFullscreen} className="btn btn-fullscreen ms-3">
                Go Fullscreen
              </button>
            </div>
            <h2>{event?.name || "Loading..."}</h2>
            <div className="video-container">
              <iframe
                id="embedPlayer"
                src="about:blank"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-presentation"
              ></iframe>
              <div id="videoPlayerContainer" style={{ display: "none" }}>
                <div id="videoPlayer" className="jwplayer"></div>
              </div>
            </div>
            <div id="streamLinks" className="stream-links mt-3">
              {event?.streams?.map((stream, index) => (
                <button
                  key={index}
                  className={`btn btn-stream ${index === 0 ? "active" : ""}`}
                  onClick={() => initPlayer(stream.url)}
                >
                  {stream.title || `Stream ${index + 1}`}
                </button>
              ))}
            </div>
            <div className={`alert alert-danger error-alert mt-3 ${error ? "" : "d-none"}`}>{error}</div>
            <div className="chat-container mt-3">
              <div className="chat-status">Online Users: <span>{onlineUsers}</span></div>
              <div style={{ height: "400px", width: "100%" }}>
                <CometChatMessages
                  chatWithGroup="live-chat"
                  messageComposerConfiguration={{
                    style: { background: theme === "dark" ? "#222" : "#fff" },
                  }}
                  messageListConfiguration={{
                    style: { background: theme === "dark" ? "#222" : "#fff" },
                    messageTemplate: (message) =>
                      message.sender.uid === "futbolx_owner" ? (
                        <div style={{ background: "#ff4d4d", color: "#fff", padding: "5px", borderRadius: "5px" }}>
                          {message.text}
                        </div>
                      ) : null,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <footer className="container-fluid d-flex flex-column flex-lg-row justify-content-lg-between align-items-center py-2 border-top mt-5">
          <p className="mb-2 mb-lg-0 text-body-secondary text-center text-lg-start">FutbolX 2025</p>
          <ul className="nav justify-content-center justify-content-lg-end mb-0">
            <li className="nav-item"><a href="/api" className="nav-link px-2 text-body-secondary">API</a></li>
            <li className="nav-item"><a href="https://discord.gg/CmRcPbBB2k" className="nav-link px-2 text-body-secondary">Discord</a></li>
            <li className="nav-item"><a href="/changelog" className="nav-link px-2 text-body-secondary">Changelog</a></li>
            <li className="nav-item"><a href="/vip" className="nav-link px-2 text-body-secondary">Donate / VIP Access</a></li>
            <li className="nav-item"><a href="/contact" className="nav-link px-2 text-body-secondary">Contact us</a></li>
          </ul>
        </footer>
      </div>
    </div>
  );
};

export default Live;
