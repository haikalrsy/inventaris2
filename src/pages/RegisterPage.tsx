import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      navigate('/app', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      setError(null);
      
      // Use the email specifically provided to determine initial role
      await signUp(email, password, fullName, 'siswa');

      setSuccess(true);
      setError('Unit Initialized. Redirecting to access terminal...');

      // Redirect to /app because signUp likely logged the user in
      setTimeout(() => {
        navigate('/app', { replace: true });
      }, 1500);
    } catch (err: any) {
      if (err.message?.includes('rate limit')) {
        setError('Security: Too many registration requests. Please wait.');
      } else {
        setError(err.message || 'Registration failed. Check connectivity.');
      }
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
        <div className="glass-card rounded-3xl border border-brand-border shadow-2xl p-8 md:p-12">
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
               <div className="w-12 h-[1px] bg-brand-lime opacity-30" />
               <div className="w-2 h-2 bg-brand-lime rounded-full animate-pulse" />
               <div className="w-12 h-[1px] bg-brand-lime opacity-30" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Register <span className="text-brand-lime">Unit</span></h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] mt-2">Initialize System Profile</p>
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

          {success && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-6 p-4 bg-brand-lime/10 text-brand-lime rounded-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border border-brand-lime/20"
            >
              <CheckCircle2 size={14} />
              UNIT_INITIALIZED. REDIRECTING...
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Core Identity (Full Name)</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-brand-lime transition-colors" size={16} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-brand-black border border-brand-border rounded-xl focus:border-brand-lime/50 transition-all outline-none text-white font-bold text-sm tracking-tight"
                  placeholder="AGENT_NAME..."
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Terminal ID (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-brand-lime transition-colors" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-brand-black border border-brand-border rounded-xl focus:border-brand-lime/50 transition-all outline-none text-white font-bold text-sm tracking-tight"
                  placeholder="USER@LAB.COM"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Access Protocol (Password)</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-brand-lime transition-colors" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-brand-black border border-brand-border rounded-xl focus:border-brand-lime/50 transition-all outline-none text-white font-bold text-sm tracking-tight"
                  placeholder="MIN_6_CHRS..."
                  minLength={6}
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(186,255,0,0.2)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || success}
              className="w-full py-4 bg-brand-lime text-black font-black text-xs uppercase tracking-[0.3em] rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-3 mt-4"
            >
              {loading ? 'INITIALIZING...' : 'AUTHORIZE_UNIT'}
              {!loading && !success && <UserPlus size={16} />}
            </motion.button>
          </form>

          <div className="mt-8 text-center pt-8 border-t border-brand-border">
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-loose">
              Returning Operator?{' '}
              <Link to="/login" className="text-brand-lime font-black hover:underline block md:inline md:ml-2">
                Initiate Access
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center text-[8px] font-mono font-bold text-slate-700 uppercase tracking-[0.5em]">
          ENCRYPTION_ACTIVE / SECURE_LAYER_V2
        </div>
      </motion.div>
    </div>
  );
}
