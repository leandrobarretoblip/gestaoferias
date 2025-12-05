
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { parseCSV, generateId } from '../utils';
import { Specialty, Holiday, Employee } from '../types';
import { HelpTooltip } from '../components/HelpTooltip';
import { Upload, Users, Calendar, Trash, Plus, Globe, Database, Copy, ExternalLink, Check } from 'lucide-react';

const Settings: React.FC = () => {
  const { state, dispatch, showNotification } = useAppContext();
  const [activeTab, setActiveTab] = useState<'employees' | 'holidays' | 'database'>('employees');
  const [copied, setCopied] = useState(false);

  // Employee Form State
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpSpec, setNewEmpSpec] = useState<Specialty>(Specialty.DC_IA);

  // Holiday Form State
  const [newHolDate, setNewHolDate] = useState('');
  const [newHolName, setNewHolName] = useState('');
  const [newHolLoc, setNewHolLoc] = useState('GLOBAL');

  // SQL Script for setup
  const sqlScript = `-- 1. Habilitar UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Criar ENUMs
DO $$ BEGIN
    CREATE TYPE specialty_type AS ENUM ('DC-IA', 'DC-UX', 'DC Full');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_type AS ENUM ('Férias', 'Folga Avulsa', 'Licença Médica');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE location_type AS ENUM ('SP', 'BH', 'MEX', 'MAD', 'GLOBAL', 'BR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Tabelas
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    specialty specialty_type NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    name TEXT NOT NULL,
    location location_type DEFAULT 'GLOBAL',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type request_type NOT NULL,
    meu_rh_launched BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Segurança (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

-- Permitir Leitura Pública (Visitantes)
CREATE POLICY "Public Read Emp" ON employees FOR SELECT USING (true);
CREATE POLICY "Public Read Hol" ON holidays FOR SELECT USING (true);
CREATE POLICY "Public Read Req" ON requests FOR SELECT USING (true);

-- Permitir Escrita Geral (Para uso com senha simplificada '1234')
-- Em produção real, altere para 'TO authenticated'
CREATE POLICY "Dev Write Emp" ON employees FOR ALL USING (true);
CREATE POLICY "Dev Write Hol" ON holidays FOR ALL USING (true);
CREATE POLICY "Dev Write Req" ON requests FOR ALL USING (true);
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showNotification('SQL copiado para a área de transferência!', 'success');
  };

  // Helper to intelligently resolve specialty from sloppy CSV input
  const resolveSpecialty = (input: string): Specialty => {
    if (!input) return Specialty.DC_IA;
    
    const normalized = input.trim().toUpperCase();
    
    // Check for exact matches (ignoring case)
    if (normalized === 'DC-IA' || normalized === 'DC IA' || normalized === 'IA') return Specialty.DC_IA;
    if (normalized === 'DC-UX' || normalized === 'DC UX' || normalized === 'UX') return Specialty.DC_UX;
    if (normalized === 'DC FULL' || normalized === 'DC-FULL' || normalized === 'DCFULL' || normalized === 'FULL') return Specialty.DC_FULL;
    
    // Check for substrings
    if (normalized.includes('IA')) return Specialty.DC_IA;
    if (normalized.includes('UX')) return Specialty.DC_UX;
    if (normalized.includes('FULL')) return Specialty.DC_FULL;

    return Specialty.DC_IA; // Default fallback
  };

  const handleEmployeeImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        try {
          const data = parseCSV(text);
          if (data.length === 0) {
            showNotification('O arquivo parece estar vazio ou inválido.', 'error');
            return;
          }

          const imported: Employee[] = data.map(row => ({
            id: generateId(),
            name: row.name || 'Sem Nome',
            // Use the smart resolver instead of strict strict check
            specialty: resolveSpecialty(row.specialty),
            active: true
          }));
          dispatch({ type: 'IMPORT_EMPLOYEES', payload: imported });
          showNotification(`${imported.length} analistas importados com sucesso!`, 'success');
        } catch (err) {
          showNotification('Erro ao processar arquivo CSV. Verifique a formatação.', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleHolidayImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        try {
          const data = parseCSV(text);
          if (data.length === 0) {
            showNotification('O arquivo parece estar vazio ou inválido.', 'error');
            return;
          }

          const imported: Holiday[] = data.map(row => ({
            id: generateId(),
            date: row.date,
            name: row.name || 'Feriado',
            location: ['SP','BH','MEX','MAD','BR'].includes(row.location) ? row.location : 'GLOBAL'
          }));
          dispatch({ type: 'IMPORT_HOLIDAYS', payload: imported });
          showNotification(`${imported.length} feriados importados com sucesso!`, 'success');
        } catch (err) {
          showNotification('Erro ao processar arquivo CSV. Verifique a formatação.', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleLoadDefaultHolidays = () => {
    const years = ['2025', '2026'];
    const holidaysTemplate = [
      // Brazil (National) - Using 'BR' for Green Color
      { date: '-01-01', name: 'Confraternização Universal', locs: ['BR'] },
      { date: '-02-12', name: 'Carnaval', locs: ['BR'] }, // Approx
      { date: '-02-13', name: 'Carnaval', locs: ['BR'] }, // Approx
      { date: '-03-29', name: 'Paixão de Cristo', locs: ['BR'] }, // Approx
      { date: '-04-21', name: 'Tiradentes', locs: ['BR'] },
      { date: '-05-01', name: 'Dia do Trabalho', locs: ['BR'] },
      { date: '-05-30', name: 'Corpus Christi', locs: ['BR'] },
      { date: '-09-07', name: 'Independência do Brasil', locs: ['BR'] },
      { date: '-10-12', name: 'Nossa Sra. Aparecida', locs: ['BR'] },
      { date: '-11-02', name: 'Finados', locs: ['BR'] },
      { date: '-11-15', name: 'Proclamação da República', locs: ['BR'] },
      { date: '-11-20', name: 'Dia da Consciência Negra', locs: ['BR'] },
      { date: '-12-25', name: 'Natal', locs: ['BR'] },

      // SP Specific
      { date: '-01-25', name: 'Aniversário de SP', locs: ['SP'] },
      { date: '-07-09', name: 'Revolução Constitucionalista', locs: ['SP'] },

      // BH Specific
      { date: '-08-15', name: 'Assunção de Nossa Senhora', locs: ['BH'] },
      { date: '-12-08', name: 'Imaculada Conceição', locs: ['BH'] },

      // Mexico
      { date: '-01-01', name: 'Año Nuevo', locs: ['MEX'] },
      { date: '-02-05', name: 'Día de la Constitución', locs: ['MEX'] },
      { date: '-03-18', name: 'Natalicio de Benito Juárez', locs: ['MEX'] }, // Moves
      { date: '-05-01', name: 'Día del Trabajo', locs: ['MEX'] },
      { date: '-09-16', name: 'Día de la Independencia', locs: ['MEX'] },
      { date: '-11-18', name: 'Día de la Revolución', locs: ['MEX'] }, // Moves
      { date: '-12-25', name: 'Navidad', locs: ['MEX'] },

      // Spain (Madrid)
      { date: '-01-01', name: 'Año Nuevo', locs: ['MAD'] },
      { date: '-01-06', name: 'Epifanía del Señor', locs: ['MAD'] },
      { date: '-03-28', name: 'Jueves Santo', locs: ['MAD'] }, // Approx
      { date: '-03-29', name: 'Viernes Santo', locs: ['MAD'] }, // Approx
      { date: '-05-01', name: 'Fiesta del Trabajo', locs: ['MAD'] },
      { date: '-05-02', name: 'Fiesta de la Comunidad de Madrid', locs: ['MAD'] },
      { date: '-05-15', name: 'San Isidro', locs: ['MAD'] },
      { date: '-07-25', name: 'Santiago Apóstol', locs: ['MAD'] },
      { date: '-08-15', name: 'Asunción de la Virgen', locs: ['MAD'] },
      { date: '-10-12', name: 'Fiesta Nacional de España', locs: ['MAD'] },
      { date: '-11-01', name: 'Todos los Santos', locs: ['MAD'] },
      { date: '-12-06', name: 'Día de la Constitución Española', locs: ['MAD'] },
      { date: '-12-08', name: 'Inmaculada Concepción', locs: ['MAD'] },
      { date: '-12-25', name: 'Natividad del Señor', locs: ['MAD'] },
    ];

    let addedCount = 0;

    years.forEach(year => {
      holidaysTemplate.forEach(h => {
        let finalDate = year + h.date;

        // Simple patch for 2025 variable dates to be better
        if (year === '2025') {
            if (h.name === 'Paixão de Cristo' || h.name === 'Viernes Santo') finalDate = '2025-04-18';
            if (h.name === 'Jueves Santo') finalDate = '2025-04-17';
            if (h.name === 'Carnaval') {
                if(h.date.includes('02-12')) finalDate = '2025-03-03';
                if(h.date.includes('02-13')) finalDate = '2025-03-04';
            }
        }
        // Simple patch for 2026 variable dates
        if (year === '2026') {
             if (h.name === 'Paixão de Cristo' || h.name === 'Viernes Santo') finalDate = '2026-04-03';
             if (h.name === 'Jueves Santo') finalDate = '2026-04-02';
             if (h.name === 'Carnaval') {
                if(h.date.includes('02-12')) finalDate = '2026-02-16';
                if(h.date.includes('02-13')) finalDate = '2026-02-17';
             }
        }

        h.locs.forEach(loc => {
           // Check duplicate
           const exists = state.holidays.some(ex => ex.date === finalDate && ex.location === loc);
           if (!exists) {
             dispatch({
               type: 'ADD_HOLIDAY',
               payload: {
                 id: generateId(),
                 date: finalDate,
                 name: h.name,
                 location: loc as any
               }
             });
             addedCount++;
           }
        });
      });
    });

    if (addedCount > 0) {
      showNotification(`${addedCount} feriados adicionados para 2025/2026!`, 'success');
    } else {
      showNotification('Os feriados já estão cadastrados.', 'info');
    }
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if(newEmpName) {
      dispatch({ type: 'ADD_EMPLOYEE', payload: { id: generateId(), name: newEmpName, specialty: newEmpSpec, active: true } });
      setNewEmpName('');
      showNotification('Funcionário adicionado com sucesso.', 'success');
    }
  };

  const handleAddHoliday = (e: React.FormEvent) => {
    e.preventDefault();
    if(newHolName && newHolDate) {
      dispatch({ type: 'ADD_HOLIDAY', payload: { id: generateId(), date: newHolDate, name: newHolName, location: newHolLoc as any } });
      setNewHolName('');
      setNewHolDate('');
      showNotification('Feriado adicionado com sucesso.', 'success');
    }
  };

  const handleRemoveEmployee = (id: string) => {
    dispatch({ type: 'REMOVE_EMPLOYEE', payload: id });
    showNotification('Funcionário removido.', 'info');
  };

  const handleRemoveHoliday = (id: string) => {
    dispatch({ type: 'DELETE_HOLIDAY', payload: id });
    showNotification('Feriado removido.', 'info');
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h2>
      
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button 
          className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'employees' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('employees')}
        >
          Analistas & Times
        </button>
        <button 
          className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'holidays' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('holidays')}
        >
          Feriados & Calendário
        </button>
        <button 
          className={`px-4 py-2 font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === 'database' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('database')}
        >
          <Database size={16} /> Banco de Dados
        </button>
      </div>

      {activeTab === 'database' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-2">Inicialização do Supabase</h3>
            <p className="text-blue-800 mb-4 text-sm">
              Para que o sistema funcione e salve os dados, você precisa criar a estrutura de tabelas no Supabase.
            </p>
            
            <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2 mb-6">
              <li>Copie o script SQL abaixo.</li>
              <li>Acesse o <strong>Supabase SQL Editor</strong> clicando no botão abaixo.</li>
              <li>Cole o código no editor do Supabase e clique em <strong>Run</strong>.</li>
            </ol>

            <div className="flex flex-wrap gap-4">
               <a 
                 href="https://supabase.com/dashboard/project/cfxfuujcxyrfacytmdhm/sql/new" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
               >
                 <ExternalLink size={18} />
                 Abrir Supabase SQL Editor
               </a>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700">
            <div className="flex justify-between items-center px-4 py-2 bg-gray-900 border-b border-gray-700">
              <span className="text-xs text-gray-400 font-mono">setup_database.sql</span>
              <button 
                onClick={copyToClipboard}
                className="flex items-center gap-2 text-xs font-medium text-gray-300 hover:text-white transition-colors"
              >
                {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar Script'}
              </button>
            </div>
            <pre className="p-4 text-xs md:text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {sqlScript}
            </pre>
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Upload className="mr-2" size={20} /> Importar via Arquivo (Backup)
              <HelpTooltip text="Importe um arquivo .csv ou .txt com cabeçalho: name,specialty. Exemplo: 'Joao Silva, DC-IA'" />
            </h3>
            <input 
              type="file" 
              accept=".csv,.txt"
              onChange={handleEmployeeImport}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-white"
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="mr-2" size={20} /> Cadastro Manual
            </h3>
            <form onSubmit={handleAddEmployee} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input value={newEmpName} onChange={e => setNewEmpName(e.target.value)} className="w-full border p-2 rounded bg-white" required />
              </div>
              <div className="w-48">
                 <label className="block text-sm font-medium text-gray-700">Especialidade</label>
                 <select value={newEmpSpec} onChange={e => setNewEmpSpec(e.target.value as Specialty)} className="w-full border p-2 rounded bg-white">
                    {Object.values(Specialty).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
              <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={20}/></button>
            </form>

            <div className="mt-6 max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="p-2">Nome</th>
                    <th className="p-2">Especialidade</th>
                    <th className="p-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {state.employees.map(emp => (
                    <tr key={emp.id} className="border-t">
                      <td className="p-2">{emp.name}</td>
                      <td className="p-2"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{emp.specialty}</span></td>
                      <td className="p-2 text-right">
                        <button onClick={() => handleRemoveEmployee(emp.id)} className="text-red-500 hover:text-red-700"><Trash size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'holidays' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Default Loader */}
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                <Globe className="mr-2" size={20} /> Carga Rápida (BR, MEX, ESP)
              </h3>
              <p className="text-sm text-blue-600 mt-1">
                Carregue automaticamente os feriados de 2025 e 2026 para Brasil (Nacional/SP/BH), México e Madrid.
              </p>
            </div>
            <button 
              onClick={handleLoadDefaultHolidays}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 shadow-sm font-medium transition-colors"
            >
              Carregar Padrões
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Upload className="mr-2" size={20} /> Importar via Arquivo (Backup)
              <HelpTooltip text="Formato CSV: date,name,location (ex: 2024-12-25,Natal,GLOBAL). Locais aceitos: SP, BH, MEX, MAD, BR, GLOBAL" />
            </h3>
            <input 
              type="file" 
              accept=".csv,.txt"
              onChange={handleHolidayImport}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 bg-white"
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
             <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="mr-2" size={20} /> Cadastro Manual
            </h3>
            <form onSubmit={handleAddHoliday} className="flex gap-4 items-end flex-wrap">
              <div className="w-40">
                <label className="block text-sm font-medium text-gray-700">Data</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="text-blue-600" size={16} />
                  </div>
                  <input 
                    type="date" 
                    value={newHolDate} 
                    onChange={e => setNewHolDate(e.target.value)}
                    onClick={handleDateClick}
                    className="w-full pl-10 border p-2 rounded bg-white cursor-pointer" 
                    required 
                  />
                </div>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <input value={newHolName} onChange={e => setNewHolName(e.target.value)} className="w-full border p-2 rounded bg-white" required />
              </div>
              <div className="w-32">
                 <label className="block text-sm font-medium text-gray-700">Local</label>
                 <select value={newHolLoc} onChange={e => setNewHolLoc(e.target.value)} className="w-full border p-2 rounded bg-white">
                    <option value="GLOBAL">Global</option>
                    <option value="BR">Brasil (Nacional)</option>
                    <option value="SP">São Paulo</option>
                    <option value="BH">Belo Horizonte</option>
                    <option value="MEX">México</option>
                    <option value="MAD">Madrid</option>
                 </select>
              </div>
              <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"><Plus size={20}/></button>
            </form>

            <div className="mt-6 max-h-60 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-gray-50">
                    <th className="p-2">Data</th>
                    <th className="p-2">Feriado</th>
                    <th className="p-2">Local</th>
                    <th className="p-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {[...state.holidays].sort((a,b) => a.date.localeCompare(b.date)).map(h => (
                    <tr key={h.id} className="border-t">
                      <td className="p-2 font-mono text-xs">{new Date(h.date).toLocaleDateString()}</td>
                      <td className="p-2">{h.name}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          h.location === 'BR' ? 'bg-green-100 text-green-800' :
                          h.location === 'MEX' ? 'bg-red-100 text-red-800' :
                          h.location === 'MAD' ? 'bg-yellow-100 text-yellow-800' :
                          h.location === 'SP' ? 'bg-fuchsia-100 text-fuchsia-800' :
                          h.location === 'BH' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {h.location}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <button onClick={() => handleRemoveHoliday(h.id)} className="text-red-500 hover:text-red-700"><Trash size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
