
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameDay, addMonths, subMonths, parseISO, 
  startOfYear, endOfYear, eachMonthOfInterval, 
  addYears, subYears, getDate, isWeekend, getDay, ptBR,
  getConcurrencyCount 
} from '../utils';
import { Specialty, RequestType } from '../types';
import { LogIn, Calendar, ArrowLeft, LayoutGrid, ChevronLeft, ChevronRight, Users, AlertTriangle } from 'lucide-react';

const PublicOverview: React.FC = () => {
  const { state } = useAppContext();
  
  // --- DASHBOARD STATE & LOGIC COPIED ---
  const [viewMode, setViewMode] = useState<'MONTH' | 'YEAR'>('MONTH');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('ALL');
  
  // Date states
  const [currentDate, setCurrentDate] = useState(new Date()); // For Month View
  const [currentYearDate, setCurrentYearDate] = useState(new Date()); // For Year View

  // --- MONTH VIEW LOGIC ---
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  // --- YEAR VIEW LOGIC ---
  const prevYear = () => setCurrentYearDate(subYears(currentYearDate, 1));
  const nextYear = () => setCurrentYearDate(addYears(currentYearDate, 1));
  
  const yearMonths = eachMonthOfInterval({
    start: startOfYear(currentYearDate),
    end: endOfYear(currentYearDate)
  });

  // Handle direct date jump from picker
  const handleDateJump = (dateStr: string) => {
    if (!dateStr) return;
    const date = parseISO(dateStr);
    setCurrentDate(date);
    setCurrentYearDate(date);
  };

  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    try {
      if ('showPicker' in e.currentTarget) {
        e.currentTarget.showPicker();
      }
    } catch (error) {
      // Ignore
    }
  };

  // Helper to determine cell color based on concurrency
  const getCapacityColor = (count: number, isWeekendDay: boolean) => {
    if (count >= 4) return 'bg-red-500 text-white';
    if (count === 3) return 'bg-yellow-400 text-yellow-900';
    if (count > 0) return 'bg-green-200 text-green-800';
    return isWeekendDay ? 'bg-gray-100' : 'bg-gray-50';
  };

  const getHolidayColorClass = (location: string) => {
    switch (location) {
      case 'BR': return 'bg-green-100 text-green-700 font-bold border-green-200';
      case 'MAD': return 'bg-yellow-100 text-yellow-700 font-bold border-yellow-200';
      case 'MEX': return 'bg-red-100 text-red-700 font-bold border-red-200';
      case 'SP': return 'bg-fuchsia-100 text-fuchsia-700 font-bold border-fuchsia-200';
      case 'BH': return 'bg-purple-100 text-purple-700 font-bold border-purple-200';
      default: return 'bg-gray-200 text-gray-600 font-bold border-gray-300';
    }
  };

  // --- RENDERERS ---

  const renderMonthView = (specialty: Specialty) => {
    const employees = state.employees.filter(e => e.specialty === specialty);
    if (filterSpecialty === 'ALL' && employees.length === 0) return null;

    const dailyUsage = daysInMonth.map((day: Date) => {
      const count = getConcurrencyCount(day, specialty, state.requests, state.employees);
      return { day, count, warning: count > 4 };
    });

    return (
      <div className="mb-8 border rounded-lg shadow-sm bg-white overflow-hidden animate-fadeIn" key={specialty}>
        <div className="bg-gray-100 px-4 py-2 border-b flex justify-between items-center sticky left-0">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              specialty === Specialty.DC_IA ? 'bg-blue-500' : 
              specialty === Specialty.DC_UX ? 'bg-purple-500' : 'bg-orange-500'
            }`}></span>
            {specialty}
          </h3>
          <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border">Max 4 Simultâneos</span>
        </div>
        
        <div className="overflow-x-auto hide-scrollbar">
          <div className="inline-block min-w-full">
            {/* Header Row (Days) */}
            <div className="flex">
              <div className="w-48 flex-shrink-0 p-2 border-b border-r bg-gray-50 font-semibold text-sm sticky left-0 z-10">
                Funcionário
              </div>
              {daysInMonth.map((day: Date) => (
                <div 
                  key={day.toString()} 
                  className={`w-8 flex-shrink-0 text-center text-xs p-1 border-b border-r ${
                    isWeekend(day) ? 'bg-gray-100 text-gray-400' : 'bg-white'
                  } ${isSameDay(day, new Date()) ? 'bg-blue-50 font-bold text-blue-600' : ''}`}
                >
                  {getDate(day)}
                  <div className="text-[9px] uppercase">{format(day, 'EEEEE', { locale: ptBR })}</div>
                </div>
              ))}
            </div>

            {/* Capacity Warning Row */}
            <div className="flex h-6">
              <div className="w-48 flex-shrink-0 border-r border-b bg-gray-50 text-[10px] flex items-center justify-end px-2 text-gray-500 sticky left-0 z-10">
                Ocupação (Férias)
              </div>
              {dailyUsage.map((item: any, idx: number) => (
                <div 
                  key={idx} 
                  className={`w-8 flex-shrink-0 border-r border-b text-[10px] flex items-center justify-center font-bold ${
                    item.count >= 4 ? 'bg-red-500 text-white' : 
                    item.count === 3 ? 'bg-yellow-100 text-yellow-800' : 
                    item.count > 0 ? 'bg-green-100 text-green-800' : 'bg-white text-gray-300'
                  }`}
                  title={`${item.count} pessoas de férias`}
                >
                  {item.count > 0 ? item.count : '-'}
                </div>
              ))}
            </div>

            {/* Employee Rows */}
            {employees.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">Nenhum analista nesta especialidade.</div>
            ) : (
              employees.map(emp => (
                <div key={emp.id} className="flex hover:bg-gray-50 h-10 items-center">
                  <div className="w-48 flex-shrink-0 p-2 border-r border-b text-sm truncate bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {emp.name}
                  </div>
                  {daysInMonth.map((day: Date) => {
                    const req = state.requests.find(r => 
                      r.employeeId === emp.id && 
                      day >= parseISO(r.startDate) && 
                      day <= parseISO(r.endDate)
                    );
                    
                    const holiday = state.holidays.find(h => isSameDay(parseISO(h.date), day));
                    
                    let cellClass = "bg-white";
                    
                    if (req) {
                      if (req.type === RequestType.VACATION) cellClass = "bg-blue-500 hover:bg-blue-600";
                      else if (req.type === RequestType.SICK_LEAVE) cellClass = "bg-red-400 hover:bg-red-500";
                      else cellClass = "bg-yellow-400 hover:bg-yellow-500";
                    } else if (holiday && !isWeekend(day)) {
                       cellClass = getHolidayColorClass(holiday.location) + " border";
                    } else if (isWeekend(day)) {
                      cellClass = "bg-gray-100";
                    }

                    return (
                      <div 
                        key={day.toString()} 
                        className={`w-8 flex-shrink-0 border-r border-b h-10 text-[10px] flex items-center justify-center text-white cursor-default transition-colors ${cellClass}`}
                        title={req ? `${req.type}: ${format(parseISO(req.startDate), 'dd/MM')} - ${format(parseISO(req.endDate), 'dd/MM')}` : holiday ? `${holiday.name} (${holiday.location})` : ''}
                      >
                        {req ? '' : (holiday && !isWeekend(day) ? 'H' : '')}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderYearView = (specialty: Specialty) => {
    const employees = state.employees.filter(e => e.specialty === specialty);
    if (filterSpecialty === 'ALL' && employees.length === 0) return null;
    
    return (
      <div className="mb-8 border rounded-lg shadow-sm bg-white overflow-hidden animate-fadeIn" key={specialty}>
        <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              specialty === Specialty.DC_IA ? 'bg-blue-500' : 
              specialty === Specialty.DC_UX ? 'bg-purple-500' : 'bg-orange-500'
            }`}></span>
            {specialty}
          </h3>
          <div className="flex gap-2 text-[10px] uppercase font-semibold text-gray-500">
             <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-200 rounded-full"></span> Livre</span>
             <span className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full"></span> Atenção (3)</span>
             <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-full"></span> Cheio (4)</span>
          </div>
        </div>
        
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {yearMonths.map((month: Date) => {
            const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
            const startDay = getDay(startOfMonth(month)); 
            
            return (
              <div key={month.toString()} className="border rounded p-2">
                <div className="text-xs font-bold text-center mb-2 uppercase text-gray-600">
                  {format(month, 'MMMM', { locale: ptBR })}
                </div>
                <div className="grid grid-cols-7 gap-[1px]">
                  {['D','S','T','Q','Q','S','S'].map((d,i) => (
                    <div key={i} className="text-[9px] text-center text-gray-400 mb-1">{d}</div>
                  ))}
                  {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {days.map((day: Date) => {
                    const count = getConcurrencyCount(day, specialty, state.requests, state.employees);
                    return (
                      <div 
                        key={day.toString()} 
                        className={`h-5 w-5 text-[9px] flex items-center justify-center rounded-sm mx-auto cursor-default ${getCapacityColor(count, isWeekend(day))}`}
                        title={`${format(day, 'dd/MM')}: ${count} pessoas`}
                      >
                        {getDate(day)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  const specialtiesToRender = filterSpecialty === 'ALL' 
    ? Object.values(Specialty) 
    : [filterSpecialty as Specialty];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white p-6 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">GestorDC <span className="text-blue-500">.Public</span></h1>
            <p className="text-xs text-slate-400">Visão de Capacidade & Férias</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              Sair
            </Link>
            
            <Link 
              to="/login" 
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-medium transition-colors"
            >
              <LogIn size={16} />
              Acesso Administrativo
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content (COPIED DASHBOARD) */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              
              {/* View Switcher */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode('MONTH')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'MONTH' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Calendar size={16} /> Mensal
                </button>
                <button 
                  onClick={() => setViewMode('YEAR')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'YEAR' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <LayoutGrid size={16} /> Anual
                </button>
              </div>

              {/* Date Navigator */}
              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg">
                <button 
                  onClick={viewMode === 'MONTH' ? prevMonth : prevYear} 
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                
                {/* Calendar Picker to Jump */}
                <div className="relative group">
                  <span className="text-lg font-medium w-40 text-center capitalize cursor-pointer group-hover:text-blue-600 flex items-center justify-center gap-2 transition-colors">
                    {viewMode === 'MONTH' 
                      ? format(currentDate, 'MMMM yyyy', { locale: ptBR })
                      : format(currentYearDate, 'yyyy', { locale: ptBR })
                    }
                    <Calendar size={16} className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                  <input 
                    type="date" 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => handleDateJump(e.target.value)}
                    onClick={handleDateClick}
                    title="Clique para escolher uma data"
                  />
                </div>

                <button 
                  onClick={viewMode === 'MONTH' ? nextMonth : nextYear} 
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="border-t pt-3 flex flex-wrap gap-4 text-xs items-center justify-center md:justify-start">
              <div className="font-bold text-gray-500">Legenda:</div>
              
              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                <span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Férias
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                <span className="w-3 h-3 bg-yellow-400 rounded-sm"></span> Folga
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded">
                <span className="w-3 h-3 bg-red-400 rounded-sm"></span> Licença
              </div>

              <div className="w-px h-4 bg-gray-300 mx-2 hidden md:block"></div>
              
              <div className="font-bold text-gray-500 ml-2">Feriados:</div>

              <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded border border-green-100">
                <span className="w-3 h-3 bg-green-200 border border-green-300 rounded-sm"></span> Brasil
              </div>
              <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                <span className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded-sm"></span> Espanha
              </div>
              <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded border border-red-100">
                <span className="w-3 h-3 bg-red-200 border border-red-300 rounded-sm"></span> México
              </div>
              <div className="flex items-center gap-1.5 bg-fuchsia-50 px-2 py-1 rounded border border-fuchsia-100">
                <span className="w-3 h-3 bg-fuchsia-200 border border-fuchsia-300 rounded-sm"></span> SP
              </div>
              <div className="flex items-center gap-1.5 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                <span className="w-3 h-3 bg-purple-200 border border-purple-300 rounded-sm"></span> BH
              </div>
            </div>
          </div>

          {/* Specialty Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              <button
                onClick={() => setFilterSpecialty('ALL')}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${filterSpecialty === 'ALL'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                <Users size={16} />
                Visão Geral (Todos)
              </button>
              {Object.values(Specialty).map((spec) => (
                <button
                  key={spec}
                  onClick={() => setFilterSpecialty(spec)}
                  className={`
                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                    ${filterSpecialty === spec
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  `}
                >
                  <span className={`w-2 h-2 rounded-full inline-block mr-2 ${
                      spec === Specialty.DC_IA ? 'bg-blue-500' : 
                      spec === Specialty.DC_UX ? 'bg-purple-500' : 'bg-orange-500'
                  }`}></span>
                  {spec}
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-8">
            {specialtiesToRender.map(spec => (
              viewMode === 'MONTH' ? renderMonthView(spec) : renderYearView(spec)
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md flex items-start gap-3">
            <AlertTriangle className="text-yellow-600 mt-1 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              <strong>Regra de Capacidade:</strong> Cada especialidade (DC-IA, DC-UX, DC Full) é limitada a <strong>4 pessoas</strong> de férias simultaneamente.
              {viewMode === 'YEAR' && " No modo anual, dias em vermelho indicam que este limite foi atingido."}
            </p>
          </div>
      </main>
    </div>
  );
};

export default PublicOverview;
