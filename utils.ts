import * as dateFns from 'date-fns';
import * as dateFnsLocale from 'date-fns/locale';
import { Holiday, CalendarRequest, Specialty, RequestType } from './types';

// Extract functions safely to handle potential version mismatches or TS import issues
const {
  eachDayOfInterval,
  isWeekend,
  isSameDay,
  format,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  addYears,
  subYears,
  addMonths,
  subMonths,
  getDate,
  getDay,
  isWithinInterval
} = dateFns as any;

const parseISO = (dateFns as any).parseISO || (dateFns as any).parse;
const ptBR = (dateFnsLocale as any).ptBR || (dateFnsLocale as any).pt;

// Use crypto.randomUUID for Postgres compatibility
export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const getBusinessDaysCount = (start: string, end: string, holidays: Holiday[]) => {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  
  if (startDate > endDate) return 0;

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  return days.filter((day: Date) => {
    if (isWeekend(day)) return false;
    // Check if it's a holiday (global or relevant location - simplifying to global check for stats)
    const isHoliday = holidays.some(h => isSameDay(parseISO(h.date), day));
    return !isHoliday;
  }).length;
};

// Check concurrent vacations for a specific day and specialty
export const getConcurrencyCount = (
  date: Date, 
  specialty: Specialty, 
  requests: CalendarRequest[], 
  employees: any[]
) => {
  return requests.filter(req => {
    const emp = employees.find(e => e.id === req.employeeId);
    if (!emp || emp.specialty !== specialty) return false;
    
    // Only count Vacations for the limit rule
    if (req.type !== RequestType.VACATION) return false;

    const start = parseISO(req.startDate);
    const end = parseISO(req.endDate);
    return date >= start && date <= end;
  }).length;
};

export const parseCSV = (content: string): any[] => {
  const lines = content.split('\n');
  const result = [];
  const headers = lines[0].split(',').map(h => h.trim());

  for (let i = 1; i < lines.length; i++) {
    const obj: any = {};
    const currentline = lines[i].split(',');

    if(currentline.length < headers.length) continue;

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j]?.trim();
    }
    result.push(obj);
  }
  return result;
};

// Date helpers for Dashboard and other components
export { 
  startOfYear, endOfYear, eachMonthOfInterval, addYears, subYears, 
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, 
  getDate, isWeekend, getDay, parseISO, addMonths, subMonths, 
  isWithinInterval, ptBR, getDaysInMonth
};