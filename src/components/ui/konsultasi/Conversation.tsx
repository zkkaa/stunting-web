"use client";

import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import { BsRobot, BsPersonCircle } from "react-icons/bs";
import Markdown from "react-markdown";
interface IMessage {
  role: "user" | "assistant";
  content: string;
}

interface IProps {
  chats: IMessage[];
}

export default function Conversation({ chats }: IProps) {
  const { user } = useAuth();

  return (
    <div className="w-full flex flex-col mx-auto p-4 mb-10">
      {chats.map((chat: IMessage, index: number) => (
        <div
          key={index}
          className={`w-full flex ${
            chat.role === "user" ? "justify-end" : "justify-start"
          } mb-4 flex items-center space-x-2`}
        >
          {chat.role === "assistant" && (
            <div className="w-10 h-10 rounded-full bg-[#407A81] flex items-center justify-center text-white">
              <BsRobot size={24} />
            </div>
          )}
          <div
            className={`p-3 rounded-lg max-w-[70%] ${
              chat.role === "user"
                ? "bg-[#407A81] text-white"
                : "bg-white text-black"
            }`}
          >
            <Markdown>{chat.content}</Markdown>
          </div>
          {chat.role !== "assistant" && (
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center ">
              {user?.profile_image ? (
                <Image
                  src={user.profile_image}
                  alt={user.name || "User"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={24}
                  height={24}
                  quality={100}
                />
              ) : (
                  <BsPersonCircle size={24} className="w-10 h-10 p-1 rounded-full bg-[#407A81] flex items-center justify-center text-white" />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
