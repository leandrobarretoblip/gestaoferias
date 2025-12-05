
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { format, parseISO, startOfMonth, endOfMonth, ptBR } from '../utils';
import { RequestType } from '../types';
import { Users, Calendar, CalendarCheck, Heart, X } from 'lucide-react';

const KPIDashboard: React.FC = () => {
  const { state } = useAppContext();
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<any[]>([]);

  // --- STATS CALCULATION ---
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  // Active today
  const activeVacations = state.requests.filter(r => 
    r.type === RequestType.VACATION && 
    r.startDate <= todayStr && r.endDate >= todayStr
  );

  // Scheduled Month Logic
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

  const monthlyVacations = state.requests.filter(r => {
    // Check overlapping dates with current month
    // Request Start <= Month End AND Request End >= Month Start
    return r.type === RequestType.VACATION && 
           r.startDate <= monthEnd && 
           r.endDate >= monthStart;
  }).sort((a, b) => a.startDate.localeCompare(b.startDate));

  const scheduledDayOffs = state.requests.filter(r => 
    r.type === RequestType.DAY_OFF && 
    r.startDate >= todayStr // Future or Today
  );

  const activeSickLeaves = state.requests.filter(r => 
    r.type === RequestType.SICK_LEAVE && 
    r.endDate >= todayStr // Active or Future
  );
  
  const activeEmployees = state.employees.filter(e => e.active);

  // --- MODAL HANDLER ---
  const handleCardClick = (type: 'EMPLOYEES' | 'VACATIONS' | 'DAYOFFS' | 'SICK') => {
    if (type === 'EMPLOYEES') {
        setModalTitle('Total de Funcionários');
        setModalContent(activeEmployees.map(e => ({
            id: e.id,
            line1: e.name,
            line2: e.specialty,
            tag: null
        })));
    } else if (type === 'VACATIONS') {
        setModalTitle('Férias Ativas Hoje');
        setModalContent(activeVacations.map(r => {
            const emp = state.employees.find(e => e.id === r.employeeId);
            return {
                id: r.id,
                line1: emp?.name || 'Desconhecido',
                line2: `${format(parseISO(r.startDate), 'dd/MM/yyyy')} - ${format(parseISO(r.endDate), 'dd/MM/yyyy')}`,
                tag: r.meuRhLaunched ? 'Lançado no MeuRH' : 'Pendente MeuRH',
                tagColor: r.meuRhLaunched ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'
            };
        }));
    } else if (type === 'DAYOFFS') {
        setModalTitle('Folgas Registradas (Futuras)');
        setModalContent(scheduledDayOffs.map(r => {
            const emp = state.employees.find(e => e.id === r.employeeId);
            return {
                id: r.id,
                line1: emp?.name || 'Desconhecido',
                line2: format(parseISO(r.startDate), 'dd/MM/yyyy'),
                tag: 'Folga',
                tagColor: 'text-green-600 bg-green-50'
            };
        }));
    } else if (type === 'SICK') {
        setModalTitle('Licenças Médicas (Ativas/Futuras)');
        setModalContent(activeSickLeaves.map(r => {
            const emp = state.employees.find(e => e.id === r.employeeId);
            return {
                id: r.id,
                line1: emp?.name || 'Desconhecido',
                line2: `${format(parseISO(r.startDate), 'dd/MM/yyyy')} - ${format(parseISO(r.endDate), 'dd/MM/yyyy')}`,
                tag: 'Licença',
                tagColor: 'text-red-600 bg-red-50'
            };
        }));
    }
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      {/* --- DASHBOARD METRICS CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Funcionários */}
        <div 
           onClick={() => handleCardClick('EMPLOYEES')}
           className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
             <div>
               <p className="text-xs font-medium text-gray-500 mb-1">Total de Funcionários</p>
               <h2 className="text-3xl font-bold text-gray-800">{activeEmployees.length}</h2>
             </div>
             <Users className="text-blue-500 opacity-80" size={24} />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>

        {/* Card 2: Férias Ativas */}
        <div 
           onClick={() => handleCardClick('VACATIONS')}
           className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
             <div>
               <p className="text-xs font-medium text-gray-500 mb-1">Férias Ativas (Hoje)</p>
               <h2 className="text-3xl font-bold text-gray-800">{activeVacations.length}</h2>
             </div>
             <Calendar className="text-cyan-500 opacity-80" size={24} />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>

        {/* Card 3: Folgas Registradas */}
        <div 
           onClick={() => handleCardClick('DAYOFFS')}
           className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
             <div>
               <p className="text-xs font-medium text-gray-500 mb-1">Folgas Registradas</p>
               <h2 className="text-3xl font-bold text-gray-800">{scheduledDayOffs.length}</h2>
             </div>
             <CalendarCheck className="text-green-500 opacity-80" size={24} />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>

        {/* Card 4: Licenças Médicas */}
        <div 
           onClick={() => handleCardClick('SICK')}
           className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow relative overflow-hidden group"
        >
          <div className="flex justify-between items-start">
             <div>
               <p className="text-xs font-medium text-gray-500 mb-1">Licenças Médicas</p>
               <h2 className="text-3xl font-bold text-gray-800">{activeSickLeaves.length}</h2>
             </div>
             <Heart className="text-orange-500 opacity-80" size={24} />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* --- FÉRIAS EM ANDAMENTO SECTION (ACTIVE TODAY) --- */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-white border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                Em Andamento (Hoje)
              </h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
              {activeVacations.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-4">Nenhum analista de férias hoje.</div>
              ) : (
                <div className="space-y-3">
                  {activeVacations.map(req => {
                    const emp = state.employees.find(e => e.id === req.employeeId);
                    return (
                      <div key={req.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <div className="font-bold text-gray-800 text-sm uppercase mb-1">{emp?.name}</div>
                          <div className="text-xs text-gray-500">Especialidade: {emp?.specialty}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-800 text-sm">
                            Até {format(parseISO(req.endDate), 'dd/MM')}
                          </div>
                          <div className={`text-[10px] uppercase font-bold mt-1 ${req.meuRhLaunched ? 'text-green-600' : 'text-orange-500'}`}>
                            {req.meuRhLaunched ? 'Lançado' : 'Pendente'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* --- FÉRIAS DO MÊS (ALL MONTH) --- */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg text-gray-800 capitalize">
                Férias de {format(today, 'MMMM', { locale: ptBR })}
              </h3>
              <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100">
                {monthlyVacations.length} total
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto max-h-[400px]">
              {monthlyVacations.length === 0 ? (
                <div className="text-gray-400 text-sm text-center py-4">Nenhuma férias neste mês.</div>
              ) : (
                <div className="space-y-3">
                  {monthlyVacations.map(req => {
                    const emp = state.employees.find(e => e.id === req.employeeId);
                    const isFuture = req.startDate > todayStr;
                    const isPast = req.endDate < todayStr;
                    
                    return (
                      <div key={req.id} className={`flex justify-between items-center p-3 rounded-lg border ${isPast ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200'}`}>
                        <div>
                          <div className="font-bold text-gray-800 text-sm uppercase mb-1">{emp?.name}</div>
                          <div className="text-xs text-gray-500">{format(parseISO(req.startDate), 'dd/MM')} - {format(parseISO(req.endDate), 'dd/MM')}</div>
                        </div>
                        <div className="text-right">
                           {isFuture && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded">Futuro</span>}
                           {isPast && <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded">Concluído</span>}
                           {!isFuture && !isPast && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded animate-pulse">Ativo</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
      </div>

      {/* --- MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
             <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-gray-800">{modalTitle}</h3>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                 <X size={20} />
               </button>
             </div>
             <div className="max-h-[60vh] overflow-y-auto p-4">
               {modalContent.length === 0 ? (
                 <p className="text-center text-gray-500 py-4">Nenhum registro encontrado.</p>
               ) : (
                 <ul className="space-y-3">
                   {modalContent.map((item, idx) => (
                     <li key={idx} className="flex justify-between items-start border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                       <div>
                         <div className="font-semibold text-gray-800">{item.line1}</div>
                         <div className="text-xs text-gray-500">{item.line2}</div>
                       </div>
                       {item.tag && (
                         <span className={`text-[10px] px-2 py-1 rounded font-medium ${item.tagColor || 'bg-gray-100 text-gray-600'}`}>
                           {item.tag}
                         </span>
                       )}
                     </li>
                   ))}
                 </ul>
               )}
             </div>
             <div className="bg-gray-50 px-6 py-3 text-right">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Fechar
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIDashboard;
