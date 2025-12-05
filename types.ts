
export enum Specialty {
  DC_IA = 'DC-IA',
  DC_UX = 'DC-UX',
  DC_FULL = 'DC Full'
}

export enum RequestType {
  VACATION = 'Férias',
  DAY_OFF = 'Folga Avulsa',
  SICK_LEAVE = 'Licença Médica'
}

export interface Employee {
  id: string;
  name: string;
  specialty: Specialty;
  active: boolean;
}

export interface CalendarRequest {
  id: string;
  employeeId: string;
  startDate: string; // ISO Date YYYY-MM-DD
  endDate: string;   // ISO Date YYYY-MM-DD
  type: RequestType;
  meuRhLaunched: boolean; // Only relevant for VACATION
  notes?: string;
}

export interface Holiday {
  id: string;
  date: string; // ISO Date YYYY-MM-DD
  name: string;
  location: 'SP' | 'BH' | 'MEX' | 'MAD' | 'GLOBAL' | 'BR';
}

export interface AppState {
  employees: Employee[];
  requests: CalendarRequest[];
  holidays: Holiday[];
  currentUser: string | null;
}

export type AppAction =
  | { type: 'ADD_EMPLOYEE'; payload: Employee }
  | { type: 'IMPORT_EMPLOYEES'; payload: Employee[] }
  | { type: 'REMOVE_EMPLOYEE'; payload: string }
  | { type: 'ADD_REQUEST'; payload: CalendarRequest }
  | { type: 'DELETE_REQUEST'; payload: string }
  | { type: 'ADD_HOLIDAY'; payload: Holiday }
  | { type: 'IMPORT_HOLIDAYS'; payload: Holiday[] }
  | { type: 'DELETE_HOLIDAY'; payload: string }
  | { type: 'LOGIN'; payload: string }
  | { type: 'LOGOUT' };
