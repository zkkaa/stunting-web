import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  const { message, conversationHistory } = await request.json();

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json(
      { success: false, error: "Pesan tidak boleh kosong." },
      { status: 400 }
    );
  }

  // Riwayat percakapan (kalau ada) dikirim balik dari client sebagai konteks -
  // TIDAK disimpan di server/DB. Gemini API butuh role 'user' | 'model'.
  const history: ChatHistoryItem[] = conversationHistory || [];
  const geminiHistory = history.map((chat) => ({
    role: chat.role === "assistant" ? "model" : "user",
    parts: [{ text: chat.content }],
  }));

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
    });

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: geminiHistory,
      config: {
        systemInstruction:
          "Anda adalah asisten kesehatan yang membantu orang tua dalam memantau pertumbuhan anak mereka untuk mencegah stunting. Jawab pertanyaan dengan singkat, jelas, dan informatif terkait pencegahan stunting pada anak. Jika pertanyaan di luar konteks pencegahan stunting, jawab dengan 'Maaf, saya hanya dapat membantu dengan pertanyaan terkait pencegahan stunting pada anak.'",
      },
    });

    const response = await chat.sendMessage({ message });

    return NextResponse.json({ success: true, data: response.text }, { status: 200 });
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { success: false, error: "Model AI saat ini tidak tersedia. Silakan coba lagi nanti." },
      { status: 500 }
    );
  }
}