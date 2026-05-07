import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { PCDevice, DamageReport, LabType, LABS } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  X, 
  Monitor, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  MoreVertical,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export default function DamageReports() {
  const { profile, isAdmin } = useAuth();
  const [reports, setReports] = useState<DamageReport[]>([]);
  const [pcs, setPcs] = useState<PCDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [labFilter, setLabFilter] = useState<string>('all');
  
  // Form state
  const [formData, setFormData] = useState({
    pc_id: '',
    reporter_name: profile?.full_name || '',
    description: ''
  });

  useEffect(() => {
    fetchReports();
    fetchPcs();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('damage_reports')
        .select('*, pcs(pc_name, lab)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedReports = (data || []).map(r => ({
        ...r,
        pc_name: r.pcs?.pc_name,
        lab: r.pcs?.lab
      }));

      setReports(formattedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPcs = async () => {
    try {
      const { data } = await supabase.from('pcs').select('*').order('pc_name');
      setPcs(data || []);
    } catch (error) {
      console.error('Error fetching PCs:', error);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Insert report
      const { error: reportError } = await supabase
        .from('damage_reports')
        .insert([{
          ...formData,
          status: 'Baru'
        }]);
      
      if (reportError) throw reportError;

      // 2. Update PC status to 'Rusak'
      await supabase
        .from('pcs')
        .update({ status: 'Rusak' })
        .eq('id', formData.pc_id);

      setIsModalOpen(false);
      fetchReports();
      setFormData({ pc_id: '', reporter_name: profile?.full_name || '', description: '' });
    } catch (error: any) {
      console.error('Submission Error:', error);
      if (error.code === '42501' || error.status === 403) {
        alert('Database Lockdown (403): RLS Policy violation detected.\n\nACTION REQUIRED:\nRun the provided SQL script in your Supabase SQL Editor to authorize "damage_reports" INSERT and "pcs" UPDATE operations.');
      } else {
        alert('Transmission Failed: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string, pcId: string) => {
    if (!isAdmin) {
      alert("Unauthorized: Only admins can manage report status.");
      return;
    }
    try {
      const { error } = await supabase
        .from('damage_reports')
        .update({ status: newStatus })
        .eq('id', reportId);
      
      if (error) throw error;

      // If finished, set PC back to 'Baik'
      if (newStatus === 'Selesai') {
        await supabase
          .from('pcs')
          .update({ status: 'Baik' })
          .eq('id', pcId);
      } else {
        await supabase
          .from('pcs')
          .update({ status: 'Rusak' })
          .eq('id', pcId);
      }

      fetchReports();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.pc_name?.toLowerCase().includes(search.toLowerCase()) || 
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.reporter_name.toLowerCase().includes(search.toLowerCase());
    const matchesLab = labFilter === 'all' || r.lab === labFilter;
    return matchesSearch && matchesLab;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            SYSTEM <span className="text-brand-lime">/ ANOMALIES</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-1">Status Logs & Maintenance Protocol</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-lime text-black px-8 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(186,255,0,0.2)] hover:scale-105 active:scale-95 transition-all"
        >
          LOG ANOMALY [+]
        </button>
      </div>

      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 border-brand-border/50">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-lime opacity-50" />
          <input 
            type="text"
            placeholder="SCAN LOG_ENTRIES OR REPORTER_ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-brand-dark/50 border border-brand-border rounded-xl focus:outline-none focus:border-brand-lime/50 transition-all text-[10px] font-mono font-bold text-white placeholder:text-slate-700"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-lime opacity-50" />
            <select 
              value={labFilter}
              onChange={(e) => setLabFilter(e.target.value)}
              className="pl-10 pr-10 py-3 bg-brand-dark/50 border border-brand-border rounded-xl focus:outline-none appearance-none font-black text-slate-400 text-[10px] uppercase tracking-widest cursor-pointer hover:border-brand-lime/30 transition-colors"
            >
              <option value="all">ALL_SECTORS</option>
              {LABS.map(lab => <option key={lab} value={lab}>SECTOR_{lab}</option>)}
            </select>
          </div>
        </div>
      </div>

      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.05
            }
          }
        }}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {filteredReports.map((report) => (
          <motion.div 
            key={report.id}
            variants={{
              hidden: { x: -10, opacity: 0 },
              show: { x: 0, opacity: 1 }
            }}
            whileHover={{ x: 5 }}
            className="glass-card p-6 rounded-2xl border-brand-border/50 flex flex-col md:flex-row md:items-center justify-between gap-6 group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-lime opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-start gap-6 flex-1 min-w-0">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all",
                report.status === 'Selesai' ? "bg-green-500/5 text-green-500 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]" :
                report.status === 'Diproses' ? "bg-blue-500/5 text-blue-500 border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]" :
                "bg-red-500/5 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
              )}>
                {report.status === 'Selesai' ? <CheckCircle2 size={24} /> :
                 report.status === 'Diproses' ? <Clock size={24} /> :
                 <AlertCircle size={24} />}
              </div>
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-black text-white tracking-tight leading-none">{report.pc_name} <span className="text-slate-700 font-normal">/</span> SECTOR_{report.lab}</h3>
                  <span className={cn(
                    "px-3 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border",
                    report.status === 'Selesai' ? "bg-green-500/10 text-green-500 border-green-500/20" :
                    report.status === 'Diproses' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                    "bg-red-500/10 text-red-500 border-red-500/20"
                  )}>
                    {report.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed font-mono line-clamp-1 italic">
                  &gt; {report.description}
                </p>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                  <span className="text-white/40">USER_ID:</span> {report.reporter_name} 
                  <span className="text-slate-800">|</span> 
                  <span className="text-white/40">TIMESTAMP:</span> {format(new Date(report.created_at), 'dd.MM.yyyy HH:mm')}
                </p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                {report.status === 'Baru' && (
                  <button 
                    onClick={() => updateReportStatus(report.id, 'Diproses', report.pc_id)}
                    className="px-6 py-3 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    DEPLOY TASK
                  </button>
                )}
                {report.status === 'Diproses' && (
                  <button 
                    onClick={() => updateReportStatus(report.id, 'Selesai', report.pc_id)}
                    className="px-6 py-3 bg-brand-lime/10 text-brand-lime border border-brand-lime/20 rounded-xl hover:bg-brand-lime/20 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                  >
                    ARCHIVE LOG
                    <Check size={14} />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {filteredReports.length === 0 && !loading && (
          <div className="p-20 text-center glass-card rounded-[3rem] border-dashed border-brand-border">
            <div className="w-16 h-16 bg-brand-dark rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-border">
              <FileText size={24} className="text-slate-700" />
            </div>
            <h3 className="text-lg font-black text-white mb-1 uppercase tracking-tighter">Logs Clear</h3>
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">No anomalies detected in current sector buffer.</p>
          </div>
        )}
      </motion.div>

      {/* Report Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-brand-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-brand-dark w-full max-w-lg rounded-3xl border border-brand-border shadow-2xl shadow-brand-lime/5 overflow-hidden"
            >
              <div className="bg-brand-lime p-8 text-black flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter text-black">Log Anomaly</h3>
                  <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Initialization Protocol</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-black/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleSubmitReport} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Target Identifier</label>
                  <select 
                    required
                    value={formData.pc_id}
                    onChange={(e) => setFormData({...formData, pc_id: e.target.value})}
                    className="w-full px-5 py-4 bg-brand-black border border-brand-border rounded-xl focus:outline-none focus:border-brand-lime/50 transition-all appearance-none font-bold text-slate-400 text-sm uppercase tracking-widest"
                  >
                    <option value="">SCAN_UNITS_MATRIX...</option>
                    {pcs.map(pc => (
                      <option key={pc.id} value={pc.id}>
                        {pc.pc_name} [SECTOR_{pc.lab}]
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Agent Assignment</label>
                  <input 
                    required
                    type="text"
                    value={formData.reporter_name}
                    onChange={(e) => setFormData({...formData, reporter_name: e.target.value})}
                    className="w-full px-5 py-4 bg-brand-black border border-brand-border rounded-xl focus:outline-none focus:border-brand-lime/50 transition-all font-bold text-white placeholder:text-slate-700 text-sm"
                    placeholder="VERIFY_IDENTITY..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Event Description</label>
                  <textarea 
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-5 py-4 bg-brand-black border border-brand-border rounded-xl focus:outline-none focus:border-brand-lime/50 transition-all font-mono text-white placeholder:text-slate-800 text-sm min-h-[120px]"
                    placeholder="INIT_ERROR_LOG: Describe the anomaly details..."
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-brand-black border border-brand-border text-slate-500 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-brand-lime text-black rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(186,255,0,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? 'EXECUTING...' : 'TRANSMIT_LOG'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
