'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Layout, ProtectedRoute } from '@/components';
import { BiSend, BiLoader } from 'react-icons/bi';
import { BsRobot } from 'react-icons/bs';
import Conversation from '@/components/ui/konsultasi/Conversation';
import { toast } from 'react-hot-toast';

interface IMessage {
  role: 'user' | 'assistant';
  content: string;
}

function KonsultasiPageContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [chats, setChats] = useState<IMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  const sendPrompt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const message = (formData.get('promptMessage') as string)?.trim();

    if (!message) {
      toast.error('Pesan tidak boleh kosong.');
      return;
    }

    setIsLoading(true);
    const historyBeforeSend = chats; // konteks percakapan sesi ini saja, tidak disimpan
    setChats((prev) => [...prev, { role: 'user', content: message }]);
    form.reset();

    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationHistory: historyBeforeSend,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        toast.error(json.error || 'Terjadi kesalahan.');
        setChats((prev) => prev.slice(0, -1)); // rollback pesan user kalau gagal
        return;
      }

      setChats((prev) => [...prev, { role: 'assistant', content: json.data }]);
    } catch (err) {
      console.error('Chatbot error:', err);
      toast.error('Tidak dapat terhubung ke server. Coba lagi.');
      setChats((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden flex flex-col bg-gray-50/50">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-60 z-0"
        style={{
          background: `radial-gradient(ellipse at center top, rgba(158, 202, 214, 0.6) 0%, rgba(158, 202, 214, 0.3) 30%, rgba(158, 202, 214, 0.1) 50%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-32">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 rounded-full bg-[#407A81] flex items-center justify-center text-white mx-auto mb-3">
            <BsRobot size={26} />
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Konsultasi Pencegahan Stunting
          </h1>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Tanyakan seputar tumbuh kembang dan pencegahan stunting pada anak. Percakapan ini tidak disimpan.
          </p>
        </div>

        {chats.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400 text-center max-w-xs">
              Mulai percakapan dengan mengetik pertanyaan di bawah.
            </p>
          </div>
        ) : (
          <Conversation chats={chats} />
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={sendPrompt}
        className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 w-full max-w-4xl px-4"
      >
        <div
          className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-200"
          style={{ boxShadow: '0px 1px 3px 1px #00000026, 0px 1px 2px 0px #0000004D' }}
        >
          <input
            name="promptMessage"
            type="text"
            autoComplete="off"
            className="flex-1 bg-transparent px-4 py-3 rounded-lg outline-none text-sm sm:text-base"
            placeholder="Tulis pertanyaan..."
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center bg-[#407A81] text-white w-11 h-11 rounded-xl hover:bg-[#326269] transition-colors disabled:opacity-50 shrink-0"
            aria-label="Kirim"
          >
            {isLoading ? (
              <BiLoader className="size-5 animate-spin" />
            ) : (
              <BiSend className="size-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function KonsultasiPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <KonsultasiPageContent />
      </Layout>
    </ProtectedRoute>
  );
}