
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { RequestType, Specialty, CalendarRequest } from '../types';
import { generateId, getConcurrencyCount, eachDayOfInterval, format, parseISO } from '../utils';
import { Calendar as CalendarIcon, Save, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

const RequestManager: React.FC = () => {
  const { state, dispatch, showNotification } = useAppContext();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<RequestType>(RequestType.VACATION);
  const [meuRh, setMeuRh] = useState(false);
  const [filterSpecialty, setFilterSpecialty] = useState<string>('ALL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !startDate || !endDate) {
        showNotification('Preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    if (startDate > endDate) {
        showNotification('A data final não pode ser anterior à data inicial.', 'error');
        return;
    }

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    // Validation: Check for Overlapping Requests for THIS Employee
    const overlappingRequest = state.requests.find(req => {
      if (req.employeeId !== selectedEmployee) return false;
      const reqStart = parseISO(req.startDate);
      const reqEnd = parseISO(req.endDate);

      // Check if intervals overlap
      return (start <= reqEnd && end >= reqStart);
    });

    if (overlappingRequest) {
      showNotification(`Conflito de datas! Este funcionário já possui um registro de "${overlappingRequest.type}" neste período (${format(parseISO(overlappingRequest.startDate), 'dd/MM')} a ${format(parseISO(overlappingRequest.endDate), 'dd/MM')}).`, 'error');
      return;
    }

    // Validation: Check Capacity (Max 4 per specialty)
    if (type === RequestType.VACATION) {
      const emp = state.employees.find(e => e.id === selectedEmployee);
      if (emp) {
        const days = eachDayOfInterval({ start, end });
        
        for (const day of days) {
          const count = getConcurrencyCount(day, emp.specialty, state.requests, state.employees);
          // If we already have 4 or more, we cannot add another one
          if (count >= 4) {
            showNotification(`Capacidade excedida para ${emp.specialty} no dia ${format(day, 'dd/MM/yyyy')}. Máximo de 4 pessoas de férias simultaneamente.`, 'error');
            return;
          }
        }
      }
    }

    const newRequest: CalendarRequest = {
      id: generateId(),
      employeeId: selectedEmployee,
      startDate,
      endDate,
      type,
      meuRhLaunched: type === RequestType.VACATION ? meuRh : false,
    };

    dispatch({ type: 'ADD_REQUEST', payload: newRequest });
    
    // Reset minimal fields
    setMeuRh(false);
    showNotification('Solicitação salva com sucesso!', 'success');
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta solicitação?')) {
      dispatch({ type: 'DELETE_REQUEST', payload: id });
      showNotification('Solicitação removida.', 'info');
    }
  };

  const handleDateClick = (e: React.MouseEvent<HTMLInputElement>) => {
    try {
      if ('showPicker' in e.currentTarget) {
        e.currentTarget.showPicker();
      }
    } catch (error) {
      // Ignore errors if browser doesn't support or blocks it
    }
  };

  const filteredEmployees = filterSpecialty === 'ALL' 
    ? state.employees 
    : state.employees.filter(e => e.specialty === filterSpecialty);

  // Get recent requests for list view
  const recentRequests = [...state.requests].sort((a, b) => 
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CalendarIcon className="text-blue-600" />
          Nova Solicitação
        </h2>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
             <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Especialidade</label>
             <div className="flex gap-4 mb-2">
               {['ALL', ...Object.values(Specialty)].map(s => (
                 <button
                   key={s}
                   type="button"
                   onClick={() => setFilterSpecialty(s)}
                   className={`px-3 py-1 rounded text-sm ${filterSpecialty === s ? 'bg-blue-100 text-blue-800 font-medium' : 'bg-gray-100 text-gray-600'}`}
                 >
                   {s === 'ALL' ? 'Todos' : s}
                 </button>
               ))}
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
            <select 
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border bg-white focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Selecione...</option>
              {filteredEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} ({emp.specialty})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ausência</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value as RequestType)}
              className="w-full border-gray-300 rounded-md shadow-sm p-2 border bg-white focus:ring-blue-500 focus:border-blue-500"
            >
              {Object.values(RequestType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="text-blue-600" size={18} />
              </div>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={handleDateClick}
                className="w-full pl-10 border-gray-300 rounded-md shadow-sm p-2 border bg-white focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon className="text-blue-600" size={18} />
              </div>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={handleDateClick}
                className="w-full pl-10 border-gray-300 rounded-md shadow-sm p-2 border bg-white focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                required
              />
            </div>
          </div>

          {type === RequestType.VACATION && (
            <div className="col-span-1 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer p-3 border rounded-md bg-white border-gray-300 hover:bg-gray-50 transition">
                <input 
                  type="checkbox" 
                  checked={meuRh}
                  onChange={(e) => setMeuRh(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-5 h-5 bg-white"
                />
                <span className="text-sm font-medium text-gray-900">Já lançado no MeuRH?</span>
              </label>
            </div>
          )}

          <div className="col-span-1 md:col-span-2 flex justify-end">
            <button 
              type="submit" 
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm"
            >
              <Save size={18} />
              Salvar Solicitação
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-700">Histórico de Solicitações</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Funcionário</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Período</th>
                <th className="px-6 py-3">Status MeuRH</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">Nenhuma solicitação encontrada.</td>
                </tr>
              ) : recentRequests.map(req => {
                const emp = state.employees.find(e => e.id === req.employeeId);
                return (
                  <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {emp?.name || 'Desconhecido'} <span className="text-xs text-gray-400 block">{emp?.specialty}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        req.type === RequestType.VACATION ? 'bg-green-100 text-green-800' :
                        req.type === RequestType.SICK_LEAVE ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {req.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {req.type === RequestType.VACATION ? (
                        req.meuRhLaunched 
                          ? <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14}/> Sim</span> 
                          : <span className="flex items-center gap-1 text-orange-500"><AlertCircle size={14}/> Pendente</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(req.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RequestManager;
