
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bkavbdpiffvlywqqkqiz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrYXZiZHBpZmZ2bHl3cXFrcWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTQ2OTksImV4cCI6MjA2NzQ3MDY5OX0.FM_sQ0J7yq7cd-kI9sD5Tcvj4CgvWfCteRvR8DEL-Uw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);