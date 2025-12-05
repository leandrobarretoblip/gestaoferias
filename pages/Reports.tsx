import React from 'react';
import { useAppContext } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getBusinessDaysCount, startOfYear, endOfYear, parseISO, isWithinInterval, format } from '../utils';
import { RequestType } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface SpecialtyData {
  name: string;
  days: number;
}

const Reports: React.FC = () => {
  const { state } = useAppContext();
  const currentYear = new Date().getFullYear();

  // 1. Vacation days per specialty
  const specialtyData = state.employees.reduce<SpecialtyData[]>((acc, emp) => {
    const existing = acc.find((x) => x.name === emp.specialty);
    if (!existing) {
      acc.push({ name: emp.specialty, days: 0 });
    }
    return acc;
  }, []);

  // 2. Business days off per employee
  const employeeStats = state.employees.map(emp => {
    const vacationRequests = state.requests.filter(r => 
      r.employeeId === emp.id && 
      r.type === RequestType.VACATION &&
      isWithinInterval(parseISO(r.startDate), { start: startOfYear(new Date()), end: endOfYear(new Date()) })
    );

    const totalDays = vacationRequests.reduce((sum, req) => {
      return sum + getBusinessDaysCount(req.startDate, req.endDate, state.holidays);
    }, 0);

    // Add to specialty accumulator
    const spec = specialtyData.find((s) => s.name === emp.specialty);
    if (spec) spec.days += totalDays;

    return {
      name: emp.name,
      specialty: emp.specialty,
      days: totalDays,
      requests: vacationRequests.length
    };
  }).sort((a, b) => b.days - a.days);

  // 3. Detailed Request List
  const allVacations = state.requests
    .filter(r => r.type === RequestType.VACATION)
    .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Relatórios Gerenciais ({currentYear})</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Days by Specialty */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Dias de Férias por Especialidade</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={specialtyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="days"
                >
                  {specialtyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Top Vacation Takers */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Dias Úteis de Férias (Top 10)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={employeeStats.slice(0, 10)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip />
                <Legend />
                <Bar dataKey="days" name="Dias Úteis" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Resumo por Funcionário</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Especialidade</th>
                <th className="px-6 py-3 text-center">Qtd. Solicitações</th>
                <th className="px-6 py-3 text-center">Total Dias Úteis</th>
              </tr>
            </thead>
            <tbody>
              {employeeStats.map((stat, idx) => (
                <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{stat.name}</td>
                  <td className="px-6 py-4">{stat.specialty}</td>
                  <td className="px-6 py-4 text-center">{stat.requests}</td>
                  <td className="px-6 py-4 text-center font-bold text-blue-600">{stat.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Relatório Detalhado de Períodos</h3>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3">Funcionário</th>
                <th className="px-6 py-3">Especialidade</th>
                <th className="px-6 py-3">Competência Inicial</th>
                <th className="px-6 py-3">Competência Final</th>
                <th className="px-6 py-3">Dias Úteis</th>
                <th className="px-6 py-3">Status MeuRH</th>
              </tr>
            </thead>
            <tbody>
              {allVacations.map((req) => {
                 const emp = state.employees.find(e => e.id === req.employeeId);
                 if (!emp) return null;
                 const businessDays = getBusinessDaysCount(req.startDate, req.endDate, state.holidays);
                 
                 return (
                  <tr key={req.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{emp.name}</td>
                    <td className="px-6 py-4 text-xs">{emp.specialty}</td>
                    <td className="px-6 py-4">{format(parseISO(req.startDate), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4">{format(parseISO(req.endDate), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4">{businessDays}</td>
                    <td className="px-6 py-4">
                      {req.meuRhLaunched 
                        ? <span className="text-green-600 text-xs border border-green-200 bg-green-50 px-2 py-1 rounded">Lançado</span> 
                        : <span className="text-orange-500 text-xs border border-orange-200 bg-orange-50 px-2 py-1 rounded">Pendente</span>}
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

export default Reports;
