'use client';

import { useAuth } from '@/contexts/AuthContext';
import { BsRobot } from 'react-icons/bs';
import Markdown from 'react-markdown';

interface IMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface IProps {
  chats: IMessage[];
}

export default function Conversation({ chats }: IProps) {
  const { user } = useAuth();
  const initial = user?.name?.trim()?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="w-full flex flex-col mx-auto p-4 mb-10 gap-4">
      {chats.map((chat, index) => (
        <div
          key={index}
          className={`w-full flex items-end gap-2 ${
            chat.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          {chat.role === 'assistant' && (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#407A81] flex items-center justify-center text-white shrink-0">
              <BsRobot size={20} />
            </div>
          )}
          <div
            className={`p-3 rounded-2xl max-w-[80%] sm:max-w-[70%] text-sm sm:text-base ${
              chat.role === 'user'
                ? 'bg-[#407A81] text-white rounded-br-sm'
                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
            }`}
          >
            <Markdown>{chat.content}</Markdown>
          </div>
          {chat.role === 'user' && (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#E5F3F5] flex items-center justify-center text-[#397789] font-semibold text-sm shrink-0">
              {initial}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}