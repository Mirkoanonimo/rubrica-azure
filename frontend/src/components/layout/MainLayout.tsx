import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Button } from '../common/Button';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        {/* Sidebar Toggle Button (Mobile) */}
        <div className="fixed bottom-4 right-4 md:hidden z-20">
          <Button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            variant="primary"
          >
            {isSidebarOpen ? 'Chiudi Menu' : 'Apri Menu'}
          </Button>
        </div>

        {/* Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        {/* Main Content */}
        <main className={`
          flex-1 p-6
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'md:ml-64' : ''}
        `}>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;