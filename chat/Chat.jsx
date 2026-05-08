import React, { useState } from "react";
import { emotes } from "./emotes";

export default function PPVStyleChat() {
  const messages = [];

  const mentionNotifications = 10;

  const [showEmotes, setShowEmotes] = useState(false);
  const [message, setMessage] = useState("");

  const insertEmote = (emoteName) => {
    setMessage((prev) => `${prev} :${emoteName}: `);
    setShowEmotes(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md lg:max-w-lg bg-[#070912] border border-[#151933] rounded-2xl overflow-hidden shadow-2xl">

        {/* HEADER */}
        <div className="px-4 py-3 border-b border-[#1a1f3d] bg-[#0a0d1c] flex items-center justify-between relative">

          <div>
            <h2 className="text-white font-bold text-2xl leading-none">
              chat
            </h2>
          </div>

          <div className="absolute left-1/2 -translate-x-1/2">
            <button className="min-w-[48px] h-9 px-3 rounded-full bg-[#18244b] border border-[#29407a] text-blue-300 text-sm font-semibold hover:bg-[#223466] transition-all duration-200 shadow-lg shadow-blue-500/10">
              @{mentionNotifications}
            </button>
          </div>

          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            connected
          </div>

        </div>

        {/* CHAT AREA */}
        <div className="relative">

          {/* SCROLL BUTTON */}
          <div className="absolute bottom-4 right-4 z-20">
            <button className="w-12 h-12 rounded-full bg-[#152bff] hover:bg-[#2640ff] flex items-center justify-center shadow-xl shadow-blue-500/30 transition-all duration-200 active:scale-95">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6 text-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25l-7.5 7.5-7.5-7.5"
                />
              </svg>
            </button>
          </div>

          {/* MESSAGES */}
          <div className="h-[500px] overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-[#090b14] to-[#05060c] flex flex-col-reverse">

            {messages.map((msg, index) => (
              <div
                key={index}
                className="group text-[17px] leading-relaxed break-words text-gray-200 relative touch-pan-y"
              >
                <span
                  className="font-semibold"
                  style={{ color: msg.color }}
                >
                  {msg.user}
                </span>

                <span className="text-white">: </span>

                <span>{msg.text}</span>

                <button className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 text-xs px-2 py-1 rounded-lg bg-[#162041] border border-[#29407a] text-blue-300">
                  Reply
                </button>
              </div>
            ))}

          </div>

        </div>

        {/* INPUT BAR */}
        <div className="border-t border-[#1a1f3d] bg-[#070912] p-3">

          <div className="flex items-end gap-2">

            {/* TEXTBOX */}
            <div className="flex-1 bg-[#0b1020] border border-[#1a2142] rounded-2xl px-4 py-3 focus-within:border-blue-500 transition-all duration-200 shadow-inner">

              <textarea
                placeholder="Send a message"
                rows={1}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-none bg-transparent outline-none text-white placeholder:text-gray-500 text-[16px] max-h-28"
              />

            </div>

            {/* EMOTE BUTTON */}
            <div className="relative">

              <button
                onClick={() => setShowEmotes(!showEmotes)}
                className="w-14 h-14 rounded-2xl bg-[#10162d] border border-[#1f2950] flex items-center justify-center hover:bg-[#162041] transition-all duration-200 active:scale-95"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.7}
                  stroke="currentColor"
                  className="w-7 h-7 text-gray-300"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>

              {/* EMOTES POPUP */}
              {showEmotes && (
                <div className="absolute bottom-16 right-0 w-64 max-h-52 overflow-y-auto rounded-2xl border border-[#1f2950] bg-[#0b1020] p-3 shadow-2xl z-50">

                  <div className="grid grid-cols-4 gap-2">

                    {emotes.map((emote, index) => (
                      <button
                        key={index}
                        onClick={() => insertEmote(emote.name)}
                        className="h-12 rounded-xl bg-[#10162d] border border-[#1f2950] flex items-center justify-center hover:bg-[#18244b] transition-all duration-200 active:scale-95"
                      >
                        <img
                          src={emote.url}
                          alt={emote.name}
                          className="w-9 h-9 object-contain"
                        />
                      </button>
                    ))}

                  </div>

                </div>
              )}

            </div>

            {/* SEND BUTTON */}
            <button className="w-14 h-14 rounded-2xl bg-[#152bff] flex items-center justify-center hover:bg-[#2640ff] transition-all duration-200 active:scale-95 shadow-lg shadow-blue-500/20">

              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="white"
                className="w-6 h-6"
              >
                <path d="M3.4 20.4L20.85 12.92c.78-.33.78-1.51 0-1.84L3.4 3.6c-.66-.28-1.35.33-1.15 1.02l2.1 7.38c.1.34.1.7 0 1.04l-2.1 7.38c-.2.69.49 1.3 1.15 1.02z" />
              </svg>

            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
