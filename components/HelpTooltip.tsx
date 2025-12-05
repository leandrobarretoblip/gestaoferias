import React from 'react';
import { HelpCircle } from 'lucide-react';

interface Props {
  text: string;
}

export const HelpTooltip: React.FC<Props> = ({ text }) => {
  return (
    <div className="group relative inline-block ml-2 align-middle">
      <HelpCircle size={16} className="text-gray-400 hover:text-blue-500 cursor-help" />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs rounded p-2 z-50 shadow-lg">
        {text}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
};
