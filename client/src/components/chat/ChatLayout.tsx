import { ReactNode } from 'react';

interface ChatLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
}

export const ChatLayout = ({ sidebar, main }: ChatLayoutProps) => {
  return (
    <div className="flex h-screen w-screen bg-gray-50">
      <div className="w-[350px] bg-white">
        {sidebar}
      </div>
      <div className="flex-1 bg-white">
        {main}
      </div>
    </div>
  );
};