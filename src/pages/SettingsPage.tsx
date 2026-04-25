import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOverrideBadge } from '../hooks/useOverrideBadge';
import { clearSessionDataForLogout } from '../utils/clearSessionLocalStorage';
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
        {!collapsed && badge ? (
          <span className="bg-red-500 text-white text-[clamp(0.5rem,0.55vw,0.6875rem)] px-1.5 py-0.5 rounded-full animate-pulse">
            {badge}
          </span>
        ) : null}
        {collapsed && badge ? <span className="absolute top-0 right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" /> : null}
      </Link>
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-[#000d1a] border border-cyan-500/30 text-[clamp(0.5rem,0.55vw,0.6875rem)] text-cyan-400 tracking-widest whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none z-50">
          {label}
        </div>
      )}
    </li>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const overrideBadge = useOverrideBadge();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [titleDone, setTitleDone] = useState(false);
  const fullTitle = 'SYSTEM SETTINGS';

  const [auth] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('aeonguard_user') || '{}') as {
        id?: string;
        role?: string;
        name?: string;
      };
    } catch {
      return {} as { id?: string; role?: string; name?: string };
    }
  });

  const [sessionStart] = useState(() =>
    new Date().toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  );

  const handleLogout = () => {
    clearSessionDataForLogout();
    navigate('/');
  };

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayedTitle(fullTitle.slice(0, i));
      if (i >= fullTitle.length) {
        clearInterval(iv);
        setTimeout(() => setTitleDone(true), 2000);
      }
    }, 60);
    return () => clearInterval(iv);
  }, []);

  const operatorId = auth.id ?? 'ADMIN_01';
  const role = auth.role ?? 'ADMINISTRATOR';
  const name = auth.name ?? 'Administrator';

  return (
    <div className="flex h-screen w-full flex-col bg-[#000d1a] font-mono text-cyan-400 selection:bg-cyan-500/30">
      <style dangerouslySetInnerHTML={{ __html: `@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }` }} />

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
                <span className="mx-4">🟢 SYSTEM CONFIG</span>
                <span className="mx-4">🟢 SESSION ACTIVE</span>
                <span className="mx-4">🟢 LOCAL STORAGE</span>
                <span className="mx-4">🟢 UI THEME: WANDERING EARTH</span>
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
            <span className="opacity-50">
              {operatorId} · {role}
            </span>
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
              <ul className="space-y-1">
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
              <ul className="space-y-1">
                <SidebarItem to="/dashboard/mission" icon={<FileText size={14} />} label="MISSION LOG" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/crew" icon={<Users size={14} />} label="CREW ROSTER" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/syslog" icon={<ClipboardList size={14} />} label="SYSTEM LOG" collapsed={!sidebarOpen} />
              </ul>
            </div>
            <div className="h-[1px] w-full bg-cyan-500/10" />
            <SidebarItem
              to="/dashboard/settings"
              icon={<Settings size={14} />}
              label="SETTINGS"
              active
              collapsed={!sidebarOpen}
            />
          </div>
        </aside>

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden bg-[#000d1a] transition-all duration-300 ease-in-out ${
            sidebarOpen ? 'ml-[14vw]' : 'ml-[48px]'
          }`}
        >
          <div className="border-b border-cyan-500/20 bg-[#000814]/90 p-6 pb-3">
            <h1 className="text-[clamp(1.2rem,1.8vw,1.8rem)] font-bold tracking-[0.3em] text-cyan-400 mb-2">
              {displayedTitle}
              {!titleDone && <span style={{ animation: 'blink 0.8s infinite' }}>|</span>}
            </h1>
            <div className="text-[clamp(0.6rem,0.7vw,0.8rem)] tracking-[0.2em] text-cyan-500/50">CONFIGURATION</div>
          </div>

          <div className="p-6 flex flex-col gap-10 pb-16 max-w-4xl">
            {/* Section 1 */}
            <section>
              <div className="text-[clamp(0.65rem,0.75vw,0.85rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">
                ── ACCOUNT ──
              </div>
              <div
                className="border border-cyan-500/30 bg-[rgba(0,15,30,0.6)] p-6"
                style={{ boxShadow: '0 0 24px rgba(0,229,255,0.06)' }}
              >
                <dl className="space-y-2 text-[clamp(0.6rem,0.7vw,0.8rem)] tracking-[0.12em] mb-6">
                  <div className="flex flex-wrap gap-3 border-b border-cyan-500/10 pb-2">
                    <dt className="text-cyan-500/50 w-44 shrink-0">OPERATOR ID:</dt>
                    <dd className="text-cyan-200/90">{operatorId}</dd>
                  </div>
                  <div className="flex flex-wrap gap-3 border-b border-cyan-500/10 pb-2">
                    <dt className="text-cyan-500/50 w-44 shrink-0">ROLE:</dt>
                    <dd className="text-cyan-200/90">{role}</dd>
                  </div>
                  <div className="flex flex-wrap gap-3 border-b border-cyan-500/10 pb-2">
                    <dt className="text-cyan-500/50 w-44 shrink-0">NAME:</dt>
                    <dd className="text-cyan-200/90">{name}</dd>
                  </div>
                  <div className="flex flex-wrap gap-3 border-b border-cyan-500/10 pb-2">
                    <dt className="text-cyan-500/50 w-44 shrink-0">SESSION START:</dt>
                    <dd className="text-cyan-200/90">{sessionStart}</dd>
                  </div>
                  <div className="flex flex-wrap gap-3 pb-2">
                    <dt className="text-cyan-500/50 w-44 shrink-0">STATUS:</dt>
                    <dd className="text-cyan-200/90">🟢 ONLINE</dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="border border-cyan-500/40 px-4 py-2 text-[clamp(0.6rem,0.7vw,0.75rem)] tracking-widest hover:bg-cyan-500/10 transition-colors"
                >
                  <LogOut size={14} className="inline mr-2 align-text-bottom" />
                  LOGOUT
                </button>
              </div>
            </section>

            {/* Section 2 — About */}
            <section>
              <div className="text-[clamp(0.65rem,0.75vw,0.85rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">
                ── ABOUT ──
              </div>
              <div
                className="border border-cyan-500/25 bg-[rgba(0,15,30,0.45)] p-6 text-[clamp(0.58rem,0.65vw,0.78rem)] tracking-[0.08em] space-y-3 text-cyan-500/70"
                style={{ boxShadow: '0 0 20px rgba(0,229,255,0.05)' }}
              >
                <div className="text-cyan-300/90 font-bold tracking-[0.15em] text-[clamp(0.75rem,0.9vw,1rem)]">
                  AEONGUARD DECISION CONTROL CENTRE
                </div>
                <div className="text-cyan-500/60">Decision Control Centre</div>
                <div className="h-[1px] w-full bg-cyan-500/15 my-2" />
                <div>VERSION: v1.0.0</div>
                <div>BUILD: 2026.04.15</div>
                <div>FRAMEWORK: React 18 + TypeScript + Vite</div>
                <div>3D ENGINE: Three.js r128</div>
                <div>THEME: The Wandering Earth · 流浪地球</div>
                <div className="h-[1px] w-full bg-cyan-500/15 my-2" />
                <div>
                  DEVELOPED FOR:
                  <br />
                  GENS4015 · Science Fiction and the Human Condition
                  <br />
                  UNSW Sydney · 2026
                </div>
                <div className="h-[1px] w-full bg-cyan-500/15 my-2" />
                <div>
                  BASED ON:
                  <br />
                  The Wandering Earth (流浪地球) by Liu Cixin (刘慈欣)
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
