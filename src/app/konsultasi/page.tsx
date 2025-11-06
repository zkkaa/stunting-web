"use client";

import { Layout } from "@/components";
import { BiSend, BiLoader, BiPaperclip } from "react-icons/bi";
import Conversation from "@/components/ui/konsultasi/Conversation";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface IMessage {
  role: "user" | "assistant";
  content: string;
}

export default function Page() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chats, setChats] = useState<IMessage[]>([]);
  //   const [attachments, setAttachments] = useState<File[]>([]);

  //   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //     const files = Array.from(e.target.files || []);
  //     setAttachments(files);
  //   };

  //   const removeAttachment = (index: number) => {
  //     setAttachments((prev) => prev.filter((_, i) => i !== index));
  //   };

  const fetchChats = async () => {
    const chatHistory = localStorage.getItem("conversationHistory");
    if (chatHistory) {
      setChats(JSON.parse(chatHistory));
    }
    setIsLoading(false);
  };

  const sendPrompt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.currentTarget;
    const formDataRaw = new FormData(form);
    const message = formDataRaw.get("promptMessage") as string;
    const data = {
      message,
      userId: "guest-user",
    };

    if (message.trim() === "") {
      setIsLoading(false);
      toast.error("Pesan tidak boleh kosong.");
      return;
    }

    setChats((prev) => [...prev, { role: "user", content: message }]);
    form.reset();

    // setAttachments([]);
    const convContext = localStorage.getItem("conversationHistory");
    const conversationHistory = convContext;

    try {
      const fd = new FormData();
      fd.append("message", data.message);
      fd.append("userId", data.userId);
      if (conversationHistory) {
        fd.append("conversationHistory", conversationHistory || "");
      }

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      setChats((prev) => [...prev, { role: "assistant", content: json.data }]);

      const updatedConversation = [
        ...(conversationHistory ? JSON.parse(conversationHistory) : []),
        { role: "user", content: message },
        { role: "assistant", content: json.data },
      ];

      localStorage.setItem(
        "conversationHistory",
        JSON.stringify(updatedConversation)
      );

    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchChats();
  }, []);

  return (
    <Layout>
      <div className="relative h-full">
        <div
          className={`justify-center items-center w-full flex overflow-hidden hero-responsive-bg ${
            chats.length < 5 ? "h-[calc(100vh-4rem)]" : "h-auto"
          }`}
        >
          <div className="grid grid-cols-1 gap-y-6 max-w-5xl w-full py-10 relative">
            <h1 className="text-black text-2xl text-center font-semibold">
              Konsultasikan Pertanyaan anda ke Chatbot
            </h1>
            <Conversation chats={chats} />
          </div>
        </div>

        <form
          onSubmit={sendPrompt}
          className="fixed bottom-4 left-1/2 z-50 transform -translate-x-1/2 w-full max-w-5xl px-4"
        >
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-lg">
            <input
              name="promptMessage"
              type="text"
              className="flex-1 bg-transparent p-4 focus:outline-2 focus:outline-[#326269] rounded-lg"
              placeholder="Tulis pertanyaan..."
              required
            />

            {/* attachment button (persis disebelah input) */}
            <div className="flex items-center space-x-2">
              {/* <input
                id="fileInput"
                type="file"
                className="hidden"
                multiple
                onChange={handleFileChange}
              /> */}
              {/* <label
                htmlFor="fileInput"
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                title="Tambahkan lampiran"
              >
                <BiPaperclip className="size-5" />
              </label> */}
              {/* tampilkan nama file kecil (opsional) */}
              {/* {attachments.length > 0 && (
                <div className="hidden sm:flex items-center space-x-2">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1 bg-[#f1f5f9] px-2 py-1 rounded-full text-xs"
                    >
                      <span className="max-w-[8rem] overflow-hidden text-ellipsis whitespace-nowrap">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="ml-1 text-gray-500 hover:text-gray-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )} */}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 bg-[#407A81] text-white px-4 py-2 rounded-lg hover:bg-[#326269] transition-colors duration-200"
            >
              {isLoading ? (
                <BiLoader className="size-6 -rotate-[30deg] animate-spin" />
              ) : (
                <BiSend className="size-6 -rotate-[30deg]" />
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
