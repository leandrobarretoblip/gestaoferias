
import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { AppState, AppAction, Specialty, RequestType, Employee, CalendarRequest, Holiday } from '../types';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

// Whitelist of allowed emails for the default password access
const ACCESS_WHITELIST = [
  'fernando.palumbo@blip.ai',
  'giovana.pereira@blip.ai',
  'julia.franco@blip.ai',
  'leandro.barreto@blip.ai',
  'amandar@blip.ai',
  'willer@blip.ai'
];

const initialState: AppState = {
  currentUser: null,
  employees: [],
  requests: [],
  holidays: []
};

const reducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUser: action.payload };
    case 'LOGOUT':
      return { ...state, currentUser: null };
    case 'ADD_EMPLOYEE':
      return { ...state, employees: [...state.employees, action.payload] };
    case 'IMPORT_EMPLOYEES':
      return { ...state, employees: action.payload };
    case 'REMOVE_EMPLOYEE':
      return { ...state, employees: state.employees.filter(e => e.id !== action.payload) };
    case 'ADD_REQUEST':
      return { ...state, requests: [...state.requests, action.payload] };
    case 'DELETE_REQUEST':
      return { ...state, requests: state.requests.filter(r => r.id !== action.payload) };
    case 'ADD_HOLIDAY':
      return { ...state, holidays: [...state.holidays, action.payload] };
    case 'IMPORT_HOLIDAYS':
      return { ...state, holidays: action.payload };
    case 'DELETE_HOLIDAY':
      return { ...state, holidays: state.holidays.filter(h => h.id !== action.payload) };
    default:
      return state;
  }
};

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}>({ 
  state: initialState, 
  dispatch: () => null, 
  showNotification: () => {},
  login: async () => false,
  logout: () => {},
  isLoading: false
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- HELPER FOR ERROR PARSING ---
  const parseError = (err: any): string => {
    if (err === null || err === undefined) return 'Erro desconhecido (null/undefined)';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    
    // Handle Supabase/Postgrest Error Object
    if (typeof err === 'object') {
      const msg = err.message || err.error_description || err.msg;
      
      if (msg) {
        const details = err.details ? ` (${err.details})` : '';
        const hint = err.hint ? ` Dica: ${err.hint}` : '';
        return `${msg}${details}${hint}`;
      }
      
      if (err.code) return `Erro Database Code: ${err.code}`;
      
      // Fallback for objects without message
      try {
        const json = JSON.stringify(err);
        if (json !== '{}') return json;
      } catch (e) {
        return 'Erro interno (Objeto não serializável)';
      }
    }
    
    return 'Erro desconhecido';
  };

  // --- DATA SYNC WITH SUPABASE ---

  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log('Iniciando carga de dados do Supabase...');
      
      // Fetch Employees
      const { data: empData, error: empError } = await supabase.from('employees').select('*').order('name');
      if (empError) throw empError;

      // Fetch Requests
      const { data: reqData, error: reqError } = await supabase.from('requests').select('*');
      if (reqError) throw reqError;

      // Fetch Holidays
      const { data: holData, error: holError } = await supabase.from('holidays').select('*');
      if (holError) throw holError;

      // Map DB types to App types
      const employees: Employee[] = (empData || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        specialty: e.specialty,
        active: e.active
      }));

      const requests: CalendarRequest[] = (reqData || []).map((r: any) => ({
        id: r.id,
        employeeId: r.employee_id,
        startDate: r.start_date,
        endDate: r.end_date,
        type: r.type,
        meuRhLaunched: r.meu_rh_launched,
        notes: r.notes
      }));

      const holidays: Holiday[] = (holData || []).map((h: any) => ({
        id: h.id,
        date: h.date,
        name: h.name,
        location: h.location
      }));

      // Batch updates
      dispatch({ type: 'IMPORT_EMPLOYEES', payload: employees });
      
      requests.forEach(r => dispatch({ type: 'ADD_REQUEST', payload: r }));
      
      dispatch({ type: 'IMPORT_HOLIDAYS', payload: holidays });
      
    } catch (err: any) {
      console.error('Error fetching data (RAW):', err);
      const errorMessage = parseError(err);
      console.error('Error fetching data (PARSED):', errorMessage);
      
      // Check for specific Supabase/Postgres error codes
      // 42P01: undefined_table (Table does not exist)
      // 42501: insufficient_privilege (RLS Policy blocking access)
      // "Could not find the table": Client-side error when schema is missing
      if (
        err?.code === '42P01' || 
        (errorMessage.includes('relation') && errorMessage.includes('does not exist')) ||
        errorMessage.includes('Could not find the table')
      ) {
        showNotification('⚠️ Banco de Dados Não Inicializado: As tabelas não foram encontradas. Execute o script SQL no Supabase.', 'error');
      } else if (err?.code === '42501') {
        showNotification('⚠️ Acesso Negado: Configure as Políticas de Segurança (RLS) no Supabase.', 'error');
      } else {
        showNotification(`Erro ao carregar dados: ${errorMessage}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        dispatch({ type: 'LOGIN', payload: session.user.email });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) {
        dispatch({ type: 'LOGIN', payload: session.user.email });
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    fetchData();

    return () => subscription.unsubscribe();
  }, []);

  // --- DISPATCH WRAPPER (Optimistic UI + Supabase) ---
  const dispatchWithBackend = async (action: AppAction) => {
    // 1. Optimistic Update
    dispatch(action);

    // 2. Persist to Supabase
    try {
      switch (action.type) {
        case 'ADD_EMPLOYEE':
          const { error: addEmpErr } = await supabase.from('employees').insert({
            id: action.payload.id,
            name: action.payload.name,
            specialty: action.payload.specialty,
            active: action.payload.active
          });
          if (addEmpErr) throw addEmpErr;
          break;
        case 'REMOVE_EMPLOYEE':
          const { error: rmEmpErr } = await supabase.from('employees').delete().eq('id', action.payload);
          if (rmEmpErr) throw rmEmpErr;
          break;
        case 'ADD_REQUEST':
          const { error: addReqErr } = await supabase.from('requests').insert({
            id: action.payload.id,
            employee_id: action.payload.employeeId,
            start_date: action.payload.startDate,
            end_date: action.payload.endDate,
            type: action.payload.type,
            meu_rh_launched: action.payload.meuRhLaunched,
            notes: action.payload.notes
          });
          if (addReqErr) throw addReqErr;
          break;
        case 'DELETE_REQUEST':
          const { error: delReqErr } = await supabase.from('requests').delete().eq('id', action.payload);
          if (delReqErr) throw delReqErr;
          break;
        case 'ADD_HOLIDAY':
          const { error: addHolErr } = await supabase.from('holidays').insert({
            id: action.payload.id,
            date: action.payload.date,
            name: action.payload.name,
            location: action.payload.location
          });
          if (addHolErr) throw addHolErr;
          break;
        case 'DELETE_HOLIDAY':
          const { error: delHolErr } = await supabase.from('holidays').delete().eq('id', action.payload);
          if (delHolErr) throw delHolErr;
          break;
        case 'IMPORT_EMPLOYEES':
           const { error: impEmpErr } = await supabase.from('employees').upsert(
             action.payload.map(e => ({
                id: e.id,
                name: e.name,
                specialty: e.specialty,
                active: e.active
             }))
           );
           if (impEmpErr) throw impEmpErr;
           break;
        case 'IMPORT_HOLIDAYS':
           const { error: impHolErr } = await supabase.from('holidays').upsert(
             action.payload.map(h => ({
                id: h.id,
                date: h.date,
                name: h.name,
                location: h.location
             }))
           );
           if (impHolErr) throw impHolErr;
           break;
      }
    } catch (err: any) {
      console.error('Supabase Sync Error:', err);
      const errorMessage = parseError(err);
      
      if (err?.code === '42P01') {
        showNotification('Erro: Tabelas não existem. Execute o script SQL no Supabase.', 'error');
      } else if (err?.code === '42501') {
         showNotification('Erro de Permissão: Você não tem permissão para editar dados.', 'error');
      } else {
        showNotification(`Erro ao salvar: ${errorMessage}`, 'error');
      }
      
      // Ideally rollback state here by reloading data
      // fetchData(); // Optional: Reload to revert optimistic update
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000); // Increased duration to ensure users see DB errors
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    if (!password) {
      showNotification('Senha é obrigatória.', 'error');
      return false;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // --- SENHA PADRÃO / MASTER PASSWORD ---
    // Bypass para facilitar acesso com a senha '1234' para usuários da whitelist
    if (password === '1234') {
      if (ACCESS_WHITELIST.includes(normalizedEmail)) {
        dispatch({ type: 'LOGIN', payload: normalizedEmail });
        showNotification(`Bem-vindo, ${normalizedEmail}!`, 'success');
        return true;
      } else {
        showNotification('Acesso negado: E-mail não autorizado para acesso com senha padrão.', 'error');
        return false;
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: password
      });

      if (error) throw error;

      if (data.session) {
        showNotification(`Bem-vindo, ${data.session.user.email}!`, 'success');
        return true;
      }
      return false;

    } catch (err: any) {
      console.error('Login Error:', err);
      const errorMessage = parseError(err);
      showNotification(errorMessage || 'Falha no login. Verifique suas credenciais.', 'error');
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    dispatch({ type: 'LOGOUT' });
    showNotification('Você saiu do sistema.', 'info');
  };

  return (
    <AppContext.Provider value={{ state, dispatch: dispatchWithBackend, showNotification, login, logout, isLoading }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
        {notifications.map(n => (
          <div 
            key={n.id}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-md shadow-lg min-w-[300px] text-white animate-fadeIn
              ${n.type === 'success' ? 'bg-green-600' : n.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}
            `}
          >
            {n.type === 'success' && <CheckCircle size={18} />}
            {n.type === 'error' && <AlertCircle size={18} />}
            {n.type === 'info' && <AlertCircle size={18} />}
            
            <span className="flex-1 text-sm font-medium break-all">{n.message}</span>
            
            <button 
              onClick={() => removeNotification(n.id)}
              className="text-white/80 hover:text-white flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
