import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  Monitor,
  FileText,
  BarChart2,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardLayout() {
  const { user, profile, signOut, isAdmin } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout navigation failed:', error);
      window.location.href = '/login';
    }
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      path: '/app',
      show: true,
    },
    {
      title: 'Inventory',
      icon: <Monitor className="w-5 h-5" />,
      path: '/app/inventory',
      show: true,
    },
    {
      title: 'Reports',
      icon: <FileText className="w-5 h-5" />,
      path: '/app/reports',
      show: true,
    },
    {
      title: 'Analytics',
      icon: <BarChart2 className="w-5 h-5" />,
      path: '/app/analytics',
      show: isAdmin,
    },
    {
      title: 'Personnel',
      icon: <Users className="w-5 h-5" />,
      path: '/app/user-management',
      show: isAdmin,
    },
  ];

  return (
    <div className="min-h-screen bg-brand-black flex relative font-sans overflow-hidden">
      {/* Scanline */}
      <div className="scanline pointer-events-none fixed inset-0 z-[100]" />

      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-brand-lime/5 blur-[120px] rounded-full"
        />
      </div>

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-brand-dark border-r border-brand-border transition-all duration-300 ease-in-out flex flex-col',
          isSidebarOpen
            ? 'w-64 translate-x-0'
            : 'w-20 -translate-x-0'
        )}
      >
        {/* HEADER */}
        <div className="p-6 pb-4 border-b border-brand-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-2 h-2 bg-brand-lime rounded-full animate-pulse shrink-0" />

              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.h1
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-2xl font-black tracking-tighter text-brand-lime whitespace-nowrap"
                  >
                    LabSys
                  </motion.h1>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {isSidebarOpen && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mt-3"
              >
                Sector 7-G / High Security
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 mt-4 space-y-2">
          {menuItems
            .filter((item) => item.show)
            .map((item) => {
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'relative flex items-center rounded-xl transition-all duration-300 overflow-hidden group',
                    isSidebarOpen
                      ? 'justify-start gap-3 px-4 py-3'
                      : 'justify-center px-0 py-3',
                    active
                      ? 'bg-brand-lime/10 border border-brand-lime/20 text-brand-lime'
                      : 'text-slate-500 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute left-0 top-2 bottom-2 w-1 bg-brand-lime rounded-full"
                    />
                  )}

                  <span
                    className={cn(
                      active
                        ? 'text-brand-lime'
                        : 'text-slate-600 group-hover:text-slate-300'
                    )}
                  >
                    {item.icon}
                  </span>

                  <AnimatePresence>
                    {isSidebarOpen && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="text-sm font-bold tracking-tight whitespace-nowrap"
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
        </nav>

        {/* FOOTER */}
        <div className="p-4 border-t border-brand-border">
          <div
            className={cn(
              'bg-brand-card rounded-2xl border border-brand-border flex items-center transition-all duration-300',
              isSidebarOpen ? 'p-4 gap-3' : 'p-3 justify-center'
            )}
          >
            <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center border border-brand-border">
              <User className="w-4 h-4 text-slate-400" />
            </div>

            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-black text-white truncate uppercase tracking-tighter">
                    {profile?.full_name ||
                      user?.email?.split('@')[0] ||
                      'Unknown User'}
                  </p>

                  <div className="flex items-center gap-1 mt-1">
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isAdmin
                          ? 'bg-red-500 animate-pulse'
                          : 'bg-green-500'
                      )}
                    />

                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                      {profile?.role ||
                        (isAdmin ? 'Admin (Config)' : 'Guest')}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 overflow-hidden relative z-10 transition-all duration-300',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        )}
      >
        {/* NAVBAR */}
        <header className="h-16 bg-brand-black/50 backdrop-blur-md border-b border-brand-border flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* MOBILE BUTTON */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-slate-400"
            >
              {isSidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            <div className="hidden lg:flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
              <span className="opacity-50">App</span>
              <span className="opacity-30">/</span>
              <span className="text-brand-lime">
                {menuItems.find(
                  (item) => item.path === location.pathname
                )?.title || 'Home'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-brand-card rounded-lg border border-brand-border text-slate-400">
              <div className="w-1.5 h-1.5 bg-brand-lime rounded-full animate-pulse" />

              <span className="text-[10px] font-mono tracking-tighter">
                SYS READY / 200 OK
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-300 border border-red-500/20 active:scale-95"
              title="Sign Out"
              aria-label="Secure Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* PAGE */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-brand-black">
          <Outlet />
        </main>
      </div>
    </div>
  );
}