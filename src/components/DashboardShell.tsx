import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Terminal,
  Home,
  Database,
  AlertTriangle,
  Cpu,
  Zap,
  FileText,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useOverrideBadge } from '../hooks/useOverrideBadge';
import { clearSessionDataForLogout } from '../utils/clearSessionLocalStorage';

export type ArchiveNav = 'mission' | 'crew' | 'syslog';

export default function DashboardShell({
  children,
  typewriterTitle,
  archiveActive,
}: {
  children: React.ReactNode;
  typewriterTitle: string;
  archiveActive: ArchiveNav;
}) {
  const navigate = useNavigate();
  const overrideBadge = useOverrideBadge();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [titleDone, setTitleDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayedTitle(typewriterTitle.slice(0, i));
      if (i >= typewriterTitle.length) {
        clearInterval(iv);
        setTimeout(() => setTitleDone(true), 2000);
      }
    }, 60);
    return () => clearInterval(iv);
  }, [typewriterTitle]);

  const handleLogout = () => {
    clearSessionDataForLogout();
    navigate('/');
  };

  return (
    <div className="flex h-screen w-full flex-col bg-[#000d1a] font-mono text-cyan-400 selection:bg-cyan-500/30">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="h-full w-full opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 104l30-17.32V17.32L30 0 0 17.32v69.36L30 104zM30 101.15L2.5 85.27V18.73L30 2.85l27.5 15.88v66.54l-27.5 15.88z' fill='rgba(0, 229, 255, 0.04)' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 104px',
          }}
        />
      </div>

      <nav className="fixed top-0 z-50 flex h-12 w-full items-center justify-between border-b border-cyan-500/30 bg-[#000d1a]/80 px-4 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
        <div className="flex items-center gap-2 font-bold tracking-[0.2em]">
          <Terminal size={18} className="text-cyan-400" />
          <span>AEONGUARD</span>
        </div>
        <div className="flex-1 overflow-hidden mx-8 border-x border-cyan-500/10">
          <div className="animate-[ticker_60s_linear_infinite] whitespace-nowrap text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest text-cyan-500/80">
            {[0, 1].map(dup => (
              <React.Fragment key={dup}>
                <span className="mx-4">🟢 AEONGUARD ARCHIVE · SECURE ACCESS</span>
                <span className="mx-4">🔒 ALL RECORDS ENCRYPTED · ADMIN AUDIT</span>
                <span className="mx-4">📁 WANDERING EARTH PROJECT · YEAR 847</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest">
          <div className="flex items-center gap-2 mr-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="p-1.5 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors text-cyan-400/60 hover:text-cyan-400"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-50">ADMIN_01 · ADMINISTRATOR</span>
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 border border-cyan-500/30 px-2 py-1 hover:bg-cyan-500/10 transition-colors"
          >
            <LogOut size={12} />
            LOGOUT
          </button>
        </div>
      </nav>

      <div className="flex flex-1 pt-12 bg-[#000d1a]">
        <aside
          className={`fixed left-0 h-full border-r border-cyan-500/30 bg-[#000d1a]/95 z-40 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'w-[14vw] min-w-[160px] max-w-[220px] p-4' : 'w-[48px] p-2'
          }`}
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute top-0 right-0 p-1 text-cyan-400 hover:bg-[rgba(0,229,255,0.1)] transition-colors z-10"
            >
              {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
          <div className={`flex flex-col gap-4 ${sidebarOpen ? '' : 'mt-6'}`}>
            <div>
              {sidebarOpen && (
                <div className="mb-2 text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold tracking-widest opacity-30">CORE</div>
              )}
              <ul className="space-y-1 list-none">
                <SidebarItem to="/dashboard" icon={<Home size={14} />} label="HOME" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/pods" icon={<Database size={14} />} label="POD MONITORING" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/habitat" icon={<AlertTriangle size={14} />} label="HABITAT ALERT" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/ai" icon={<Cpu size={14} />} label="AI ENGINE" collapsed={!sidebarOpen} />
                <SidebarItem
                  to="/dashboard/override"
                  icon={<Zap size={14} />}
                  label="HUMAN OVERRIDE"
                  badge={overrideBadge}
                  collapsed={!sidebarOpen}
                />
              </ul>
            </div>
            <div className="h-[1px] w-full bg-cyan-500/10" />
            <div>
              {sidebarOpen && (
                <div className="mb-2 text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold tracking-widest opacity-30">ARCHIVE</div>
              )}
              <ul className="space-y-1 list-none">
                <SidebarItem
                  to="/dashboard/mission"
                  icon={<FileText size={14} />}
                  label="MISSION LOG"
                  active={archiveActive === 'mission'}
                  collapsed={!sidebarOpen}
                />
                <SidebarItem
                  to="/dashboard/crew"
                  icon={<Users size={14} />}
                  label="CREW ROSTER"
                  active={archiveActive === 'crew'}
                  collapsed={!sidebarOpen}
                />
                <SidebarItem
                  to="/dashboard/syslog"
                  icon={<ClipboardList size={14} />}
                  label="SYSTEM LOG"
                  active={archiveActive === 'syslog'}
                  collapsed={!sidebarOpen}
                />
              </ul>
            </div>
            <div className="h-[1px] w-full bg-cyan-500/10" />
            <SidebarItem to="/dashboard/settings" icon={<Settings size={14} />} label="SETTINGS" collapsed={!sidebarOpen} />
          </div>
        </aside>

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden bg-[#000d1a] transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-[14vw]' : 'ml-[48px]'}`}
        >
          <div className="border-b border-cyan-500/20 bg-[#000814]/90 p-6 pb-4">
            <h1 className="text-[clamp(1rem,1.5vw,1.5rem)] font-bold tracking-[0.3em] text-cyan-400 mb-1">
              {displayedTitle}
              {!titleDone && <span style={{ animation: 'blink 0.8s infinite' }}>|</span>}
            </h1>
            <div className="text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-[0.2em] text-cyan-500/50">
              ADMINISTRATOR AUTHORIZATION REQUIRED · ALL RECORDS ARE LOGGED
            </div>
          </div>
          {children}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }` }} />
    </div>
  );
}

function SidebarItem({
  to,
  icon,
  label,
  active = false,
  badge,
  collapsed = false,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  collapsed?: boolean;
}) {
  return (
    <li className="relative group/item list-none">
      <Link
        to={to}
        className={`flex items-center py-2 text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest transition-all hover:bg-cyan-500/10 ${
          collapsed ? 'justify-center px-0' : 'justify-between px-3'
        } ${active ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-cyan-500/60'}`}
      >
        <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
          {icon}
          {!collapsed && <span>{label}</span>}
        </div>
        {!collapsed && badge !== undefined && badge > 0 && (
          <span className="bg-red-500 text-white text-[clamp(0.5rem,0.55vw,0.6875rem)] px-1.5 py-0.5 rounded-full animate-pulse">
            {badge}
          </span>
        )}
        {collapsed && badge !== undefined && badge > 0 && (
          <span className="absolute top-0 right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </Link>
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-[#000d1a] border border-cyan-500/30 text-[clamp(0.5rem,0.55vw,0.6875rem)] text-cyan-400 tracking-widest whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none z-50">
          {label}
        </div>
      )}
    </li>
  );
}
