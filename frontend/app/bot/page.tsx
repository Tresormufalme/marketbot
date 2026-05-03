"use client";

import { useState, useEffect, useRef } from "react";
import { botApi } from "@/utils/api";

interface Message {
  sender: "bot" | "user";
  text: string;
  options?: string[];
  qr_code?: string;
}

export default function BotSimulator() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    botApi.startSession().then((data) => {
      setSessionId(data.session_id);
      setMessages([
        {
          sender: "bot",
          text: data.bot_response.message,
          options: data.bot_response.options,
          qr_code: data.bot_response.qr_code,
        },
      ]);
    });
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || !sessionId) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setIsTyping(true);

    try {
      const data = await botApi.sendMessage(sessionId, text);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.bot_response.message,
            options: data.bot_response.options,
            qr_code: data.bot_response.qr_code,
          },
        ]);
      }, 800);
    } catch (error) {
      console.error("Erreur API Bot:", error);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#e5ddd5]">
      {/* Header - Design épuré et contraste élevé */}
      <div className="bg-[#075e54] text-white p-4 flex items-center shadow-lg z-10">
        <div className="w-10 h-10 bg-white rounded-full mr-3 flex-shrink-0 flex items-center justify-center text-[#075e54] font-bold text-lg shadow-md">
          MB
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-lg leading-tight text-white">
            Boutique MarketBot
          </h1>
          <p className="text-xs text-green-200 font-medium">En ligne</p>
        </div>
      </div>

      {/* Zone de messages - Fond clair pour meilleur contraste */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg shadow-md ${
                msg.sender === "user"
                  ? "bg-[#dcf8c6] rounded-tr-none"
                  : "bg-white rounded-tl-none"
              }`}
            >
              {/* Texte avec contraste optimal - Taille augmentée */}
              <p className="text-base text-gray-900 whitespace-pre-wrap leading-relaxed font-medium">
                {msg.text}
              </p>

              {msg.qr_code && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center">
                  <p className="text-xs text-gray-700 mb-2 font-semibold uppercase tracking-wide">
                    QR Code de confirmation
                  </p>
                  <img
                    src={`data:image/png;base64,${msg.qr_code}`}
                    alt="QR Code"
                    className="w-44 h-44 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-600 mt-2 font-medium">
                    Présentez ce code à la livraison
                  </p>
                </div>
              )}

              {msg.options && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {msg.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        handleSend(opt.split(".")[0].trim() || opt)
                      }
                      className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all active:scale-95 shadow-md"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-tl-none text-gray-600 text-sm shadow-md font-medium">
              <span className="flex items-center gap-1">
                MarketBot écrit
                <span className="animate-pulse">...</span>
              </span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Barre d'input - Design clair et fonctionnel */}
      <div className="bg-white p-4 flex gap-3 items-center border-t border-gray-200 shadow-lg">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Écrivez votre message ici..."
          className="flex-1 p-3 rounded-lg border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-400 outline-none text-base font-medium transition-all focus:border-blue-500 focus:shadow-md"
          style={{ fontSize: "16px" }} // Évite le zoom sur mobile
        />
        <button
          onClick={() => handleSend(input)}
          className="bg-[#075e54] text-white p-3 rounded-full w-14 h-14 flex items-center justify-center shadow-xl active:scale-90 transition-transform"
        >
          <span className="text-2xl transform rotate-45 -mt-1 -ml-1">➤</span>
        </button>
      </div>
    </div>
  );
}
