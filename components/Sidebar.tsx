
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { LayoutDashboard, CalendarPlus, BarChart3, Settings, CalendarRange, LogOut } from 'lucide-react';

const Sidebar: React.FC = () => {
  const { logout, state } = useAppContext();
  
  const linkClass = ({ isActive }: { isActive: boolean }) => 
    `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
      isActive 
        ? 'bg-blue-600 text-white shadow-md' 
        : 'text-gray-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <div className="w-64 bg-slate-900 h-screen flex flex-col flex-shrink-0 text-white">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold tracking-tight">GestorDC <span className="text-blue-500">.Férias</span></h1>
        <div className="text-xs text-slate-400 mt-2 truncate">
          {state.currentUser}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <NavLink to="/dashboard" className={linkClass}>
          <LayoutDashboard size={20} />
          Dashboard
        </NavLink>
        <NavLink to="/overview" className={linkClass}>
          <CalendarRange size={20} />
          Visão Geral
        </NavLink>
        <NavLink to="/requests" className={linkClass}>
          <CalendarPlus size={20} />
          Lançar Férias/Folgas
        </NavLink>
        <NavLink to="/reports" className={linkClass}>
          <BarChart3 size={20} />
          Relatórios
        </NavLink>
        <NavLink to="/settings" className={linkClass}>
          <Settings size={20} />
          Configurações
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 w-full transition-colors"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
