import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
// URL do projeto e Chave fornecidas pelo usuário
const supabaseUrl = 'https://rdjmjbfcxnmonytgkkzh.supabase.co';
const supabaseKey = 'sb_publishable_nA-PX4HIbL94RTthnbrGwQ_cdqiomcQ';

export const supabase = createClient(supabaseUrl, supabaseKey);