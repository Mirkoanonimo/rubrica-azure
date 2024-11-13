import React from 'react';
import { Button } from '../common/Button';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen = true,
  onClose
}) => {
  return (
    <aside 
      className={`
        w-64 bg-white border-r border-gray-200 
        transition-all duration-300 ease-in-out
        fixed top-16 bottom-0 left-0 z-10
        md:relative md:top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
    >
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Filtri
          </h2>
          {/* Placeholder per i filtri futuri */}
          <div className="space-y-4">
            <Button 
              variant="secondary" 
              fullWidth
            >
              Tutti i contatti
            </Button>
            <Button 
              variant="secondary" 
              fullWidth
            >
              Preferiti
            </Button>
          </div>
        </div>

        {/* Mobile close button */}
        <div className="md:hidden">
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={onClose}
          >
            Chiudi
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;