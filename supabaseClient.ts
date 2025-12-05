
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cfxfuujcxyrfacytmdhm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmeGZ1dWpjeHlyZmFjeXRtZGhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDEzNjIsImV4cCI6MjA4MDI3NzM2Mn0.PZ1RPm7CQbmCXeWufvlgP4f9kF_pSbUYoh1tIg8LTN0';

export const supabase = createClient(supabaseUrl, supabaseKey.trim());
