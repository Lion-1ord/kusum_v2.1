import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fphabxeduhwpwxqvtspo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwaGFieGVkdWh3cHd4cXZ0c3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDgzODYsImV4cCI6MjA5NTk4NDM4Nn0.jVG6cXXe0DISmQlQA10WwYBu6xAPxxhxdY7SltRD36w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

