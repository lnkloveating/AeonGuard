import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAeonStore } from '../store/aeonStore';
import { useOverrideBadge } from '../hooks/useOverrideBadge';
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
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';

type PodStatus = 'NOMINAL' | 'WARNING' | 'DORMANT' | 'CRITICAL' | 'WAKING' | 'AWAKE';

interface Pod {
  id: string;
  name: string;
  role: string;
  status: PodStatus;
  heartRate: number;
  temperature: number;
  metabolism: number;
  pod: number;
}

const firstNames = ['CHEN', 'ZHANG', 'WANG', 'LI', 'YANOV', 'SMITH', 'GARCIA', 'KIM', 'PATEL', 'MÜLLER', 'TANAKA', 'IVANOV', 'BROWN', 'DAVIS', 'WILSON'];
const lastNames = ['WEI', 'FANG', 'LEI', 'JUN', 'K', 'J', 'M', 'S', 'R', 'H', 'Y', 'A', 'T', 'C', 'P'];
const roles = [
  'Structural Engineer',
  'Nuclear Engineer',
  'Medical Officer',
  'Life Support',
  'Navigation',
  'Systems Engineer',
  'Geologist',
  'Meteorologist',
  'Biologist',
  'Physicist',
];

function randomName(i: number) {
  return `${firstNames[i % firstNames.length]}_${lastNames[(i * 7 + 3) % lastNames.length]}`;
}
function randomRole(i: number) {
  return roles[(i * 3 + 1) % roles.length];
}

const crewData = [
  { name: 'Structural Eng.', value: 18, color: '#00e5ff' },
  { name: 'Nuclear Eng.', value: 15, color: '#ffaa00' },
  { name: 'Medical', value: 12, color: '#00ff88' },
  { name: 'Life Support', value: 14, color: '#ff6644' },
  { name: 'Navigation', value: 10, color: '#aa88ff' },
  { name: 'Systems Eng.', value: 16, color: '#ff88aa' },
  { name: 'Other', value: 42, color: '#445566' },
];
const crewTotal = crewData.reduce((a, b) => a + b.value, 0);

const scheduleData = [
  { name: 'CHEN_WEI', role: 'Structural Engineer', wakeDay: 43 },
  { name: 'KIM_S', role: 'Navigation', wakeDay: 43 },
  { name: 'SMITH_J', role: 'Medical Officer', wakeDay: 67 },
  { name: 'YANOV_K', role: 'Nuclear Engineer', wakeDay: 67 },
  { name: 'ZHANG_LI', role: 'Life Support', wakeDay: 89 },
  { name: 'GARCIA_M', role: 'Systems Engineer', wakeDay: 89 },
  { name: 'PATEL_R', role: 'Biologist', wakeDay: 75 },
  { name: 'MÜLLER_H', role: 'Geologist', wakeDay: 55 },
];

const statusStyles: Record<PodStatus, { bg: string; border: string; dot: string }> = {
  NOMINAL: { bg: 'rgba(0,229,255,0.05)', border: 'rgba(0,229,255,0.2)', dot: 'bg-cyan-400' },
  WARNING: { bg: 'rgba(255,170,0,0.08)', border: 'rgba(255,170,0,0.4)', dot: 'bg-amber-400' },
  DORMANT: { bg: 'rgba(0,50,100,0.1)', border: 'rgba(0,100,200,0.2)', dot: 'bg-blue-400/50' },
  CRITICAL: { bg: 'rgba(255,0,0,0.1)', border: 'rgba(255,50,50,0.6)', dot: 'bg-red-500' },
  WAKING: { bg: 'rgba(255,140,0,0.1)', border: 'rgba(255,140,0,0.6)', dot: 'bg-orange-400' },
  AWAKE: { bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.6)', dot: 'bg-green-400' },
};

export default function PodsPage() {
  const { podOverrides: storePodOverrides } = useAeonStore();
  const overrideBadge = useOverrideBadge();
  const navigate = useNavigate();
  const [podOverrides, setPodOverrides] = useState<Record<string, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedPod, setSelectedPod] = useState<Pod | null>(null);
  const [filter, setFilter] = useState<PodStatus | 'ALL'>('ALL');
  const [scanPod, setScanPod] = useState(1);
  const [scanProgress, setScanProgress] = useState(0);
  const [lifeSignsPage, setLifeSignsPage] = useState(0);
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [titleDone, setTitleDone] = useState(false);
  const fullTitle = 'POD MONITORING SYSTEM';
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);

  const pods = useMemo<Pod[]>(() => {
    return Array.from({ length: 127 }, (_, i) => {
      const idNum = i + 1;
      let status: PodStatus = 'NOMINAL';
      if (idNum >= 119 && idNum <= 123) status = 'WARNING';
      if (idNum >= 124 && idNum <= 125) status = 'DORMANT';
      if (idNum >= 126) status = 'CRITICAL';
      const id = `POD-${String(idNum).padStart(3, '0')}`;
      return {
        id,
        name: randomName(i),
        role: randomRole(i),
        status,
        heartRate: 45 + ((i * 17 + 5) % 21),
        temperature: +(35.5 + ((i * 13 + 7) % 16) / 10).toFixed(1),
        metabolism: 15 + ((i * 11 + 3) % 11),
        pod: idNum,
      };
    });
  }, []);

  const reloadPodOverridesFromStorage = useCallback(() => {
    const overrides: Record<string, string> = {};
    for (let i = 1; i <= 127; i++) {
      const podId = `POD-${String(i).padStart(3, '0')}`;
      const override = localStorage.getItem(`podOverride_${podId}`);
      if (override) overrides[podId] = override;
    }
    setPodOverrides(overrides);
  }, []);

  useEffect(() => {
    reloadPodOverridesFromStorage();
  }, [reloadPodOverridesFromStorage]);

  useEffect(() => {
    const sync = () => reloadPodOverridesFromStorage();
    window.addEventListener('focus', sync);
    window.addEventListener('storage', sync);
    window.addEventListener('aeonguard:podOverride', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('aeonguard:podOverride', sync);
    };
  }, [reloadPodOverridesFromStorage]);

  const getEffectiveStatus = useCallback(
    (pod: Pod): PodStatus => {
      const o = podOverrides[pod.id] || storePodOverrides[pod.id];
      return (o as PodStatus) || pod.status;
    },
    [podOverrides, storePodOverrides]
  );

  const handleStatusChange = useCallback((podId: string, newStatus: PodStatus) => {
    if (newStatus === 'DORMANT') {
      localStorage.removeItem(`podOverride_${podId}`);
      setPodOverrides(prev => {
        const updated = { ...prev };
        delete updated[podId];
        return updated;
      });
    } else {
      localStorage.setItem(`podOverride_${podId}`, newStatus);
      setPodOverrides(prev => ({ ...prev, [podId]: newStatus }));
      window.dispatchEvent(new Event('aeonguard:podOverride'));
    }
  }, []);

  const counts = useMemo(
    () => ({
      ALL: pods.length,
      NOMINAL: pods.filter(p => getEffectiveStatus(p) === 'NOMINAL').length,
      WARNING: pods.filter(p => getEffectiveStatus(p) === 'WARNING').length,
      DORMANT: pods.filter(p => getEffectiveStatus(p) === 'DORMANT').length,
      CRITICAL: pods.filter(p => getEffectiveStatus(p) === 'CRITICAL').length,
      WAKING: pods.filter(p => getEffectiveStatus(p) === 'WAKING').length,
      AWAKE: pods.filter(p => getEffectiveStatus(p) === 'AWAKE').length,
    }),
    [pods, getEffectiveStatus]
  );

  const filteredPods =
    filter === 'ALL' ? pods : pods.filter(p => getEffectiveStatus(p) === filter);

  const wakingPods = useMemo(
    () => Object.entries(podOverrides).filter(([, status]) => status === 'WAKING'),
    [podOverrides]
  );

  const alertPods = useMemo(
    () => pods.filter(p => {
      const s = getEffectiveStatus(p);
      return s === 'WARNING' || s === 'CRITICAL';
    }),
    [pods, getEffectiveStatus]
  );

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

  useEffect(() => {
    const iv = setInterval(() => {
      setScanPod(prev => (prev >= 127 ? 1 : prev + 1));
      setScanProgress(prev => (prev >= 100 ? 0 : prev + 100 / 127));
    }, 63);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setScanProgress(0), 8000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let helixOffset = 0;
    let scanY = 0;
    let ecgOffset = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    interface CellParticle {
      x: number; y: number; r: number; vx: number; vy: number;
      hasNucleus: boolean; phase: number; pulseSpeed: number;
    }
    const cells: CellParticle[] = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 3 + Math.random() * 9,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -(0.1 + Math.random() * 0.25),
      hasNucleus: Math.random() > 0.4,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.8 + Math.random() * 1.5,
    }));

    const ecgPattern = (x: number): number => {
      const cycle = 180;
      const pos = ((x % cycle) + cycle) % cycle;
      if (pos > 60 && pos < 65) return -3;
      if (pos > 65 && pos < 68) return 12;
      if (pos > 68 && pos < 72) return -8;
      if (pos > 72 && pos < 76) return 4;
      if (pos > 76 && pos < 80) return -1;
      return 0;
    };

    const draw = (time: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const helixPositions = [w * 0.15, w * 0.5, w * 0.85];
      const amp = 15;
      const wavelength = 200;
      helixOffset = (helixOffset + 0.3) % wavelength;
      for (const hx of helixPositions) {
        ctx.beginPath();
        for (let y = -20; y < h + 20; y += 2) {
          const phase = ((y + helixOffset) / wavelength) * Math.PI * 2;
          const x = hx + Math.sin(phase) * amp;
          y === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(0,229,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        for (let y = -20; y < h + 20; y += 2) {
          const phase = ((y + helixOffset) / wavelength) * Math.PI * 2 + Math.PI;
          const x = hx + Math.sin(phase) * amp;
          y === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(0,229,255,0.06)';
        ctx.stroke();

        ctx.strokeStyle = 'rgba(0,229,255,0.04)';
        ctx.lineWidth = 0.5;
        for (let y = 0; y < h; y += 20) {
          const phase = ((y + helixOffset) / wavelength) * Math.PI * 2;
          const x1 = hx + Math.sin(phase) * amp;
          const x2 = hx + Math.sin(phase + Math.PI) * amp;
          ctx.beginPath();
          ctx.moveTo(x1, y);
          ctx.lineTo(x2, y);
          ctx.stroke();
        }
      }

      for (const c of cells) {
        c.x += c.vx;
        c.y += c.vy;
        if (c.y < -c.r * 2) { c.y = h + c.r * 2; c.x = Math.random() * w; }
        if (c.x < -c.r * 2) c.x = w + c.r * 2;
        if (c.x > w + c.r * 2) c.x = -c.r * 2;

        const pulse = 1 + 0.2 * Math.sin(time * 0.001 * c.pulseSpeed + c.phase);
        const dr = c.r * pulse;

        ctx.beginPath();
        ctx.arc(c.x, c.y, dr, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,229,255,0.08)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        if (c.hasNucleus) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, dr / 3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(0,229,255,0.05)';
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }

      const ecgY = h * 0.75;
      ecgOffset = (ecgOffset + 0.8) % 360;
      ctx.beginPath();
      for (let x = 0; x < w; x += 1) {
        const val = ecgPattern(x + ecgOffset);
        x === 0 ? ctx.moveTo(x, ecgY - val) : ctx.lineTo(x, ecgY - val);
      }
      ctx.strokeStyle = 'rgba(0,229,255,0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();

      scanY = (scanY + h / (15 * 60)) % h;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.strokeStyle = 'rgba(0,229,255,0.03)';
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const [fleetHR, setFleetHR] = useState<Array<{ t: number; bpm: number }>>(() =>
    Array.from({ length: 60 }, (_, i) => ({ t: i, bpm: 52 + ((i * 7 + 3) % 6 - 3) }))
  );
  const fleetHRTickRef = useRef(60);
  useEffect(() => {
    const iv = setInterval(() => {
      const tick = fleetHRTickRef.current++;
      setFleetHR(prev => [...prev.slice(-59), { t: tick, bpm: 52 + (Math.random() * 6 - 3) }]);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const vitalsHistory = useMemo(() => {
    if (!selectedPod) return [];
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      hr: selectedPod.heartRate + Math.sin(i * 0.5) * 4 + ((i * 7 + 3) % 5 - 2),
      temp: selectedPod.temperature + Math.sin(i * 0.3) * 0.3 + ((i * 3 + 1) % 3 - 1) * 0.1,
      meta: selectedPod.metabolism + Math.sin(i * 0.4 + 1) * 3 + ((i * 5 + 2) % 4 - 2),
    }));
  }, [selectedPod]);

  const fleetVitalsHistory = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        day: `D-${30 - i}`,
        heartRate: +(50 + Math.sin(i * 0.3) * 4 + Math.random() * 2).toFixed(2),
        temperature: +(36 + Math.sin(i * 0.2) * 0.3 + Math.random() * 0.1).toFixed(2),
        metabolism: +(18 + Math.sin(i * 0.4) * 2 + Math.random() * 1).toFixed(2),
      })),
    []
  );

  const handleLogout = () => {
    localStorage.removeItem('aeonguard_auth');
    navigate('/');
  };

  const PODS_PER_PAGE = 10;
  const totalPages = Math.ceil(pods.length / PODS_PER_PAGE);
  const currentPagePods = pods.slice(lifeSignsPage * PODS_PER_PAGE, (lifeSignsPage + 1) * PODS_PER_PAGE);

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

      <canvas ref={bgCanvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      <nav className="fixed top-0 z-50 flex h-12 w-full items-center justify-between border-b border-cyan-500/30 bg-[#000d1a]/80 px-4 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
        <div className="flex items-center gap-2 font-bold tracking-[0.2em]">
          <Terminal size={18} className="text-cyan-400" />
          <span>AEONGUARD</span>
        </div>
        <div className="flex-1 overflow-hidden mx-8 border-x border-cyan-500/10">
          <div className="animate-[ticker_60s_linear_infinite] whitespace-nowrap text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest text-cyan-500/80">
            {[0, 1].map(dup => (
              <React.Fragment key={dup}>
                <span className="mx-4">🟢 HIBERNATION PODS: 127/127 ACTIVE</span>
                <span className="mx-4">🟢 VITALS: ALL NOMINAL</span>
                <span className="mx-4">🟢 CABIN TEMP: 36.1°C AVG</span>
                <span className="mx-4">🟢 HEART RATE MONITOR: 52 BPM AVG</span>
                <span className="mx-4">🟢 METABOLISM: 18% AVG</span>
                <span className="mx-4">🟢 NEXT ROTATION: 43 DAYS</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest">
          <div className="flex items-center gap-2 mr-2">
            <button onClick={() => window.location.reload()} className="p-1.5 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors text-cyan-400/60 hover:text-cyan-400">
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-50">ADMIN_01 · ADMINISTRATOR</span>
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 border border-cyan-500/30 px-2 py-1 hover:bg-cyan-500/10 transition-colors">
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
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="absolute top-0 right-0 p-1 text-cyan-400 hover:bg-[rgba(0,229,255,0.1)] transition-colors z-10"
            >
              {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
          <div className={`flex flex-col gap-4 ${sidebarOpen ? '' : 'mt-6'}`}>
            <div>
              {sidebarOpen && <div className="mb-2 text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold tracking-widest opacity-30">CORE</div>}
              <ul className="space-y-1">
                <SidebarItem to="/dashboard" icon={<Home size={14} />} label="HOME" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/pods" icon={<Database size={14} />} label="POD MONITORING" active collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/habitat" icon={<AlertTriangle size={14} />} label="HABITAT ALERT" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/ai" icon={<Cpu size={14} />} label="AI ENGINE" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/override" icon={<Zap size={14} />} label="HUMAN OVERRIDE" badge={overrideBadge} collapsed={!sidebarOpen} />
              </ul>
            </div>
            <div className="h-[1px] w-full bg-cyan-500/10" />
            <div>
              {sidebarOpen && <div className="mb-2 text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold tracking-widest opacity-30">ARCHIVE</div>}
              <ul className="space-y-1">
                <SidebarItem to="/dashboard/mission" icon={<FileText size={14} />} label="MISSION LOG" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/crew" icon={<Users size={14} />} label="CREW ROSTER" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/syslog" icon={<ClipboardList size={14} />} label="SYSTEM LOG" collapsed={!sidebarOpen} />
              </ul>
            </div>
            <div className="h-[1px] w-full bg-cyan-500/10" />
            <SidebarItem to="/dashboard/settings" icon={<Settings size={14} />} label="SETTINGS" collapsed={!sidebarOpen} />
          </div>
        </aside>

        <main className={`flex-1 overflow-y-auto overflow-x-hidden bg-[#000d1a] transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-[14vw]' : 'ml-[48px]'}`}>
          {wakingPods.length > 0 && (
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 10,
                background: 'rgba(255,140,0,0.1)',
                border: '1px solid rgba(255,140,0,0.4)',
                padding: '8px 16px',
                fontFamily: 'monospace',
                fontSize: '11px',
                color: '#ffaa00',
                letterSpacing: '0.2em',
              }}
            >
              ⚡ {wakingPods.length} POD ACTIVATION IN PROGRESS
            </div>
          )}
          <div className="border-b border-cyan-500/20 bg-[#000814]/90 p-6 pb-3">
            <h1 className="text-[clamp(1.2rem,1.8vw,1.8rem)] font-bold tracking-[0.3em] text-cyan-400 mb-2">
              {displayedTitle}
              {!titleDone && <span style={{ animation: 'blink 0.8s infinite' }}>|</span>}
            </h1>
            <div className="text-[clamp(0.6rem,0.7vw,0.8rem)] tracking-[0.2em] text-cyan-500/50 mb-3">
              127 PODS ACTIVE · 0 ALERTS · LAST SCAN: 2MIN AGO
            </div>
            <div className="space-y-1">
              <div className="text-[clamp(0.5rem,0.55vw,0.6rem)] tracking-widest text-cyan-500/40">
                SCANNING PODS... POD-{String(scanPod).padStart(3, '0')}/127
              </div>
              <div className="relative h-[3px] w-full bg-white/5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00e5ff] to-[#0088aa] transition-[width] duration-[60ms] ease-linear"
                  style={{ width: `${scanProgress}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00e5ff] shadow-[0_0_6px_#00e5ff] animate-pulse"
                  style={{ left: `${scanProgress}%`, marginLeft: -3 }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 1 — MAIN MONITORING */}
          <div className="flex gap-0 min-h-[calc(100vh-48px-80px)] bg-[#000d1a]">
            <div className="w-[65%] p-6 border-r border-cyan-500/10 bg-[#000d1a]">
              <div className="flex flex-wrap gap-2 mb-4">
                {(['ALL', 'NOMINAL', 'WARNING', 'CRITICAL'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-[clamp(0.55rem,0.65vw,0.7rem)] font-bold tracking-widest border transition-colors ${
                      filter === f
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-transparent border-cyan-500/15 text-cyan-500/40 hover:border-cyan-500/30 hover:text-cyan-500/60'
                    }`}
                  >
                    {f} {counts[f]}
                  </button>
                ))}
                {counts.WAKING > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilter('WAKING')}
                    className={`px-3 py-1.5 text-[clamp(0.55rem,0.65vw,0.7rem)] font-bold tracking-widest border transition-colors ${
                      filter === 'WAKING'
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                        : 'bg-transparent border-orange-500/20 text-orange-500/50 hover:border-orange-500/40 hover:text-orange-400/80'
                    }`}
                  >
                    WAKING {counts.WAKING}
                  </button>
                )}
                {counts.AWAKE > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilter('AWAKE')}
                    className={`px-3 py-1.5 text-[clamp(0.55rem,0.65vw,0.7rem)] font-bold tracking-widest border transition-colors ${
                      filter === 'AWAKE'
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : 'bg-transparent border-green-500/20 text-green-500/50 hover:border-green-500/40 hover:text-green-400/80'
                    }`}
                  >
                    AWAKE {counts.AWAKE}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(70px,1fr))] gap-2">
                {filteredPods.map(pod => {
                  const st = getEffectiveStatus(pod);
                  const s = statusStyles[st];
                  const isSelected = selectedPod?.id === pod.id;
                  return (
                    <button
                      key={pod.id}
                      onClick={() => setSelectedPod(pod)}
                      className={`relative p-1.5 text-left transition-all cursor-pointer ${st === 'CRITICAL' || st === 'WAKING' ? 'animate-pulse' : ''}`}
                      style={{
                        backgroundColor: isSelected ? 'rgba(0,229,255,0.12)' : s.bg,
                        border: `1px solid ${isSelected ? 'rgba(0,229,255,0.6)' : s.border}`,
                        boxShadow:
                          st === 'CRITICAL'
                            ? '0 0 8px rgba(255,50,50,0.3)'
                            : st === 'WAKING'
                              ? '0 0 12px rgba(255,140,0,0.55)'
                              : st === 'AWAKE'
                                ? '0 0 10px rgba(0,255,136,0.35)'
                                : isSelected
                                  ? '0 0 8px rgba(0,229,255,0.2)'
                                  : 'none',
                      }}
                    >
                      <div className="text-[clamp(0.45rem,0.55vw,0.6rem)] font-bold tracking-wider text-cyan-400/80 mb-1">{pod.id}</div>
                      <div className="flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                        {st === 'WAKING' && (
                          <Loader2 className="shrink-0 text-orange-400 animate-spin" size={10} strokeWidth={2.5} aria-hidden />
                        )}
                        <span
                          className={`text-[clamp(0.375rem,0.45vw,0.5rem)] opacity-40 truncate ${
                            st === 'WAKING' ? 'text-orange-400 opacity-100 font-bold' : st === 'AWAKE' ? 'text-green-400 opacity-100 font-bold' : ''
                          }`}
                        >
                          {st === 'WAKING' ? 'WAKING' : st === 'AWAKE' ? 'AWAKE' : st}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Hibernation Pod Visual Display */}
              <div style={{ marginTop: '24px', borderTop: '1px solid rgba(0,229,255,0.1)', paddingTop: '16px' }}>
                <div style={{
                  fontSize: 'clamp(0.7rem, 0.85vw, 0.9rem)',
                  fontFamily: 'monospace',
                  color: 'rgba(0,229,255,0.4)',
                  letterSpacing: '0.3em',
                  marginBottom: '16px',
                }}>── HIBERNATION POD STATUS DISPLAY ──</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[pods[0], pods[118], pods[125]].map(pod => (
                    <HibernationPodVisual key={pod.id} pod={pod} effectiveStatus={getEffectiveStatus(pod)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="w-[35%] p-6 bg-[#000814]/50 h-full overflow-y-auto">
              {selectedPod ? (
                <PodDetail
                  pod={{ ...selectedPod, status: getEffectiveStatus(selectedPod) }}
                  vitalsHistory={vitalsHistory}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <RightPanel
                  counts={counts}
                  pods={pods}
                  fleetHR={fleetHR}
                  alertPods={alertPods}
                  onSelectPod={setSelectedPod}
                  getStatus={getEffectiveStatus}
                />
              )}
            </div>
          </div>

          {/* SECTION 2 — POD DISTRIBUTION MAP */}
          <div className="border-t border-cyan-500/10 p-[3vw] bg-[#000d1a]">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold tracking-[0.3em] text-cyan-400">── POD DISTRIBUTION MAP ──</div>
              <div className="flex items-center gap-4 text-[clamp(0.5rem,0.6vw,0.65rem)] tracking-widest">
                {[
                  { label: 'NOMINAL', color: '#00e5ff', op: 0.8 },
                  { label: 'WARNING', color: '#ffaa00', op: 0.8 },
                  { label: 'DORMANT', color: '#1a3a5c', op: 0.5 },
                  { label: 'CRITICAL', color: '#ff3333', op: 0.8 },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2" style={{ backgroundColor: s.color, opacity: s.op }} />
                    <span className="text-cyan-500/50">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ margin: '16px 0', padding: '12px', border: '1px solid rgba(0,229,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: 'clamp(0.55rem,0.65vw,0.7rem)', fontFamily: 'monospace', color: 'rgba(0,229,255,0.35)', letterSpacing: '0.2em', marginBottom: '10px' }}>
                ── UNDERGROUND CITY CROSS-SECTION · 地下城截面图 ──
              </div>
              <svg width="100%" height="160" viewBox="0 0 900 160" preserveAspectRatio="none">
                <line x1="0" y1="8" x2="900" y2="8" stroke="rgba(0,229,255,0.2)" strokeWidth="1" strokeDasharray="4 4" />
                <text x="10" y="6" fill="rgba(0,229,255,0.4)" fontSize="9" fontFamily="monospace">地表 SURFACE · -272°C</text>
                <text x="780" y="6" fill="rgba(200,220,255,0.4)" fontSize="9" fontFamily="monospace">❄ FROZEN</text>

                <rect x="80" y="12" width="740" height="18" fill="rgba(255,170,0,0.15)" stroke="rgba(255,170,0,0.3)" strokeWidth="0.5" />
                <text x="10" y="25" fill="rgba(255,170,0,0.6)" fontSize="8" fontFamily="monospace">ENGINE</text>
                <text x="88" y="25" fill="rgba(255,170,0,0.5)" fontSize="8" fontFamily="monospace">▶▶▶ EARTH ENGINES ACTIVE · OUTPUT 98.4% ▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶▶</text>
                <text x="840" y="25" fill="rgba(255,170,0,0.4)" fontSize="8" fontFamily="monospace">🔥</text>

                <rect x="80" y="34" width="740" height="26" fill="rgba(0,229,255,0.06)" stroke="rgba(0,229,255,0.15)" strokeWidth="0.5" />
                <text x="10" y="51" fill="rgba(0,229,255,0.5)" fontSize="8" fontFamily="monospace">B1</text>
                <text x="88" y="44" fill="rgba(0,229,255,0.3)" fontSize="7" fontFamily="monospace">████████████████████████████████  32 PODS · 18°C · ALL NOMINAL</text>

                <rect x="80" y="64" width="740" height="26" fill="rgba(0,229,255,0.05)" stroke="rgba(0,229,255,0.12)" strokeWidth="0.5" />
                <text x="10" y="81" fill="rgba(0,229,255,0.5)" fontSize="8" fontFamily="monospace">B2</text>
                <text x="88" y="74" fill="rgba(0,229,255,0.3)" fontSize="7" fontFamily="monospace">███████████████████████████████  31 PODS · 18°C · ALL NOMINAL</text>

                <rect x="80" y="94" width="740" height="26" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.1)" strokeWidth="0.5" />
                <text x="10" y="111" fill="rgba(0,229,255,0.5)" fontSize="8" fontFamily="monospace">B3</text>
                <text x="88" y="104" fill="rgba(0,229,255,0.3)" fontSize="7" fontFamily="monospace">████████████████████████████████  32 PODS · 19°C · ALL NOMINAL</text>

                <rect x="80" y="124" width="740" height="26" fill="rgba(255,100,0,0.05)" stroke="rgba(255,170,0,0.2)" strokeWidth="0.5" />
                <text x="10" y="141" fill="rgba(255,170,0,0.6)" fontSize="8" fontFamily="monospace">B4</text>
                <text x="88" y="134" fill="rgba(0,229,255,0.3)" fontSize="7" fontFamily="monospace">███████████████████████</text>
                <text x="268" y="134" fill="rgba(255,170,0,0.6)" fontSize="7" fontFamily="monospace">█████</text>
                <text x="308" y="134" fill="rgba(100,150,255,0.4)" fontSize="7" fontFamily="monospace">██</text>
                <text x="328" y="134" fill="rgba(255,50,50,0.7)" fontSize="7" fontFamily="monospace">██</text>
                <text x="360" y="134" fill="rgba(255,170,0,0.5)" fontSize="7" fontFamily="monospace">32 PODS · 20°C · ⚠ 5 WARNING · 2 CRITICAL</text>

                <line x1="0" y1="154" x2="900" y2="154" stroke="rgba(255,100,0,0.3)" strokeWidth="1" />
                <text x="10" y="152" fill="rgba(255,100,0,0.5)" fontSize="8" fontFamily="monospace">地核 CORE · 5500°C</text>
                <text x="820" y="152" fill="rgba(255,100,0,0.4)" fontSize="8" fontFamily="monospace">REACTOR STABLE</text>
              </svg>
            </div>

            <div className="space-y-3">
              {[
                { id: 'B1', label: '地下城 B1层 LEVEL B1', count: 32, pods: createFloorPods(1, 32, 'NOMINAL') },
                { id: 'B2', label: '地下城 B2层 LEVEL B2', count: 31, pods: createFloorPods(33, 63, 'NOMINAL') },
                { id: 'B3', label: '地下城 B3层 LEVEL B3', count: 32, pods: createFloorPods(64, 95, 'NOMINAL') },
                { id: 'B4', label: '地下城 B4层 LEVEL B4', count: 32, pods: createFloorPods(96, 127, 'NOMINAL', { WARNING: 5, DORMANT: 2, CRITICAL: 2 }) },
              ].map(floor => {
                const stats = {
                  NOMINAL: floor.pods.filter(p => p === 'NOMINAL').length,
                  WARNING: floor.pods.filter(p => p === 'WARNING').length,
                  DORMANT: floor.pods.filter(p => p === 'DORMANT').length,
                  CRITICAL: floor.pods.filter(p => p === 'CRITICAL').length,
                };
                return (
                  <div key={floor.id} className="flex items-center gap-4 p-3 border border-cyan-500/10 bg-[#00101f]">
                    <div className="w-[200px] shrink-0 text-left text-[clamp(0.6rem,0.7vw,0.75rem)] tracking-[0.15em] text-cyan-400">{floor.label}</div>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {floor.pods.map((status, idx) => {
                        const color = status === 'NOMINAL' ? '#00e5ff' : status === 'WARNING' ? '#ffaa00' : status === 'CRITICAL' ? '#ff3333' : '#1a3a5c';
                        return <div key={idx} className="w-[10px] h-[10px]" style={{ backgroundColor: color, opacity: status === 'DORMANT' ? 0.5 : 0.8 }} />;
                      })}
                    </div>
                    <div className="w-[1px] h-6 bg-cyan-500/15 shrink-0" />
                    <div className="shrink-0 flex items-center gap-3 text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-widest">
                      {[
                        { k: 'NOM', v: stats.NOMINAL, color: 'text-cyan-400' },
                        { k: 'WAR', v: stats.WARNING, color: 'text-amber-400' },
                        { k: 'DOR', v: stats.DORMANT, color: 'text-blue-400/70' },
                        { k: 'CRI', v: stats.CRITICAL, color: 'text-red-400' },
                      ].map((s, i) => (
                        <span key={s.k} className="flex items-center gap-1">
                          <span className="opacity-40">{s.k}:</span>
                          <span className={`font-bold ${s.color}`}>{s.v}</span>
                          {i < 3 && <span className="opacity-15 ml-2">|</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3 — FLEET LIFE SIGNS MONITOR */}
          <div className="border-t border-cyan-500/10 p-[3vw] bg-[#000d1a]">
            <div className="text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold tracking-[0.3em] text-cyan-400 mb-4">── FLEET LIFE SIGNS MONITOR · 舰队生命体征实时监控 ──</div>
            <div className="bg-[rgba(0,0,0,0.2)] border border-cyan-500/[0.08] p-[2vw]">
              <div className="text-[clamp(0.5rem,0.6vw,0.65rem)] tracking-widest text-cyan-500/30 mb-3">
                Showing pods {lifeSignsPage * PODS_PER_PAGE + 1} - {Math.min((lifeSignsPage + 1) * PODS_PER_PAGE, pods.length)} of {pods.length}
              </div>
              <div key={lifeSignsPage}>
                {currentPagePods.map(pod => {
                  const st = getEffectiveStatus(pod);
                  const rowStyle =
                    st === 'WARNING'
                      ? 'border-l-2 border-amber-500/60 bg-[rgba(255,170,0,0.02)]'
                      : st === 'CRITICAL'
                      ? 'border-l-2 border-red-500/60 bg-[rgba(255,0,0,0.03)] animate-pulse'
                      : st === 'WAKING'
                      ? 'border-l-2 border-orange-500/70 bg-[rgba(255,140,0,0.04)] animate-pulse'
                      : st === 'AWAKE'
                      ? 'border-l-2 border-green-500/60 bg-[rgba(0,255,136,0.04)]'
                      : 'border-l-2 border-cyan-500/20';
                  return (
                    <div key={pod.id} className={`flex items-center gap-4 border-b border-cyan-500/5 py-2 px-3 ${rowStyle}`}>
                      <div className="w-[200px] shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-wider text-cyan-400">{pod.id}</span>
                          <span className="text-[clamp(0.55rem,0.65vw,0.7rem)] opacity-50">{pod.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[clamp(0.45rem,0.5vw,0.55rem)] tracking-widest text-cyan-500/30">{pod.role}</span>
                          <span
                            className={`text-[clamp(0.4rem,0.45vw,0.5rem)] font-bold tracking-widest px-1.5 py-0.5 border ${
                              st === 'NOMINAL'
                                ? 'text-cyan-400/70 border-cyan-500/20 bg-cyan-500/5'
                                : st === 'WARNING'
                                ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                : st === 'CRITICAL'
                                ? 'text-red-400 border-red-500/30 bg-red-500/10'
                                : st === 'WAKING'
                                ? 'text-orange-400 border-orange-500/40 bg-orange-500/10'
                                : st === 'AWAKE'
                                ? 'text-green-400 border-green-500/40 bg-green-500/10'
                                : 'text-blue-400/50 border-blue-500/20 bg-blue-500/5'
                            }`}
                          >
                            {st === 'WAKING' ? (
                              <span className="inline-flex items-center gap-1">
                                <Loader2 className="animate-spin" size={10} />
                                WAKING
                              </span>
                            ) : (
                              st
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 border border-cyan-500/5 bg-black/30 px-1">
                        <EcgCanvas status={st} />
                      </div>
                      <div className="w-[120px] shrink-0 text-right">
                        <div
                          className={`text-[clamp(0.7rem,0.85vw,0.9rem)] font-bold tracking-wider ${
                            st === 'CRITICAL'
                              ? 'text-red-400'
                              : st === 'WARNING'
                                ? 'text-amber-400'
                                : st === 'WAKING'
                                  ? 'text-orange-400'
                                  : st === 'AWAKE'
                                    ? 'text-green-400'
                                    : 'text-cyan-400'
                          }`}
                        >
                          {pod.heartRate} <span className="text-[clamp(0.45rem,0.5vw,0.55rem)] opacity-50">BPM</span>
                        </div>
                        <div className="text-[clamp(0.55rem,0.6vw,0.65rem)] text-amber-400/60 tracking-widest">{pod.temperature}°C</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-center gap-3 mt-4 text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-widest">
                <button
                  onClick={() => setLifeSignsPage(p => p - 1)}
                  disabled={lifeSignsPage === 0}
                  className={`border border-cyan-500/30 px-3 py-1 transition-colors ${
                    lifeSignsPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-cyan-500/10 cursor-pointer text-cyan-400'
                  }`}
                >
                  ← PREV
                </button>
                <div className="flex items-center gap-1">
                  {buildPageNumbers(lifeSignsPage, totalPages).map(n => (
                    <button
                      key={n}
                      onClick={() => setLifeSignsPage(n)}
                      className={`w-7 h-7 flex items-center justify-center border transition-colors cursor-pointer ${
                        n === lifeSignsPage
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 font-bold'
                          : 'border-cyan-500/15 text-cyan-500/40 hover:border-cyan-500/30 hover:text-cyan-500/60'
                      }`}
                    >
                      {n + 1}
                    </button>
                  ))}
                </div>
                <span className="text-cyan-500/40 mx-2">
                  PAGE <span className="text-cyan-400 font-bold">{lifeSignsPage + 1}</span> / {totalPages}
                </span>
                <button
                  onClick={() => setLifeSignsPage(p => p + 1)}
                  disabled={lifeSignsPage >= totalPages - 1}
                  className={`border border-cyan-500/30 px-3 py-1 transition-colors ${
                    lifeSignsPage >= totalPages - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-cyan-500/10 cursor-pointer text-cyan-400'
                  }`}
                >
                  NEXT →
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 4 — HIBERNATION STATISTICS BAR */}
          <div className="border-t border-cyan-500/10 bg-[#000d1a]">
            <div className="px-[3vw] py-4 border-y border-cyan-500/10 bg-[rgba(0,0,0,0.25)] text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-widest flex flex-wrap items-center gap-3">
              <span className="opacity-50">AVG DURATION:</span>
              <span className="text-cyan-400 font-bold">2.3 YEARS</span>
              <span className="opacity-20">|</span>
              <span className="opacity-50">LONGEST:</span>
              <span className="text-cyan-400 font-bold">3.3 YEARS (POD-003)</span>
              <span className="opacity-20">|</span>
              <span className="opacity-50">SHORTEST:</span>
              <span className="text-cyan-400 font-bold">12 DAYS (POD-127)</span>
              <span className="opacity-20">|</span>
              <span className="opacity-50">TOTAL LIFE-YEARS SAVED:</span>
              <span className="text-cyan-400 font-bold">342,891 YRS</span>
            </div>
          </div>

          {/* SECTION 5 — DATA ANALYTICS */}
          <div className="border-t border-cyan-500/10 p-[3vw] bg-[#000d1a]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="border border-cyan-500/10 p-8" style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,20,40,0.4))', boxShadow: 'inset 0 0 30px rgba(0,229,255,0.03)' }}>
                <div className="text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold tracking-[0.3em] text-cyan-400 mb-4">── CREW COMPOSITION ──</div>
                <div className="flex gap-6 items-center">
                  <div style={{ width: '50%', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SvgPieChart data={crewData} />
                  </div>
                  <div className="w-[50%] flex flex-col justify-center space-y-2.5">
                    {crewData.map(item => (
                      <div key={item.name} className="flex items-center gap-3 text-[clamp(0.6rem,0.7vw,0.75rem)] tracking-widest">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="opacity-70 w-[100px]">{item.name}</span>
                        <span className="text-cyan-400 font-bold w-8 text-right">{item.value}</span>
                        <span className="opacity-40">{((item.value / crewTotal) * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border border-cyan-500/10 bg-[rgba(0,0,0,0.2)] p-6">
                <div className="text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold tracking-[0.3em] text-cyan-400 mb-4">── 30-DAY FLEET VITALS TREND ──</div>
                <div className="border border-cyan-500/10 bg-black/30" style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={fleetVitalsHistory} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                      <XAxis dataKey="day" tick={false} axisLine={false} tickLine={false} />
                      <YAxis tick={false} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#000d1a', border: '1px solid rgba(0,229,255,0.2)', fontFamily: 'monospace', fontSize: 10 }} />
                      <Line type="monotone" dataKey="heartRate" stroke="#00e5ff" strokeWidth={1.5} dot={false} name="Heart Rate (BPM)" />
                      <Line type="monotone" dataKey="temperature" stroke="#ffaa00" strokeWidth={1.5} dot={false} name="Temperature (°C)" />
                      <Line type="monotone" dataKey="metabolism" stroke="#00ff88" strokeWidth={1.5} dot={false} name="Metabolism (%)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-6 mt-3 text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-widest">
                  {[
                    { label: 'Heart Rate', color: '#00e5ff' },
                    { label: 'Temperature', color: '#ffaa00' },
                    { label: 'Metabolism', color: '#00ff88' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className="w-3 h-[2px]" style={{ backgroundColor: item.color }} />
                      <span className="opacity-50">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-[clamp(0.5rem,0.6vw,0.65rem)] tracking-widest text-green-400/70">TREND STABLE · NO SIGNIFICANT DEVIATION DETECTED</div>
              </div>
            </div>
          </div>

          {/* SECTION 6 — HIBERNATION SCHEDULE */}
          <div className="border-t border-cyan-500/10 p-[3vw] bg-[#000d1a]">
            <div className="text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold tracking-[0.3em] text-cyan-400 mb-6">── HIBERNATION SCHEDULE · NEXT 90 DAYS ──</div>
            <div className="space-y-2">
              {scheduleData.map(member => (
                <div key={member.name} className="flex items-center gap-3">
                  <div className="w-[150px] shrink-0">
                    <div className="text-[clamp(0.55rem,0.65vw,0.7rem)] font-bold tracking-wider text-cyan-400">{member.name}</div>
                    <div className="text-[clamp(0.45rem,0.5vw,0.55rem)] tracking-widest text-cyan-500/40">{member.role}</div>
                  </div>
                  <div className="flex-1 relative h-6 bg-[#0a1929] border border-cyan-500/10">
                    <div className="absolute left-0 top-0 h-full w-[1px] z-10" style={{ borderLeft: '2px dashed rgba(255,50,50,0.7)' }} />
                    <div className="absolute top-0 h-full bg-[#0d2137]" style={{ left: 0, width: `${(member.wakeDay / 90) * 100}%` }} />
                    <div
                      className="absolute top-0 h-full"
                      style={{
                        left: `${(member.wakeDay / 90) * 100}%`,
                        width: `${((90 - member.wakeDay) / 90) * 100}%`,
                        backgroundColor: 'rgba(0,229,255,0.3)',
                        borderLeft: '2px solid #00e5ff',
                      }}
                    />
                  </div>
                  <div className="w-[100px] shrink-0 text-right text-[clamp(0.5rem,0.6vw,0.65rem)] tracking-widest text-cyan-400 font-bold">WAKE D+{member.wakeDay}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-4 text-[clamp(0.5rem,0.6vw,0.65rem)] tracking-widest text-cyan-500/40">
              <div className="flex items-center gap-2">
                <div className="w-3 h-[2px] bg-red-500" />
                <span>TODAY</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#0d2137]" />
                <span>HIBERNATING</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3" style={{ backgroundColor: 'rgba(0,229,255,0.3)' }} />
                <span>AWAKE PERIOD</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-6">
              {[
                { label: 'NEXT WAKE EVENT', value: 'CHEN_WEI + KIM_S', sub: 'DAY +43', color: 'text-cyan-400' },
                { label: 'TOTAL ROTATIONS THIS YEAR', value: '8', sub: '', color: 'text-cyan-400' },
                { label: 'AVG HIBERNATION', value: '2.3 YEARS', sub: '', color: 'text-cyan-400' },
                { label: 'LONGEST ACTIVE DUTY', value: 'KIM_S', sub: '203 DAYS', color: 'text-amber-400' },
              ].map(stat => (
                <div key={stat.label} className="p-3 border border-cyan-500/10 bg-[rgba(0,0,0,0.2)]">
                  <div className="text-[clamp(0.45rem,0.5vw,0.55rem)] tracking-widest text-cyan-500/30 mb-1.5">{stat.label}</div>
                  <div className={`text-[clamp(0.75rem,0.9vw,0.95rem)] font-bold tracking-wider ${stat.color}`}>{stat.value}</div>
                  {stat.sub && <div className="text-[clamp(0.45rem,0.5vw,0.55rem)] tracking-widest text-cyan-500/40 mt-0.5">{stat.sub}</div>}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 7 — MEDICAL STATUS */}
          <div className="border-t border-cyan-500/10 p-[3vw] bg-[#000d1a]">
            <div className="text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold tracking-[0.3em] text-cyan-400 mb-6">── MEDICAL STATUS · 医疗状况 ──</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[
                  { icon: '⚠', label: 'BONE DENSITY LOSS', value: '3 CREW MEMBERS', sub: '骨密度流失警告 · Monitoring required', color: 'text-amber-400', valueColor: 'text-amber-400' },
                  { icon: '⚠', label: 'MUSCLE ATROPHY', value: '5 CREW MEMBERS', sub: '肌肉萎缩监测 · Rehabilitation scheduled', color: 'text-amber-400', valueColor: 'text-amber-400' },
                  { icon: '✓', label: 'NUTRITION SUPPLEMENT', value: 'NOMINAL', sub: '营养补充状态 · All pods dispensing normally', color: 'text-green-400', valueColor: 'text-green-400' },
                  { icon: '✓', label: 'MEDICATION RESERVES', value: '94%', sub: '药物储备 · Sufficient for 2.3 more years', color: 'text-green-400', valueColor: 'text-green-400' },
                  { icon: '✓', label: 'LAST MEDICAL SCAN', value: '6 HOURS AGO', sub: '上次医疗检查 · Next scan in 18 hours', color: 'text-green-400', valueColor: 'text-green-400' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-[clamp(0.6rem,0.7vw,0.75rem)] tracking-widest">
                      <div className="flex items-center gap-2">
                        <span className={item.color}>{item.icon}</span>
                        <span className={`font-bold ${item.color}`}>{item.label}</span>
                      </div>
                      <span className={`font-bold ${item.valueColor}`}>{item.value}</span>
                    </div>
                    <div className="text-[clamp(0.45rem,0.5vw,0.55rem)] tracking-widest text-cyan-500/30 mt-0.5 ml-5">{item.sub}</div>
                  </div>
                ))}

                <div className="mt-6 pt-5 border-t border-cyan-500/10">
                  <div className="text-[clamp(0.7rem,0.8vw,0.85rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">── RECOVERY PROTOCOL TIMELINE ──</div>
                  <div className="space-y-3">
                    {[
                      { name: 'CREW_A', phase: 'Phase 1: Calcium supplement', day: 12, total: 30 },
                      { name: 'CREW_B', phase: 'Phase 1: Monitoring', day: 5, total: 30 },
                      { name: 'CREW_C', phase: 'Phase 2: Exercise protocol', day: 22, total: 30 },
                    ].map(crew => {
                      const pct = (crew.day / crew.total) * 100;
                      const barColor = pct >= 70 ? '#00ff88' : '#ffaa00';
                      return (
                        <div key={crew.name} className="flex items-center gap-4">
                          <div className="w-[70px] shrink-0 text-[clamp(0.55rem,0.65vw,0.7rem)] font-bold tracking-wider text-cyan-400">{crew.name}</div>
                          <div className="flex-1 h-5 bg-[#0a1929] border border-cyan-500/10 relative">
                            <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                          </div>
                          <div className="shrink-0 text-[clamp(0.45rem,0.55vw,0.6rem)] tracking-widest">
                            <span className="text-cyan-500/40">{crew.phase}</span>
                            <span className="text-cyan-400 font-bold ml-2">Day {crew.day}/{crew.total}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 text-[clamp(0.45rem,0.5vw,0.55rem)] tracking-widest text-cyan-500/20">
                    Reference: Wandering Earth Project · Bone Density Research Protocol (RQ1)
                  </div>
                </div>
              </div>

              <div className="p-4 border border-[rgba(0,229,255,0.08)] bg-[rgba(0,229,255,0.02)] space-y-4">
                <div className="text-[clamp(0.7rem,0.8vw,0.85rem)] font-bold tracking-[0.2em] text-cyan-500/40">── METABOLIC SUPPRESSION ──</div>
                <div className="space-y-2 text-[clamp(0.6rem,0.7vw,0.75rem)] tracking-widest">
                  {[
                    { label: 'AVG METABOLIC RATE:', value: '18% of normal' },
                    { label: 'CALORIC CONSUMPTION:', value: '94 kcal/day' },
                    { label: 'AGING RATE:', value: '12% of normal' },
                    { label: 'EST. BIOLOGICAL AGE SAVED:', value: '6.2 years' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between">
                      <span className="opacity-40">{row.label}</span>
                      <span className="text-cyan-400 font-bold">{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="border border-cyan-500/10 bg-[#000d1a] p-3 text-[clamp(0.5rem,0.55vw,0.6rem)] tracking-widest text-cyan-500/40 leading-relaxed">
                  NOTE: Prolonged hibernation causes cumulative biological stress.
                  <br />
                  Each revival increases recovery time by ~3%.
                  <br />
                  [Reference: Wandering Earth Project Medical Protocol v4.7]
                </div>
                <div>
                  <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-2">METABOLIC RATE COMPARISON</div>
                  <div className="h-[150px] bg-black/30 border border-cyan-500/10">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{ label: 'Normal Human', value: 100 }, { label: 'Hibernating Crew', value: 18 }, { label: 'Target Minimum', value: 10 }]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                        <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'rgba(0,229,255,0.35)' }} tickLine={false} axisLine={false} />
                        <YAxis tick={false} axisLine={false} tickLine={false} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          <Cell fill="#445566" />
                          <Cell fill="#00e5ff" />
                          <Cell fill="#00ff88" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes podGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(0,229,255,0.1), inset 0 0 20px rgba(0,10,30,0.8); }
          50% { box-shadow: 0 0 25px rgba(0,229,255,0.25), inset 0 0 20px rgba(0,10,30,0.8); }
        }
        @keyframes podPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes liquidRise {
          0% { height: 35%; opacity: 0.6; }
          100% { height: 45%; opacity: 0.9; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes scanlines {
          0% { transform: translateY(0); }
          100% { transform: translateY(8px); }
        }
      `,
        }}
      />
    </div>
  );
}

function SvgPieChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = 140, cy = 140, r = 120, innerR = 55;
  let currentAngle = -Math.PI / 2;
  const [hovered, setHovered] = React.useState<number | null>(null);

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(startAngle);
    const iy1 = cy + innerR * Math.sin(startAngle);
    const ix2 = cx + innerR * Math.cos(endAngle);
    const iy2 = cy + innerR * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
    return { ...d, path, i, midAngle: startAngle + angle / 2 };
  });

  return (
    <svg width={280} height={280} style={{ overflow: 'visible' }}>
      <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="rgba(0,229,255,0.1)" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={innerR - 4} fill="rgba(0,229,255,0.03)" stroke="rgba(0,229,255,0.08)" strokeWidth={1} />
      {slices.map((s) => (
        <path
          key={s.i}
          d={s.path}
          fill={s.color}
          opacity={hovered === s.i ? 1 : 0.8}
          stroke="#000d1a"
          strokeWidth={2}
          transform={hovered === s.i ? `translate(${Math.cos(s.midAngle) * 6} ${Math.sin(s.midAngle) * 6})` : ''}
          onMouseEnter={() => setHovered(s.i)}
          onMouseLeave={() => setHovered(null)}
          style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
        />
      ))}
      {hovered === null && (
        <>
          <text x={cx} y={cy - 10} textAnchor="middle" fill="rgba(0,229,255,0.4)" fontSize={10} fontFamily="monospace" letterSpacing="0.15em">CREW</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#00e5ff" fontSize={18} fontFamily="monospace" fontWeight="bold">127</text>
          <text x={cx} y={cy + 26} textAnchor="middle" fill="rgba(0,229,255,0.3)" fontSize={9} fontFamily="monospace" letterSpacing="0.15em">TOTAL</text>
        </>
      )}
      {hovered !== null && (
        <text x={cx} y={cy - 8} textAnchor="middle" fill="#00e5ff" fontSize={11} fontFamily="monospace">
          {slices[hovered].name}
        </text>
      )}
      {hovered !== null && (
        <text x={cx} y={cy + 10} textAnchor="middle" fill="white" fontSize={13} fontFamily="monospace" fontWeight="bold">
          {slices[hovered].value} 人
        </text>
      )}
      {hovered !== null && (
        <text x={cx} y={cy + 26} textAnchor="middle" fill="rgba(0,229,255,0.5)" fontSize={10} fontFamily="monospace">
          {((slices[hovered].value / total) * 100).toFixed(1)}%
        </text>
      )}
    </svg>
  );
}

function createFloorPods(start: number, end: number, _defaultStatus: PodStatus, overrides?: Partial<Record<PodStatus, number>>) {
  const total = end - start + 1;
  const list: PodStatus[] = [];
  const warn = overrides?.WARNING || 0;
  const dorm = overrides?.DORMANT || 0;
  const crit = overrides?.CRITICAL || 0;
  const nominal = total - warn - dorm - crit;
  list.push(...Array(nominal).fill('NOMINAL'));
  list.push(...Array(warn).fill('WARNING'));
  list.push(...Array(dorm).fill('DORMANT'));
  list.push(...Array(crit).fill('CRITICAL'));
  return list.slice(0, total);
}

function buildPageNumbers(current: number, total: number) {
  let start = Math.max(0, current - 2);
  let end = Math.min(total - 1, start + 4);
  if (end - start < 4) start = Math.max(0, end - 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function HibernationPodVisual({ pod, effectiveStatus }: { pod: Pod; effectiveStatus: PodStatus }) {
  const theme: Record<PodStatus, { primary: string; secondary: string; glow: string; bg: string }> = {
    NOMINAL:  { primary: '#00e5ff', secondary: '#004466', glow: 'rgba(0,229,255,0.2)',  bg: 'rgba(0,8,20,0.95)'  },
    WARNING:  { primary: '#ffaa00', secondary: '#442200', glow: 'rgba(255,170,0,0.25)', bg: 'rgba(10,5,0,0.95)'  },
    CRITICAL: { primary: '#ff3333', secondary: '#440000', glow: 'rgba(255,50,50,0.35)', bg: 'rgba(15,0,0,0.95)'  },
    DORMANT:  { primary: '#3355aa', secondary: '#001133', glow: 'rgba(50,80,180,0.15)', bg: 'rgba(0,3,12,0.95)'  },
    WAKING:   { primary: '#ff8800', secondary: '#331a00', glow: 'rgba(255,140,0,0.4)', bg: 'rgba(25,12,0,0.95)'  },
    AWAKE:    { primary: '#00ff88', secondary: '#003322', glow: 'rgba(0,255,136,0.35)', bg: 'rgba(0,20,12,0.95)'  },
  };
  const status = effectiveStatus;
  const t = theme[status];
  const isCritical = status === 'CRITICAL';
  const isWarning = status === 'WARNING';
  const isDormant = status === 'DORMANT';
  const isWaking = status === 'WAKING';
  const isAwake = status === 'AWAKE';

  return (
    <div style={{
      width: '100%',
      background: t.bg,
      border: `1px solid ${t.primary}`,
      boxShadow: `0 0 30px ${t.glow}, inset 0 0 40px ${t.secondary}`,
      position: 'relative',
      overflow: 'hidden',
      animation: isCritical ? 'podPulse 0.8s infinite' : isWarning ? 'podPulse 2.5s infinite' : isWaking ? 'podPulse 1.2s infinite' : isAwake ? 'podGlow 3s ease-in-out infinite' : isDormant ? 'none' : 'podGlow 5s ease-in-out infinite',
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', opacity: isDormant ? 0.1 : 0.2,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 3px, ${t.primary}08 3px, ${t.primary}08 4px)`,
          animation: isDormant ? 'none' : 'scanlines 8s linear infinite',
        }} />
      </div>

      <div style={{
        padding: '4px 8px',
        borderBottom: `1px solid ${t.primary}30`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: `linear-gradient(90deg, ${t.secondary}, transparent)`,
      }}>
        <span style={{
          fontSize: '9px', fontFamily: 'monospace', color: t.primary,
          letterSpacing: '0.2em', fontWeight: 'bold',
          animation: isCritical ? 'blink 0.8s infinite' : 'none',
        }}>{isWaking ? 'WAKING' : isAwake ? 'AWAKE' : status}</span>
        {isWaking && (
          <Loader2 size={12} className="text-orange-400 animate-spin shrink-0" aria-hidden />
        )}
        {(isWarning || isCritical) && (
          <span style={{ fontSize: '11px', animation: 'blink 1s infinite' }}>⚠</span>
        )}
        {isDormant && (
          <span style={{ fontSize: '8px', fontFamily: 'monospace', color: t.primary, opacity: 0.5, letterSpacing: '0.15em' }}>SEALED</span>
        )}
      </div>

      <div style={{ height: '90px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: isDormant ? '70%' : '45%',
          background: `linear-gradient(180deg, transparent, ${t.primary}12, ${t.primary}25)`,
          animation: isDormant ? 'none' : 'liquidRise 4s ease-in-out infinite alternate',
        }} />

        <div style={{
          position: 'absolute',
          width: '60px', height: '85px',
          background: `radial-gradient(ellipse, ${t.glow}, transparent 70%)`,
          animation: isCritical ? 'podPulse 0.8s infinite' : 'podGlow 4s ease-in-out infinite',
        }} />

        <svg width="45" height="85" viewBox="0 0 45 85"
          style={{
            position: 'relative', zIndex: 1, opacity: isDormant ? 0.4 : 0.85,
            transform: isCritical ? 'rotate(-3deg)' : 'none',
            filter: `drop-shadow(0 0 5px ${t.primary})`,
          }}>
          <circle cx="22.5" cy="12" r="9" fill={`${t.primary}25`} stroke={t.primary} strokeWidth="1" />
          <line x1="22.5" y1="21" x2="22.5" y2="25.5" stroke={t.primary} strokeWidth="1.5" opacity="0.7" />
          <ellipse cx="22.5" cy="45" rx="10.5" ry="16.5" fill={`${t.primary}15`} stroke={t.primary} strokeWidth="1" />
          <path d="M 13.5 33 Q 6 43.5 4.5 52.5" fill="none" stroke={t.primary} strokeWidth="1.2" opacity="0.6" />
          <path d="M 31.5 33 Q 39 43.5 40.5 52.5" fill="none" stroke={t.primary} strokeWidth="1.2" opacity="0.6" />
          <path d="M 18 60 Q 15 75 14.25 85.5" fill="none" stroke={t.primary} strokeWidth="1.2" opacity="0.6" />
          <path d="M 27 60 Q 30 75 30.75 85.5" fill="none" stroke={t.primary} strokeWidth="1.2" opacity="0.6" />
          {(status === 'NOMINAL' || isDormant || isAwake) && (
            <>
              <line x1="16.5" y1="37.5" x2="19.5" y2="43.5" stroke={`${t.primary}50`} strokeWidth="0.5" />
              <line x1="25.5" y1="34.5" x2="28.5" y2="40.5" stroke={`${t.primary}50`} strokeWidth="0.5" />
              <line x1="19.5" y1="48" x2="22.5" y2="54" stroke={`${t.primary}50`} strokeWidth="0.5" />
            </>
          )}
          {(isWarning || isCritical) && (
            <>
              <circle cx="18" cy="39" r="1.5" fill={t.primary} opacity="0.8" />
              <circle cx="27" cy="39" r="1.5" fill={t.primary} opacity="0.8" />
              <circle cx="22.5" cy="48" r="1.5" fill={t.primary} opacity="0.8" />
            </>
          )}
        </svg>
      </div>

      <div style={{
        borderTop: `1px solid ${t.primary}25`,
        padding: '3px 8px',
        display: 'flex', justifyContent: 'space-between',
        background: `linear-gradient(90deg, ${t.secondary}80, transparent)`,
      }}>
        <span style={{ fontSize: '8px', fontFamily: 'monospace', color: '#00e5ff', opacity: isDormant ? 0.4 : 0.9 }}>♥ {pod.heartRate}</span>
        <span style={{ fontSize: '8px', fontFamily: 'monospace', color: '#ffaa00', opacity: isDormant ? 0.4 : 0.9 }}>{pod.temperature}°C</span>
        <span style={{ fontSize: '8px', fontFamily: 'monospace', color: '#00ff88', opacity: isDormant ? 0.4 : 0.9 }}>{pod.metabolism}%</span>
      </div>

      <div style={{ borderTop: `1px solid ${t.primary}15` }}>
        <EcgCanvas status={status} />
      </div>

      <div style={{
        padding: '3px 8px',
        borderTop: `1px solid ${t.primary}15`,
        fontSize: '8px', fontFamily: 'monospace',
        color: t.primary, opacity: isDormant ? 0.4 : 0.7,
        letterSpacing: '0.15em', textAlign: 'center',
        background: `linear-gradient(90deg, transparent, ${t.secondary}60, transparent)`,
      }}>
        {pod.name}
      </div>
    </div>
  );
}

function EcgCanvas({ status }: { status: PodStatus }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    const buffer: number[] = new Array(w).fill(h / 2);
    let t = Math.random() * 200;
    let animId = 0;
    const isActive =
      status === 'WARNING' || status === 'CRITICAL' || status === 'NOMINAL' || status === 'WAKING' || status === 'AWAKE';
    const speed =
      status === 'CRITICAL' ? 3 : status === 'WARNING' ? 2 : status === 'WAKING' ? 2.2 : status === 'AWAKE' ? 1.6 : 1.4;
    const color =
      status === 'CRITICAL'
        ? '#ff4444'
        : status === 'WARNING'
          ? '#ffaa00'
          : status === 'WAKING'
            ? '#ff8800'
            : status === 'AWAKE'
              ? '#00ff88'
              : 'rgba(0,229,255,0.35)';
    const draw = () => {
      t += speed;
      let y: number;
      if (status === 'CRITICAL' || status === 'WARNING' || status === 'WAKING') {
        const period = status === 'CRITICAL' ? 40 : status === 'WAKING' ? 50 : 60;
        const phase = t % period;
        if (phase < 2) y = h / 2;
        else if (phase < 4) y = h / 2 - h * 0.38;
        else if (phase < 6) y = h / 2 + h * 0.18;
        else if (phase < 9) y = h / 2 - h * 0.08 * ((9 - phase) / 3);
        else y = h / 2 + Math.sin(t * 0.08) * 0.5;
      } else {
        y = h / 2 + Math.sin(t * 0.025) * h * 0.15;
      }
      buffer.push(y);
      buffer.shift();
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < w; i++) {
        if (i === 0) ctx.moveTo(i, buffer[i]);
        else ctx.lineTo(i, buffer[i]);
      }
      ctx.stroke();
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, [status]);
  return <canvas ref={canvasRef} width={400} height={35} className="w-full h-[35px]" />;
}

function RightPanel({
  counts,
  pods,
  fleetHR,
  alertPods,
  onSelectPod,
  getStatus,
}: {
  counts: Record<string, number>;
  pods: Pod[];
  fleetHR: Array<{ t: number; bpm: number }>;
  alertPods: Pod[];
  onSelectPod: (pod: Pod) => void;
  getStatus: (p: Pod) => PodStatus;
}) {
  const avgHR = Math.round(pods.reduce((a, p) => a + p.heartRate, 0) / pods.length);
  const avgTemp = (pods.reduce((a, p) => a + p.temperature, 0) / pods.length).toFixed(1);
  const avgMeta = Math.round(pods.reduce((a, p) => a + p.metabolism, 0) / pods.length);
  const barChar = (count: number, total: number) => {
    const filled = Math.round((count / total) * 12);
    return '█'.repeat(filled) + '░'.repeat(12 - filled);
  };
  const alertDescriptions: Record<string, string> = {
    'POD-119': '心率偏高 · 72 BPM',
    'POD-120': '体温波动 · 36.8°C',
    'POD-121': '体温偏低 · 35.1°C',
    'POD-122': '代谢偏低 · 16%',
    'POD-123': '心率偏低 · 38 BPM',
    'POD-124': '睡眠深度异常',
    'POD-125': '体温偏高 · 37.4°C',
    'POD-126': '代谢异常 · 28%',
    'POD-127': '综合异常 · CHECK REQUIRED',
  };
  return (
    <div className="space-y-4">
      <div className="pb-4 border-b border-[rgba(0,229,255,0.08)]">
        <div className="text-[clamp(0.8rem,1vw,1rem)] font-bold tracking-[0.3em] text-cyan-400 mb-3">SYSTEM OVERVIEW</div>
        <div className="space-y-3 mb-4">
          <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] text-cyan-500/40">── FLEET STATUS ──</div>
          {[
            { label: 'NOMINAL', count: counts.NOMINAL, color: 'text-cyan-400' },
            { label: 'WARNING', count: counts.WARNING, color: 'text-amber-400' },
            { label: 'DORMANT', count: counts.DORMANT, color: 'text-blue-400' },
            { label: 'CRITICAL', count: counts.CRITICAL, color: 'text-red-400' },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3 text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-widest font-mono">
              <span className={`w-20 ${row.color}`}>{row.label}:</span>
              <span className="w-8 text-right opacity-60">{row.count}</span>
              <span className="opacity-30">{barChar(row.count, 127)}</span>
              <span className="opacity-40">{((row.count / 127) * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] text-cyan-500/40">── AVERAGE VITALS ──</div>
          {[
            { label: 'HEART RATE', value: `${avgHR} BPM`, color: 'text-cyan-400' },
            { label: 'TEMPERATURE', value: `${avgTemp}°C`, color: 'text-amber-400' },
            { label: 'METABOLISM', value: `${avgMeta}%`, color: 'text-green-400' },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-widest">
              <span className="opacity-40">{row.label}</span>
              <span className={`font-bold ${row.color}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="pb-4 border-b border-[rgba(0,229,255,0.08)]">
        <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-2">── FLEET VITALS MONITOR ──</div>
        <div className="border border-cyan-500/10" style={{ background: 'rgba(0,0,0,0.3)', height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fleetHR} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
              <XAxis dataKey="t" tick={false} axisLine={false} tickLine={false} />
              <YAxis tick={false} axisLine={false} tickLine={false} domain={[46, 58]} />
              <Line type="monotone" dataKey="bpm" stroke="#00e5ff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="text-[clamp(0.45rem,0.5vw,0.55rem)] tracking-[0.2em] text-cyan-500/30 text-center mt-1">AVG HEART RATE · REAL-TIME</div>
      </div>

      <div className="pb-4 border-b border-[rgba(0,229,255,0.08)]">
        <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-2">── ACTIVE ALERTS ──</div>
        <div className="overflow-y-auto space-y-1" style={{ maxHeight: 160 }}>
          {alertPods.map(pod => {
            const st = getStatus(pod);
            const isCritical = st === 'CRITICAL';
            return (
              <button
                key={pod.id}
                onClick={() => onSelectPod(pod)}
                className={`w-full text-left flex items-center justify-between px-2 py-1.5 text-[clamp(0.5rem,0.6vw,0.65rem)] tracking-widest transition-colors hover:bg-cyan-500/5 ${
                  isCritical ? 'border-l-2 border-red-500 animate-pulse' : ''
                }`}
                style={isCritical ? { background: 'rgba(255,0,0,0.05)' } : undefined}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span>{isCritical ? '🔴' : '⚠'}</span>
                  <span className={`font-bold ${isCritical ? 'text-red-400' : 'text-amber-400'}`}>{pod.id}</span>
                  <span className="opacity-40 truncate">{pod.name}</span>
                </div>
                <span className="opacity-50 whitespace-nowrap ml-2">{alertDescriptions[pod.id] || st}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-2">── RECENT ACTIVITY ──</div>
        <div className="space-y-1.5">
          {[
            { time: '2MIN AGO', icon: '🟢', text: '自动扫描完成 127/127', color: 'text-cyan-400/70' },
            { time: '1HR AGO', icon: '🟢', text: 'POD-047 体征恢复正常', color: 'text-cyan-400/70' },
            { time: '6HR AGO', icon: '🟡', text: 'POD-119 心率警告触发', color: 'text-amber-400/70' },
            { time: '1DAY AGO', icon: '🟢', text: '例行维护完成', color: 'text-cyan-400/70' },
            { time: '3DAY AGO', icon: '🔴', text: '辐射读数异常 已修复', color: 'text-red-400/70' },
            { time: '7DAY AGO', icon: '🟢', text: '全舱扫描通过 127/127', color: 'text-cyan-400/70' },
          ].map((evt, i) => (
            <div key={i} className="flex items-center gap-2 text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-widest">
              <span className="opacity-30 w-16 shrink-0">{evt.time}</span>
              <span>{evt.icon}</span>
              <span className={evt.color}>{evt.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PodDetail({
  pod,
  vitalsHistory,
  onStatusChange,
}: {
  pod: Pod;
  vitalsHistory: Array<{ hour: string; hr: number; temp: number; meta: number }>;
  onStatusChange: (podId: string, newStatus: PodStatus) => void;
}) {
  const statusColor: Record<PodStatus, string> = {
    NOMINAL: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/30',
    WARNING: 'text-amber-400 bg-amber-500/15 border-amber-500/30',
    DORMANT: 'text-blue-400 bg-blue-500/15 border-blue-500/30',
    CRITICAL: 'text-red-400 bg-red-500/15 border-red-500/30',
    WAKING: 'text-orange-400 bg-orange-500/15 border-orange-500/30 font-bold animate-pulse',
    AWAKE: 'text-green-400 bg-green-500/15 border-green-500/30 font-bold',
  };
  const vitalBar = (value: number, max: number, color: string) => {
    const pct = Math.min(100, (value / max) * 100);
    return (
      <div className="h-1.5 w-full bg-white/5 border border-cyan-500/10">
        <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    );
  };
  return (
    <div className="space-y-5">
      <div className="text-[clamp(0.7rem,0.9vw,0.9rem)] font-bold tracking-[0.2em] text-cyan-500/40">── {pod.id} ──</div>
      <div className="space-y-2 text-[clamp(0.6rem,0.7vw,0.75rem)] tracking-widest">
        <div className="flex justify-between">
          <span className="opacity-40">OCCUPANT</span>
          <span className="text-white font-bold">{pod.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-40">ROLE</span>
          <span className="opacity-70">{pod.role}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="opacity-40">STATUS</span>
          <span className={`px-2 py-0.5 text-[clamp(0.5rem,0.55vw,0.6rem)] font-bold tracking-widest border ${statusColor[pod.status]}`}>{pod.status}</span>
        </div>
      </div>
      <div className="h-[1px] w-full bg-cyan-500/10" />
      <div className="space-y-3">
        <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] text-cyan-500/40">── VITAL SIGNS ──</div>
        <div className="space-y-2.5">
          <div>
            <div className="flex justify-between text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-widest mb-1">
              <span className="opacity-40">♥ HEART RATE</span>
              <span className="text-cyan-400 font-bold">{pod.heartRate} BPM</span>
            </div>
            {vitalBar(pod.heartRate, 80, '#00e5ff')}
          </div>
          <div>
            <div className="flex justify-between text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-widest mb-1">
              <span className="opacity-40">🌡 TEMPERATURE</span>
              <span className="text-amber-400 font-bold">{pod.temperature}°C</span>
            </div>
            {vitalBar(pod.temperature, 38, '#ffaa00')}
          </div>
          <div>
            <div className="flex justify-between text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-widest mb-1">
              <span className="opacity-40">⚡ METABOLISM</span>
              <span className="text-green-400 font-bold">{pod.metabolism}%</span>
            </div>
            {vitalBar(pod.metabolism, 30, '#00ff88')}
          </div>
        </div>
      </div>
      <div className="h-[1px] w-full bg-cyan-500/10" />
      <div className="space-y-2">
        <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] text-cyan-500/40">── 24H VITALS HISTORY ──</div>
        <div className="border border-cyan-500/10 bg-black/40" style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vitalsHistory} margin={{ top: 8, right: 8, left: -25, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
              <XAxis dataKey="hour" tick={{ fontSize: 8, fill: 'rgba(0,229,255,0.25)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 8, fill: 'rgba(0,229,255,0.25)' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#000d1a', border: '1px solid rgba(0,229,255,0.2)', fontFamily: 'monospace', fontSize: 10 }}
                labelStyle={{ color: '#00e5ff' }}
              />
              <Line type="monotone" dataKey="hr" stroke="#00e5ff" strokeWidth={1.5} dot={false} name="HR (BPM)" />
              <Line type="monotone" dataKey="temp" stroke="#ffaa00" strokeWidth={1.5} dot={false} name="Temp (°C)" />
              <Line type="monotone" dataKey="meta" stroke="#00ff88" strokeWidth={1.5} dot={false} name="Meta (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="h-[1px] w-full bg-cyan-500/10" />
      <div className="space-y-2">
        <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] text-cyan-500/40">── HIBERNATION DATA ──</div>
        <div className="space-y-1.5 text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-widest">
          <div className="flex justify-between">
            <span className="opacity-40">POD SEALED</span>
            <span className="opacity-70">YEAR 0 · 847 YEARS AGO</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-40">EST. REVIVAL</span>
            <span className="opacity-70">IN 43 DAYS</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-40">LAST CHECK</span>
            <span className="opacity-70">2 MIN AGO</span>
          </div>
        </div>
      </div>
      {pod.status === 'WAKING' && (
        <div
          style={{
            padding: '12px',
            border: '1px solid rgba(255,140,0,0.4)',
            background: 'rgba(255,140,0,0.05)',
            marginTop: '12px',
          }}
        >
          <div style={{ fontSize: '10px', color: '#ffaa00', letterSpacing: '0.2em', marginBottom: '8px' }}>
            ── WAKING SEQUENCE IN PROGRESS ──
          </div>
          <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '8px' }}>解冻程序进行中 · 预计需要 45 分钟</div>
          <button
            type="button"
            onClick={() => onStatusChange(pod.id, 'AWAKE')}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(0,255,136,0.1)',
              border: '1px solid #00ff88',
              color: '#00ff88',
              fontFamily: 'monospace',
              cursor: 'pointer',
              letterSpacing: '0.2em',
            }}
          >
            ✓ CONFIRM AWAKE
          </button>
        </div>
      )}

      {pod.status === 'AWAKE' && (
        <div
          style={{
            padding: '12px',
            border: '1px solid rgba(0,255,136,0.3)',
            background: 'rgba(0,255,136,0.03)',
            marginTop: '12px',
          }}
        >
          <div style={{ fontSize: '10px', color: '#00ff88', letterSpacing: '0.2em', marginBottom: '8px' }}>
            ── CURRENTLY ON DUTY ──
          </div>
          <div style={{ fontSize: '9px', opacity: 0.5, marginBottom: '12px' }}>Mission in progress · return to hibernation when complete</div>
          <button
            type="button"
            onClick={() => onStatusChange(pod.id, 'DORMANT')}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(0,100,200,0.1)',
              border: '1px solid rgba(0,150,255,0.4)',
              color: 'rgba(0,200,255,0.8)',
              fontFamily: 'monospace',
              cursor: 'pointer',
              letterSpacing: '0.2em',
              marginBottom: '8px',
            }}
          >
            ↩ RETURN TO HIBERNATION
          </button>
          <div style={{ fontSize: '8px', opacity: 0.3, textAlign: 'center' }}>Status resets to DORMANT after return</div>
        </div>
      )}

      {pod.status === 'DORMANT' && (
        <div className="pt-2">
          <button
            type="button"
            disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }}
            className="w-full py-2.5 border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em]"
          >
            WAKE OCCUPANT · Requires AI Authorization
          </button>
        </div>
      )}

      {pod.status !== 'WAKING' && pod.status !== 'AWAKE' && pod.status !== 'DORMANT' && (
        <div className="relative group/wake pt-2">
          <button
            type="button"
            disabled
            className="w-full py-2.5 border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] opacity-50 cursor-not-allowed"
          >
            WAKE OCCUPANT
          </button>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-[#000d1a] border border-amber-500/30 text-[clamp(0.5rem,0.55vw,0.6rem)] text-amber-400 tracking-widest whitespace-nowrap opacity-0 group-hover/wake:opacity-100 transition-opacity pointer-events-none">
            Requires AI Authorization
          </div>
        </div>
      )}
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
        {!collapsed && badge && (
          <span className="bg-red-500 text-white text-[clamp(0.5rem,0.55vw,0.6875rem)] px-1.5 py-0.5 rounded-full animate-pulse">
            {badge}
          </span>
        )}
        {collapsed && badge && <span className="absolute top-0 right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
      </Link>
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-[#000d1a] border border-cyan-500/30 text-[clamp(0.5rem,0.55vw,0.6875rem)] text-cyan-400 tracking-widest whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none z-50">
          {label}
        </div>
      )}
    </li>
  );
}
