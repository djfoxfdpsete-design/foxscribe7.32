import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { NeonButton } from './NeonButton';

interface AuthProps {
  onEnterOffline: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onEnterOffline }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Verifique seu email para confirmar o cadastro!');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neon-bg p-4 animate-in fade-in zoom-in duration-500">
      <div className="w-full max-w-md p-8 rounded-2xl bg-neon-surface border border-slate-800 shadow-[0_0_50px_-12px_rgba(249,115,22,0.15)]">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Fox<span className="text-neon-orange">Scribe</span> Auth
          </h2>
          <p className="text-slate-400">Acesse sua área exclusiva (Supabase)</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm text-center">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-neon-orange focus:ring-1 focus:ring-neon-orange outline-none transition-all"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Senha</label>
            <input
              type="password"
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-neon-orange focus:ring-1 focus:ring-neon-orange outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <NeonButton 
            type="submit" 
            className="w-full mt-4" 
            disabled={loading}
          >
            {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
          </NeonButton>
        </form>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-neon-surface text-slate-500">Ou</span>
            </div>
        </div>

        <button 
          type="button"
          onClick={onEnterOffline}
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-colors border border-slate-700 hover:border-neon-cyan flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Visualizar Layout (Modo Demo)
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
            className="text-sm text-slate-400 hover:text-neon-cyan transition-colors"
          >
            {isLogin ? 'Não tem conta? Registre-se' : 'Já tem conta? Faça Login'}
          </button>
        </div>
      </div>
    </div>
  );
};