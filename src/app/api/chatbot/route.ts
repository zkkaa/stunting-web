import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

interface ChatPayload {
  user_id: string;
  content: string;
  role: "user" | "assistant";
}

interface GeminiPayloadReq {
  history: {
    role: "user" | "assistant";
    parts: [
      {
        text: string;
      }
    ];
  }[];
}

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL || "",
//   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
// );

export async function POST(request: NextRequest) {
  const { message, userId, conversationHistory } = await request.json();

  let context: ChatPayload[] = [];
  if (conversationHistory) {
    context = (JSON.parse(conversationHistory) as ChatPayload[]) || [];
  }

  const parsedContext: GeminiPayloadReq = {
    history: context.map((chat) => ({
      role: chat.role,
      parts: [
        {
          text: chat.content,
        },
      ],
    })),
  };

  try{
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || "",
    });

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: context,
      config: {
        systemInstruction:
          "Anda adalah asisten kesehatan yang membantu orang tua dalam memantau pertumbuhan anak mereka untuk mencegah stunting. Jawab pertanyaan dengan singkat, jelas, dan informatif untuk menjawab pertanyaan yang diajukan oleh orang tua terkait pencegahan stunting pada anak. Jika pertanyaannya di luar konteks pencegahan stunting, jawab dengan 'Maaf, saya hanya dapat membantu dengan pertanyaan terkait pencegahan stunting pada anak.",
      },
    });

    const response = await chat.sendMessage({message: message});


    return NextResponse.json(
      {
        succcess: true,
        data: response.text,
      },
      { status: 200 }
    );
    }catch(error){
      return NextResponse.json(
        {
          succcess: false,
          error: "Model AI saat ini tidak tersedia. Silakan coba lagi nanti.",
        },
        { status: 500 }
      );
    }
}
