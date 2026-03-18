import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User as UserIcon, LogIn, Chrome } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthProps {
  onLogin: (userId: string, nome: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          // Fetch or ensure profile exists
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('nome')
            .eq('id', data.user.id)
            .single();

          // If profile doesn't exist, we might want to create it now if we have metadata
          let finalNome = profile?.nome || data.user.user_metadata?.nome || email.split('@')[0];
          
          if (!profile && data.user) {
            await supabase.from('users').insert([{
              id: data.user.id,
              nome: finalNome,
              username: finalNome.toLowerCase().replace(/\s/g, '')
            }]).select().single();
          }

          onLogin(data.user.id, finalNome);
        }
      } else {
        // Register
        if (!nome) {
          throw new Error('Inserisci il tuo nome');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome: nome
            }
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          // Manually create profile in public.users to be sure
          const { error: insertError } = await supabase.from('users').insert([{
            id: data.user.id,
            nome: nome,
            username: nome.toLowerCase().replace(/\s/g, '')
          }]);
          
          if (insertError) console.error('Error creating profile:', insertError);

          if (!data.session) {
            setError('Registrazione completata! Controlla la tua email per confermare l\'account prima di accedere.');
          } else {
            onLogin(data.user.id, nome);
          }
        }
      }
    } catch (err: any) {
      const msg = err.message?.toLowerCase() || '';
      if (isLogin && (msg.includes('invalid login credentials') || msg.includes('email not confirmed'))) {
        setError(msg.includes('confirmed') ? 'Conferma la tua email prima di accedere!' : 'Email o password errata.');
      } else if (isLogin && msg.includes('user not found')) {
        setIsLogin(false);
        setError('Nessun account trovato con questa email. Registrati!');
      } else if (!isLogin && msg.includes('already registered')) {
        setIsLogin(true);
        setError('Hai già un account! Effettua il login.');
      } else {
        setError(err.message || 'Si è verificato un errore');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Errore durante il login con Google');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full ios-card p-6 sm:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/40 pointer-events-none" />

        <div className="relative z-10 text-center mb-8">
          <img src="/logo.png" alt="ReMatch" className="h-6 w-auto inline-block mx-auto mb-6 drop-shadow-sm" />
          <h2 className="text-3xl font-black font-display text-ios-label mb-2 tracking-tight">{isLogin ? 'Bentornato' : 'Crea Account'}</h2>
          <p className="text-ios-gray text-sm font-medium">
            {isLogin ? 'Accedi per continuare su ReMatch' : 'Unisciti alla community'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="relative z-10 space-y-4 text-left">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-xs font-bold text-ios-gray ml-1 uppercase tracking-wider">Nome</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ios-gray/50" />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-ios-secondary/50 border border-transparent rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-brand-end/30 focus:ring-2 focus:ring-brand-end/20 transition-all text-ios-label font-bold placeholder-ios-gray/40"
                    placeholder="Mario"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <label className="text-xs font-bold text-ios-gray ml-1 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ios-gray/50" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-ios-secondary/50 border border-transparent rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-brand-end/30 focus:ring-2 focus:ring-brand-end/20 transition-all text-ios-label font-bold placeholder-ios-gray/40"
                placeholder="mario@esempio.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-ios-gray ml-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ios-gray/50" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-ios-secondary/50 border border-transparent rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-brand-end/30 focus:ring-2 focus:ring-brand-end/20 transition-all text-ios-label font-bold placeholder-ios-gray/40"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className={`text-sm text-center p-3 rounded-xl border ${
                error.includes('completata') || error.includes('account!')
                  ? 'bg-green-500/10 text-green-400 border-green-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="ios-btn-primary w-full disabled:opacity-70 disabled:cursor-not-allowed mt-6 flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                {isLogin ? 'Accedi' : 'Registrati'}
              </>
            )}
          </button>
        </form>

        <div className="relative z-10 mt-6 pt-6 border-t border-black/[0.05]">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="ios-btn-secondary w-full flex items-center justify-center gap-3 disabled:opacity-70"
          >
            <Chrome className="w-5 h-5 text-brand-end" />
            Continua con Google
          </button>
        </div>

        <p className="relative z-10 text-center mt-8 text-sm font-medium text-ios-gray">
          {isLogin ? "Non hai un account? " : "Hai già un account? "}
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-brand-end hover:text-brand-start font-bold transition-colors cursor-pointer"
          >
            {isLogin ? 'Createlo ora' : 'Accedi'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
