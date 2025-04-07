import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ChatLayoutProps {
  sidebar: ReactNode;
  main: ReactNode;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (isOpen: boolean) => void;
  modal?: ReactNode; 
}

export const ChatLayout = ({ 
  sidebar, 
  main,
  isMobileMenuOpen = false,
  setIsMobileMenuOpen = () => {},
  modal
}: ChatLayoutProps) => {
  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-black">
      {/* Modals */}
      {modal}
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm transition-opacity lg:hidden z-[45]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-[50] w-72 transform bg-black/95 backdrop-blur-sm 
          border-r border-gray-800 transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:transition-none
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-800">
            <h2 className="text-xl font-semibold text-white">Chats</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg p-2 text-gray-300 hover:bg-gray-800 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sidebar}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div id="main-content" className="flex flex-1 flex-col overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto">
          {main}
        </div>
      </div>
    </div>
  );
};