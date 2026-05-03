"use client";

import { useState, useEffect, useRef } from "react";
import { botApi } from "@/utils/api";

// Définition du type pour les messages
interface Message {
  sender: "bot" | "user";
  text: string;
  options?: string[];
  qr_code?: string;
}

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialisation de la session
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

  // Scroll automatique
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
      }, 600);
    } catch (error) {
      console.error("Erreur:", error);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#e5ddd5] font-sans">
      {/* Header WhatsApp Style */}
      <div className="bg-[#075e54] text-white p-4 flex items-center shadow-lg z-10">
        <div className="w-10 h-10 bg-white rounded-full mr-3 flex items-center justify-center text-[#075e54] font-bold border-2 border-green-200">
          MB
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-white">
            MarketBot Bukavu
          </h1>
          <p className="text-xs text-green-300 font-medium">En ligne</p>
        </div>
      </div>

      {/* Zone de Chat */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-lg shadow-md ${
                msg.sender === "user"
                  ? "bg-[#dcf8c6] rounded-tr-none border border-green-200"
                  : "bg-white rounded-tl-none border border-gray-100"
              }`}
            >
              {/* Texte en noir pur pour une visibilité maximale */}
              <p className="text-[15px] font-medium text-black whitespace-pre-wrap leading-relaxed">
                {msg.text}
              </p>

              {/* AFFICHAGE DU QR CODE */}
              {msg.qr_code && (
                <div className="mt-4 p-3 bg-white border-2 border-gray-200 rounded-lg flex flex-col items-center">
                  <p className="text-[11px] text-gray-700 mb-2 font-bold tracking-tighter">
                    VOTRE BON DE COMMANDE
                  </p>
                  <img
                    src={`data:image/png;base64,${msg.qr_code}`}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                  <p className="text-[10px] text-gray-500 mt-2">
                    Présentez ce code à la livraison
                  </p>
                </div>
              )}

              {/* Options/Boutons cliquables */}
              {msg.options && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {msg.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(opt)}
                      className="bg-white text-blue-700 border-2 border-blue-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
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
            <div className="bg-white px-4 py-2 rounded-lg italic text-gray-500 text-sm shadow-md border border-gray-100">
              Le bot écrit...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Barre de saisie */}
      <div className="bg-[#f0f0f0] p-4 flex gap-3 items-center border-t border-gray-300">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
          placeholder="Tapez votre message..."
          className="flex-1 p-4 rounded-full border-2 border-white focus:border-[#075e54] bg-white text-black font-semibold outline-none text-base shadow-inner"
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
