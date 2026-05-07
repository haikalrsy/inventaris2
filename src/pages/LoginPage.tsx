import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { isAdmin } from '../config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const { signInWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Handle auto-redirection only when auth settles and we're not actively logging in nor modified the form
  useEffect(() => {
    if (user && !authLoading && !loading && !isModified) {
      const currentPath = window.location.pathname;
      if (currentPath === '/login') {
        navigate('/app', { replace: true });
      }
    }
  }, [user, authLoading, navigate, loading, isModified]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      // Navigation is now handled by the useEffect above naturally
    } catch (err: any) {
      console.error('Google Auth Trigger Error:', err);
      setError(err.message || 'Identity Sync failed. Try Terminal Login.');
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid credentials. Check your email and password.');
        }
        // Email confirmation check disabled
        throw error;
      };

      if (data.user) {
        navigate('/app', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-black p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #BAFF00 1px, transparent 0)', backgroundSize: '40px 40px' }} 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="glass-card rounded-3xl border border-brand-border shadow-2xl p-8 md:p-12 overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <ShieldCheck size={120} className="text-brand-lime" />
          </div>

          <div className="mb-10">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-2 h-2 bg-brand-lime rounded-full" />
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Authentication Matrix</h2>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">ACCESS <span className="text-brand-lime neon-glow">GRANTED.</span></h1>
          </div>

          {error && (
            <motion.div 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border border-red-500/20"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Terminal ID (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (!isModified) setIsModified(true);
                  }}
                  className="w-full pl-12 pr-4 py-4 bg-brand-black border border-brand-border rounded-xl focus:border-brand-lime/50 transition-all outline-none text-white font-bold text-sm tracking-tight"
                  placeholder="name@sector.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Security Key (Password)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (!isModified) setIsModified(true);
                  }}
                  className="w-full pl-12 pr-4 py-4 bg-brand-black border border-brand-border rounded-xl focus:border-brand-lime/50 transition-all outline-none text-white font-bold text-sm tracking-tight"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(186,255,0,0.2)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-lime text-black font-black text-xs uppercase tracking-[0.3em] rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? 'INITIALIZING...' : 'EXECUTE_LOGIN'}
              {!loading && <LogIn size={16} />}
            </motion.button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-brand-border"></div>
            </div>
            <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.3em]">
              <span className="px-4 bg-brand-dark text-slate-600">Sync with Workspace</span>
            </div>
          </div>

          <motion.button
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-8 w-full py-4 bg-transparent border border-brand-border text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4 grayscale contrast-200" />
            Sector Account
          </motion.button>

          <div className="mt-8 text-center pt-8 border-t border-brand-border">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
              Unregistered Personnel?{' '}
              <Link to="/register" className="text-brand-lime font-black hover:underline ml-2">
                Create Entry
              </Link>
            </p>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="mt-8 flex justify-between text-[8px] font-mono font-bold text-slate-700 uppercase tracking-[0.4em]">
          <span>© LABSYS_PROTOCOL_2024</span>
          <span className="flex items-center gap-2">
            <div className="w-1 h-1 bg-brand-lime rounded-full animate-pulse" />
            Secure Connection
          </span>
        </div>
      </motion.div>
    </div>
  );
}
