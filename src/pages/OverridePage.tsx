import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useOverrideBadge } from '../hooks/useOverrideBadge';
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
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';

export interface Decision {
  id: string;
  crisisType: 'oxygen' | 'radiation' | 'power' | 'pressure';
  crisisLabel: string;
  location: string;
  recommendedPerson: string;
  recommendedPod: string;
  role: string;
  score: number;
  bioScore: number;
  skillScore: number;
  equityScore: number;
  triggeredAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'OVERRIDDEN';
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE';
  timeToFailure: string;
  affectedPopulation: number;
  riskDescription: string[];
}

const initialDecisions: Decision[] = [
  {
    id: 'DEC-001',
    crisisType: 'oxygen',
    crisisLabel: 'OXYGEN DEPLETION',
    location: 'SECTOR B1-R2',
    recommendedPerson: 'CHEN_WEI',
    recommendedPod: 'POD-047',
    role: 'Life Support Engineer',
    score: 93.6,
    bioScore: 94,
    skillScore: 98,
    equityScore: 87,
    triggeredAt: '2 MIN AGO',
    status: 'PENDING',
    riskLevel: 'CRITICAL',
    timeToFailure: '01:30:00',
    affectedPopulation: 2400,
    riskDescription: [
      'B1-R2 O₂ at 71.3% — below 78% alert threshold',
      'Sector depletion estimated within 1.5 hours',
      'Residential B: ~2,400 residents affected',
      'No alternative candidate matches CHEN_WEI',
      'Forced evacuation protocol if unaddressed',
    ],
  },
  {
    id: 'DEC-002',
    crisisType: 'radiation',
    crisisLabel: 'RADIATION SURGE',
    location: 'SECTOR B3-E1',
    recommendedPerson: 'YANOV_K',
    recommendedPod: 'POD-023',
    role: 'Nuclear Engineer',
    score: 94.4,
    bioScore: 91,
    skillScore: 97,
    equityScore: 95,
    triggeredAt: '6 MIN AGO',
    status: 'PENDING',
    riskLevel: 'HIGH',
    timeToFailure: '03:00:00',
    affectedPopulation: 800,
    riskDescription: [
      'B3-E1 radiation 89.3 mSv and rising',
      'May exceed 100 mSv safe limit within 3 hours',
      'Energy sector A: ~800 personnel exposed',
      'Zone lockdown auto-triggers if threshold exceeded',
      'Power output may drop 15–20%',
    ],
  },
  {
    id: 'DEC-003',
    crisisType: 'power',
    crisisLabel: 'POWER SYSTEM FAILURE',
    location: 'SECTOR B3-E2',
    recommendedPerson: 'GARCIA_M',
    recommendedPod: 'POD-067',
    role: 'Systems Engineer',
    score: 87.8,
    bioScore: 85,
    skillScore: 94,
    equityScore: 82,
    triggeredAt: '15 MIN AGO',
    status: 'PENDING',
    riskLevel: 'CRITICAL',
    timeToFailure: '00:45:00',
    affectedPopulation: 1200,
    riskDescription: [
      'B3-E2 main power bus offline',
      'Full B3 deck power at risk within 45 minutes',
      'Industrial + energy zones: ~1,200 people',
      'Backup supplies ~30 minutes remaining',
      'GARCIA_M is the only qualified systems engineer',
    ],
  },
  {
    id: 'DEC-004',
    crisisType: 'pressure',
    crisisLabel: 'PRESSURE ANOMALY',
    location: 'SECTOR B2-I1',
    recommendedPerson: 'SMITH_J',
    recommendedPod: 'POD-041',
    role: 'Structural Engineer',
    score: 92.8,
    bioScore: 88,
    skillScore: 96,
    equityScore: 91,
    triggeredAt: '1 HR AGO',
    status: 'PENDING',
    riskLevel: 'HIGH',
    timeToFailure: '04:00:00',
    affectedPopulation: 600,
    riskDescription: [
      'B2-I1 pressure dropped to 98.2 kPa',
      'Below nominal band 95–110 kPa',
      'Industrial A: ~600 workers affected',
      'Structural fatigue risk if pressure falls further',
      'SMITH_J holds highest structural score',
    ],
  },
  {
    id: 'DEC-005',
    crisisType: 'oxygen',
    crisisLabel: 'OXYGEN DEPLETION',
    location: 'SECTOR B4-C1',
    recommendedPerson: 'ZHANG_LI',
    recommendedPod: 'POD-011',
    role: 'Life Support Engineer',
    score: 85.1,
    bioScore: 76,
    skillScore: 95,
    equityScore: 78,
    triggeredAt: '2 HR AGO',
    status: 'ACCEPTED',
    riskLevel: 'CRITICAL',
    timeToFailure: 'RESOLVED',
    affectedPopulation: 400,
    riskDescription: [
      'B4-C1 core zone O₂ supply anomaly',
      'AI routed to ZHANG_LI',
      'Decision accepted and executed',
    ],
  },
  {
    id: 'DEC-006',
    crisisType: 'radiation',
    crisisLabel: 'RADIATION SURGE',
    location: 'SECTOR B3-E2',
    recommendedPerson: 'MÜLLER_H',
    recommendedPod: 'POD-089',
    role: 'Geologist',
    score: 83.6,
    bioScore: 89,
    skillScore: 82,
    equityScore: 78,
    triggeredAt: '5 HR AGO',
    status: 'OVERRIDDEN',
    riskLevel: 'HIGH',
    timeToFailure: 'RESOLVED',
    affectedPopulation: 500,
    riskDescription: ['Administrator overrode AI recommendation', 'Manual specialist assignment'],
  },
];

function parseHmsToSeconds(hms: string): number {
  const p = hms.split(':').map(Number);
  if (p.length !== 3 || p.some(Number.isNaN)) return 0;
  return p[0] * 3600 + p[1] * 60 + p[2];
}

function formatSeconds(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
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
        className={`flex items-center py-2 text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest transition-all hover:bg-cyan-500/10 ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} ${active ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-cyan-500/60'}`}
      >
        <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
          {icon}
          {!collapsed && <span>{label}</span>}
        </div>
        {!collapsed && badge !== undefined && badge > 0 && (
          <span className="bg-red-500 text-white text-[clamp(0.5rem,0.55vw,0.6875rem)] px-1.5 py-0.5 rounded-full animate-pulse">{badge}</span>
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

export default function OverridePage() {
  const navigate = useNavigate();
  const overrideBadge = useOverrideBadge();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [titleDone, setTitleDone] = useState(false);
  const fullTitle = 'HUMAN OVERRIDE INTERFACE';

  const [decisions, setDecisions] = useState<Decision[]>(() => {
    try {
      const saved = localStorage.getItem('overrideDecisions');
      if (saved) {
        const parsed = JSON.parse(saved) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as Decision[];
        }
      }
    } catch {
      /* invalid JSON — use defaults */
    }
    return initialDecisions;
  });
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [failureSeconds, setFailureSeconds] = useState(0);

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState<Decision | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const riskScrollRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);

  const [history, setHistory] = useState([
    { id: 'DEC-098', time: '2H AGO', crisis: 'OXYGEN DEPLETION', person: 'CHEN_WEI', score: 93.6, action: 'ACCEPTED' as const, admin: 'ADMIN_01' },
    { id: 'DEC-097', time: '6H AGO', crisis: 'RADIATION SURGE', person: 'YANOV_K', score: 94.4, action: 'ACCEPTED' as const, admin: 'ADMIN_01' },
    { id: 'DEC-096', time: '1D AGO', crisis: 'POWER FAILURE', person: 'GARCIA_M', score: 87.8, action: 'OVERRIDDEN' as const, admin: 'ADMIN_01' },
    { id: 'DEC-095', time: '3D AGO', crisis: 'PRESSURE ANOMALY', person: 'SMITH_J', score: 92.8, action: 'ACCEPTED' as const, admin: 'OPERATOR_01' },
    { id: 'DEC-094', time: '7D AGO', crisis: 'OXYGEN DEPLETION', person: 'ZHANG_LI', score: 86.4, action: 'ACCEPTED' as const, admin: 'ADMIN_01' },
  ]);

  const selectedDecision = decisions.find(d => d.id === selectedDecisionId) ?? null;

  const pendingCount = useMemo(() => decisions.filter(d => d.status === 'PENDING').length, [decisions]);

  const stats = useMemo(() => {
    const total = decisions.length + history.length;
    const accepted =
      decisions.filter(d => d.status === 'ACCEPTED').length + history.filter(h => h.action === 'ACCEPTED').length;
    const overridden =
      decisions.filter(d => d.status === 'OVERRIDDEN').length + history.filter(h => h.action === 'OVERRIDDEN').length;
    const pending = decisions.filter(d => d.status === 'PENDING').length;
    const acceptRate = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0';
    const overrideRate = total > 0 ? ((overridden / total) * 100).toFixed(1) : '0';
    return { total, accepted, overridden, pending, acceptRate, overrideRate };
  }, [decisions, history]);

  const responseTimeData = useMemo(
    () => [
      { id: 'DEC-091', time: 2.1 },
      { id: 'DEC-092', time: 3.4 },
      { id: 'DEC-093', time: 1.8 },
      { id: 'DEC-094', time: 4.2 },
      { id: 'DEC-095', time: 2.9 },
      { id: 'DEC-096', time: 5.1 },
      { id: 'DEC-097', time: 2.3 },
      { id: 'DEC-098', time: 3.7 },
      { id: 'DEC-099', time: 1.5 },
      { id: 'DEC-100', time: 3.2 },
    ],
    []
  );

  const avgResponseMinutes = useMemo(
    () => responseTimeData.reduce((s, x) => s + x.time, 0) / responseTimeData.length,
    [responseTimeData]
  );

  const crisisStats = useMemo(
    () => [
      { type: 'OXYGEN', count: decisions.filter(d => d.crisisType === 'oxygen').length + 2 },
      { type: 'RADIATION', count: decisions.filter(d => d.crisisType === 'radiation').length + 2 },
      { type: 'POWER', count: decisions.filter(d => d.crisisType === 'power').length + 1 },
      { type: 'PRESSURE', count: decisions.filter(d => d.crisisType === 'pressure').length + 1 },
    ],
    [decisions]
  );

  const pieSlices = useMemo(
    () => [
      { name: 'ACCEPTED', value: stats.accepted, color: '#00ff88' },
      { name: 'OVERRIDDEN', value: stats.overridden, color: '#ffaa00' },
      { name: 'PENDING', value: stats.pending, color: '#ff4444' },
    ],
    [stats]
  );

  const riskDistribution = useMemo(() => {
    const crit = decisions.filter(d => d.riskLevel === 'CRITICAL').length;
    const high = decisions.filter(d => d.riskLevel === 'HIGH').length;
    const mod = decisions.filter(d => d.riskLevel === 'MODERATE').length;
    const sum = crit + high + mod;
    if (sum === 0) {
      return { crit: 0, high: 0, mod: 0, critPct: 0, highPct: 0, modPct: 0 };
    }
    return {
      crit,
      high,
      mod,
      critPct: Math.round((crit / sum) * 100),
      highPct: Math.round((high / sum) * 100),
      modPct: Math.round((mod / sum) * 100),
    };
  }, [decisions]);

  const pushHistory = (dec: Decision, action: 'ACCEPTED' | 'OVERRIDDEN') => {
    setHistory(h => [
      {
        id: dec.id,
        time: 'NOW',
        crisis: dec.crisisLabel,
        person: dec.recommendedPerson,
        score: dec.score,
        action,
        admin: 'ADMIN_01',
      },
      ...h,
    ]);
  };

  const handleOverrideClick = (dec: Decision) => {
    setSelectedDecisionId(dec.id);
    setOverrideTarget(dec);
    setHasScrolledToBottom(false);
    setShowOverrideModal(true);
    setTimeout(() => {
      if (riskScrollRef.current) {
        riskScrollRef.current.scrollTop = 0;
      }
    }, 50);
  };

  const handleRiskScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
    if (atBottom) setHasScrolledToBottom(true);
  };

  const addToHistory = (dec: Decision, action: 'ACCEPTED' | 'OVERRIDDEN') => {
    pushHistory(dec, action);
  };

  const handleAccept = (id: string) => {
    setSelectedDecisionId(id);
    let accepted: Decision | undefined;
    setDecisions(prev => {
      const dec = prev.find(d => d.id === id);
      if (!dec) return prev;
      localStorage.setItem(`podOverride_${dec.recommendedPod}`, 'WAKING');
      window.dispatchEvent(new Event('aeonguard:podOverride'));
      localStorage.setItem('crisisResolved', 'true');
      localStorage.setItem('crisisResolvedBy', dec.recommendedPerson);
      localStorage.setItem('crisisResolvedTime', new Date().toISOString());
      try {
        const stored = JSON.parse(localStorage.getItem('pendingDecisions') || '[]') as { id: string; status?: string }[];
        const updated = stored.map(d => (d.id === id ? { ...d, status: 'ACCEPTED' as const } : d));
        localStorage.setItem('pendingDecisions', JSON.stringify(updated));
      } catch {
        /* noop */
      }
      accepted = dec;
      return prev.map(d => (d.id === id ? { ...d, status: 'ACCEPTED' as const } : d));
    });
    if (accepted) addToHistory({ ...accepted, status: 'ACCEPTED' }, 'ACCEPTED');
    setShowOverrideModal(false);
    setOverrideTarget(null);
  };

  const handleConfirmOverride = (id: string) => {
    setSelectedDecisionId(id);
    let overridden: Decision | undefined;
    setDecisions(prev => {
      const dec = prev.find(d => d.id === id);
      if (!dec) return prev;
      localStorage.setItem('crisisOverridden', 'true');
      localStorage.setItem('crisisOverriddenTime', new Date().toISOString());
      try {
        const stored = JSON.parse(localStorage.getItem('pendingDecisions') || '[]') as { id: string; status?: string }[];
        const updated = stored.map(d => (d.id === id ? { ...d, status: 'OVERRIDDEN' as const } : d));
        localStorage.setItem('pendingDecisions', JSON.stringify(updated));
      } catch {
        /* noop */
      }
      overridden = dec;
      return prev.map(d => (d.id === id ? { ...d, status: 'OVERRIDDEN' as const } : d));
    });
    if (overridden) addToHistory({ ...overridden, status: 'OVERRIDDEN' }, 'OVERRIDDEN');
    setShowOverrideModal(false);
    setOverrideTarget(null);
  };

  const loadDecisionsFromStorage = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('pendingDecisions') || '[]') as unknown[];
      if (!Array.isArray(stored) || stored.length === 0) return;
      setDecisions(prev => {
        const existingIds = new Set(prev.map(d => d.id));
        const newOnes: Decision[] = stored
          .filter(
            (d): d is Record<string, unknown> =>
              typeof d === 'object' &&
              d !== null &&
              'id' in d &&
              typeof (d as { id: unknown }).id === 'string' &&
              !existingIds.has(String((d as { id: unknown }).id))
          )
          .filter(d => d.status === 'PENDING')
          .map(d => {
            const crisisType = d.crisisType as Decision['crisisType'];
            return {
              id: String(d.id),
              crisisType,
              crisisLabel: String(d.crisisLabel ?? ''),
              location: String(d.location ?? ''),
              recommendedPerson: String(d.recommendedPerson ?? ''),
              recommendedPod: String(d.recommendedPod ?? ''),
              role: String(d.role ?? ''),
              score: Number(d.score ?? 0),
              bioScore: 94,
              skillScore: 98,
              equityScore: 87,
              triggeredAt: String(d.triggeredAt ?? ''),
              status: 'PENDING' as const,
              riskLevel: 'CRITICAL' as const,
              timeToFailure: '01:30:00',
              affectedPopulation: 2400,
              riskDescription: [
                `${d.crisisLabel} detected in ${d.location}`,
                `AI recommends waking ${d.recommendedPerson} from ${d.recommendedPod}`,
                `Composite score: ${d.score}/100`,
                `Immediate action required`,
                `No alternative specialists available`,
              ],
            };
          });
        if (newOnes.length === 0) return prev;
        const updated = [...newOnes, ...prev];
        try {
          localStorage.setItem('overrideDecisions', JSON.stringify(updated));
        } catch {
          /* noop */
        }
        return updated;
      });
    } catch {
      /* noop */
    }
  }, []);

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
    loadDecisionsFromStorage();
  }, [loadDecisionsFromStorage]);

  useEffect(() => {
    window.addEventListener('focus', loadDecisionsFromStorage);
    return () => window.removeEventListener('focus', loadDecisionsFromStorage);
  }, [loadDecisionsFromStorage]);

  useEffect(() => {
    try {
      localStorage.setItem('overrideDecisions', JSON.stringify(decisions));
    } catch {
      /* noop */
    }
    const pending = decisions.filter(d => d.status === 'PENDING').length;
    localStorage.setItem('pendingDecisionCount', String(pending));
    window.dispatchEvent(new Event('aeonguard:pendingDecisionCount'));
  }, [decisions]);

  useEffect(() => {
    if (!selectedDecision || selectedDecision.timeToFailure === 'RESOLVED') {
      setFailureSeconds(0);
      return;
    }
    const base = parseHmsToSeconds(selectedDecision.timeToFailure);
    setFailureSeconds(base);
    const iv = setInterval(() => {
      setFailureSeconds(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(iv);
  }, [selectedDecision?.id, selectedDecision?.timeToFailure]);

  useEffect(() => {
    if (showOverrideModal && riskScrollRef.current) {
      const el = riskScrollRef.current;
      setTimeout(() => {
        if (el.scrollHeight <= el.clientHeight + 10) {
          setHasScrolledToBottom(true);
        }
      }, 100);
    }
  }, [showOverrideModal]);

  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const dots: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = Array.from({ length: 48 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      r: 0.35 + Math.random() * 1.1,
      a: 0.06 + Math.random() * 0.22,
    }));
    const loop = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.fillStyle = '#050810';
      ctx.fillRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 140, 180, ${d.a})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aeonguard_auth');
    navigate('/');
  };

  const dec = selectedDecision;

  return (
    <div className="flex h-screen w-full flex-col bg-[#050810] font-mono text-cyan-400 selection:bg-cyan-500/30">
      <canvas ref={bgCanvasRef} className="fixed inset-0 z-0 pointer-events-none opacity-60" />

      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 104l30-17.32V17.32L30 0 0 17.32v69.36L30 104z' fill='rgba(0, 229, 255, 0.04)' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 104px',
        }}
      />

      <nav className="fixed top-0 z-50 flex h-12 w-full items-center justify-between border-b border-cyan-500/30 bg-[#050810]/90 px-4 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.08)]">
        <div className="flex items-center gap-2 font-bold tracking-[0.2em]">
          <Terminal size={18} className="text-cyan-400" />
          <span>AEONGUARD</span>
        </div>
        <div className="flex-1 overflow-hidden mx-8 border-x border-cyan-500/10">
          <div className="animate-[ticker_60s_linear_infinite] whitespace-nowrap text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest text-cyan-500/80">
            {[0, 1].map(dup => (
              <React.Fragment key={dup}>
                <span className="mx-4">⚠ C4 OVERRIDE · HUMAN-IN-THE-LOOP ACTIVE</span>
                <span className="mx-4">🔒 ALL DECISIONS LOGGED · ADMIN AUDIT</span>
                <span className="mx-4">🟡 PENDING DECISIONS · REQUIRES ACTION</span>
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
          <button type="button" onClick={handleLogout} className="flex items-center gap-1 border border-cyan-500/30 px-2 py-1 hover:bg-cyan-500/10 transition-colors">
            <LogOut size={12} />
            LOGOUT
          </button>
        </div>
      </nav>

      <div className="relative z-[1] flex flex-1 pt-12 bg-[#050810]">
        <aside
          className={`fixed left-0 h-full border-r border-cyan-500/30 bg-[#050810]/95 z-40 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${
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
                  active
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
            <SidebarItem to="/dashboard/settings" icon={<Settings size={14} />} label="SETTINGS" collapsed={!sidebarOpen} />
          </div>
        </aside>

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden bg-[#050810] transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-[14vw]' : 'ml-[48px]'}`}
        >
          <div className="border-b border-cyan-500/20 bg-[#000814]/95 p-6 pb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-[clamp(1rem,1.5vw,1.5rem)] font-bold tracking-[0.3em] text-cyan-400 mb-1">
                {displayedTitle}
                {!titleDone && <span style={{ animation: 'blink 0.8s infinite' }}>|</span>}
              </h1>
              <div className="text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-[0.2em] text-cyan-500/50">
                ADMINISTRATOR AUTHORIZATION REQUIRED · ALL DECISIONS ARE LOGGED
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem('overrideDecisions');
                localStorage.removeItem('pendingDecisions');
                localStorage.removeItem('pendingDecisionCount');
                setDecisions(initialDecisions);
                setSelectedDecisionId(null);
                setShowOverrideModal(false);
                setOverrideTarget(null);
                window.dispatchEvent(new Event('aeonguard:pendingDecisionCount'));
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid rgba(255,50,50,0.3)',
                background: 'transparent',
                color: 'rgba(255,50,50,0.5)',
                fontFamily: 'monospace',
                fontSize: '10px',
                cursor: 'pointer',
                letterSpacing: '0.15em',
              }}
            >
              ↺ RESET SYSTEM DATA
            </button>
          </div>

          <div className="p-6 flex flex-col gap-10 min-h-[60vh]">
            <div className="flex gap-6 flex-wrap">
              {/* Left 40% */}
              <div className="w-full md:w-[40%] min-w-[280px] shrink-0">
                <div className="text-[clamp(0.65rem,0.75vw,0.8rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">
                  ── PENDING DECISIONS ──{' '}
                  <span style={{ color: '#ff4444' }}>{pendingCount} REQUIRE ATTENTION</span>
                </div>
                {decisions.map(decision => {
                  if (decision.status === 'PENDING') {
                    return (
                      <div
                        key={decision.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedDecisionId(decision.id)}
                        onKeyDown={e => e.key === 'Enter' && setSelectedDecisionId(decision.id)}
                        style={{
                          border: `1px solid ${selectedDecisionId === decision.id ? 'rgba(0,229,255,0.6)' : 'rgba(255,170,0,0.4)'}`,
                          background:
                            selectedDecisionId === decision.id ? 'rgba(0,229,255,0.08)' : 'rgba(255,170,0,0.05)',
                          padding: '16px',
                          marginBottom: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#ffaa00', fontWeight: 'bold' }}>{decision.id} · PENDING</span>
                          <span style={{ color: '#ff4444', fontSize: '10px' }}>{decision.riskLevel}</span>
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '11px' }}>
                          <div>Crisis: {decision.crisisLabel}</div>
                          <div>Location: {decision.location}</div>
                          <div style={{ color: '#00e5ff' }}>
                            Recommended wake: {decision.recommendedPerson} · {decision.recommendedPod}
                          </div>
                          <div>
                            Composite score:{' '}
                            <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{decision.score}</span> / 100
                          </div>
                          <div style={{ opacity: 0.5, fontSize: '10px' }}>Triggered: {decision.triggeredAt}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleAccept(decision.id);
                            }}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: 'rgba(0,255,136,0.1)',
                              border: '1px solid #00ff88',
                              color: '#00ff88',
                              fontFamily: 'monospace',
                              cursor: 'pointer',
                              letterSpacing: '0.2em',
                            }}
                          >
                            ✓ ACCEPT
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleOverrideClick(decision);
                            }}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: 'rgba(255,50,50,0.1)',
                              border: '1px solid #ff4444',
                              color: '#ff4444',
                              fontFamily: 'monospace',
                              cursor: 'pointer',
                              letterSpacing: '0.2em',
                            }}
                          >
                            ✕ OVERRIDE
                          </button>
                        </div>
                      </div>
                    );
                  }
                  const done = decision.status === 'ACCEPTED';
                  return (
                    <div
                      key={decision.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDecisionId(decision.id)}
                      onKeyDown={e => e.key === 'Enter' && setSelectedDecisionId(decision.id)}
                      style={{
                        border: `1px solid ${
                          selectedDecisionId === decision.id
                            ? 'rgba(0,229,255,0.55)'
                            : done
                              ? 'rgba(0,255,136,0.35)'
                              : 'rgba(255,0,0,0.35)'
                        }`,
                        background:
                          selectedDecisionId === decision.id
                            ? 'rgba(0,229,255,0.06)'
                            : done
                              ? 'rgba(0,255,136,0.04)'
                              : 'rgba(255,0,0,0.04)',
                        opacity: selectedDecisionId === decision.id ? 1 : 0.55,
                        padding: '16px',
                        marginBottom: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: done ? '#00ff88' : '#ff6666', fontWeight: 'bold', fontSize: '11px' }}>
                          {decision.id}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '2px 8px',
                            border: `1px solid ${done ? '#00ff88' : '#ff4444'}`,
                            color: done ? '#00ff88' : '#ff6666',
                          }}
                        >
                          {done ? '✓ ACCEPTED' : '✕ OVERRIDDEN'}
                        </span>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.7 }}>{decision.crisisLabel}</div>
                    </div>
                  );
                })}
              </div>

              {/* Right 60% */}
              <div className="flex-1 min-w-[min(100%,320px)]">
                {dec ? (
                  <div>
                    <div className="text-[clamp(0.65rem,0.75vw,0.8rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">
                      ── AI RECOMMENDATION SUMMARY ──
                    </div>
                    <div
                      style={{
                        border: '1px solid rgba(0,229,255,0.2)',
                        background: 'rgba(0,8,20,0.5)',
                        padding: '20px',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ fontSize: '12px', letterSpacing: '0.2em', marginBottom: '8px' }}>
                        CRISIS: {dec.crisisLabel}
                      </div>
                      <div style={{ fontSize: '11px', letterSpacing: '0.2em', marginBottom: '8px' }}>
                        LOCATION: {dec.location}
                      </div>
                      <div style={{ fontSize: '11px', letterSpacing: '0.2em', marginBottom: '8px' }}>
                        TIME TO FAILURE:{' '}
                        {dec.timeToFailure === 'RESOLVED' ? 'RESOLVED' : `${formatSeconds(failureSeconds)} ⏱`}
                      </div>
                      <div style={{ fontSize: '11px', letterSpacing: '0.2em', marginBottom: '8px' }}>
                        AFFECTED POPULATION: {dec.affectedPopulation.toLocaleString()}
                      </div>
                      <div style={{ marginTop: '16px', fontSize: '11px', color: '#00e5ff', letterSpacing: '0.15em' }}>
                        RECOMMENDED ACTION:
                        <br />
                        WAKE {dec.recommendedPerson} FROM {dec.recommendedPod}
                        <br />
                        ROLE: {dec.role}
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      {[
                        { label: 'BIOLOGICAL HEALTH', value: dec.bioScore, color: '#00e5ff' },
                        { label: 'SKILL MATCH', value: dec.skillScore, color: '#00ff88' },
                        { label: 'ROTATION EQUITY', value: dec.equityScore, color: '#ffaa00' },
                      ].map(bar => (
                        <div key={bar.label}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '10px', opacity: 0.6 }}>{bar.label}</span>
                            <span style={{ color: bar.color, fontWeight: 'bold' }}>{bar.value}/100</span>
                          </div>
                          <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', marginTop: '4px' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${bar.value}%`,
                                background: bar.color,
                                transition: 'width 1s ease',
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div
                      style={{
                        textAlign: 'center',
                        padding: '16px',
                        border: '1px solid rgba(0,229,255,0.2)',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ fontSize: '10px', opacity: 0.4, letterSpacing: '0.2em' }}>COMPOSITE SCORE</div>
                      <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#00ff88' }}>{dec.score}</div>
                      <div style={{ fontSize: '10px', opacity: 0.4 }}>/ 100</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAccept(dec.id)}
                      disabled={dec.status !== 'PENDING'}
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: 'rgba(0,255,136,0.1)',
                        border: '2px solid #00ff88',
                        color: '#00ff88',
                        fontFamily: 'monospace',
                        fontSize: 'clamp(0.8rem,1vw,1rem)',
                        letterSpacing: '0.3em',
                        cursor: dec.status === 'PENDING' ? 'pointer' : 'not-allowed',
                        marginBottom: '8px',
                        boxShadow: '0 0 15px rgba(0,255,136,0.2)',
                        opacity: dec.status === 'PENDING' ? 1 : 0.4,
                      }}
                    >
                      ✓ ACCEPT AI RECOMMENDATION
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOverrideClick(dec)}
                      disabled={dec.status !== 'PENDING'}
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: 'rgba(255,50,50,0.08)',
                        border: '1px solid rgba(255,50,50,0.4)',
                        color: '#ff6666',
                        fontFamily: 'monospace',
                        fontSize: 'clamp(0.8rem,1vw,1rem)',
                        letterSpacing: '0.3em',
                        cursor: dec.status === 'PENDING' ? 'pointer' : 'not-allowed',
                        opacity: dec.status === 'PENDING' ? 1 : 0.4,
                      }}
                    >
                      ✕ OVERRIDE DECISION
                    </button>
                  </div>
                ) : (
                  <div
                    className="h-full flex flex-col items-center justify-center text-center px-8 py-16 border border-cyan-500/10 bg-[rgba(0,0,0,0.2)]"
                    style={{ minHeight: '320px' }}
                  >
                    <div className="text-cyan-500/60 tracking-[0.2em] text-[clamp(0.65rem,0.8vw,0.85rem)]">
                      SELECT A PENDING DECISION FROM THE LEFT PANEL
                      <br />
                      TO VIEW DETAILS AND TAKE ACTION
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section A — History */}
            <div>
              <div className="text-[clamp(0.7rem,0.85vw,0.9rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">
                ── DECISION LOG ──
              </div>
              <div className="border border-cyan-500/10 bg-[rgba(0,0,0,0.2)] overflow-x-auto">
                <table className="w-full border-collapse font-mono text-[clamp(0.55rem,0.65vw,0.7rem)]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(0,229,255,0.15)' }}>
                      {['ID', 'TIME', 'CRISIS', 'RECOMMENDED', 'SCORE', 'ACTION', 'ADMIN'].map(h => (
                        <th key={h} className="text-left p-3 tracking-widest text-cyan-500/50">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(row => (
                      <tr key={row.id + row.time} style={{ borderBottom: '1px solid rgba(0,229,255,0.06)' }}>
                        <td className="p-3 opacity-80">{row.id}</td>
                        <td className="p-3 opacity-60">{row.time}</td>
                        <td className="p-3">{row.crisis}</td>
                        <td className="p-3 opacity-90">{row.person}</td>
                        <td className="p-3 text-[#00ff88]">{row.score}</td>
                        <td className="p-3">
                          <span
                            style={{
                              padding: '2px 8px',
                              fontSize: '10px',
                              letterSpacing: '0.15em',
                              border:
                                row.action === 'ACCEPTED'
                                  ? '1px solid rgba(0,255,136,0.5)'
                                  : '1px solid rgba(255,170,0,0.5)',
                              color: row.action === 'ACCEPTED' ? '#00ff88' : '#ffaa00',
                              background:
                                row.action === 'ACCEPTED' ? 'rgba(0,255,136,0.08)' : 'rgba(255,170,0,0.08)',
                            }}
                          >
                            {row.action}
                          </span>
                        </td>
                        <td className="p-3 opacity-50">{row.admin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section B — Statistics */}
            <div>
              <div className="text-[clamp(0.7rem,0.85vw,0.9rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">
                ── DECISION STATISTICS ──
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {[
                  { label: 'TOTAL DECISIONS', value: String(stats.total) },
                  { label: 'PENDING', value: String(stats.pending) },
                  { label: 'ACCEPTED', value: String(stats.accepted) },
                  { label: 'OVERRIDDEN', value: String(stats.overridden) },
                  { label: 'ACCEPT RATE', value: `${stats.acceptRate}%` },
                  { label: 'AVG RESPONSE', value: `${avgResponseMinutes.toFixed(1)} MIN` },
                ].map(box => (
                  <div key={box.label} className="min-w-0 border border-cyan-500/15 bg-[rgba(0,0,0,0.25)] p-3">
                    <div className="text-[9px] text-cyan-500/40 tracking-widest mb-1 leading-tight">{box.label}</div>
                    <div className="text-lg sm:text-xl font-bold text-cyan-300 truncate">{box.value}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="flex-1 min-h-[240px] border border-cyan-500/10 bg-[rgba(0,0,0,0.2)] p-4">
                  <div className="text-[10px] text-cyan-500/50 tracking-widest mb-2">STATUS MIX</div>
                  <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                    <PieChart>
                      <Pie
                        data={pieSlices}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={88}
                        paddingAngle={2}
                      >
                        {pieSlices.map(entry => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: '#000d1a',
                          border: '1px solid rgba(0,229,255,0.3)',
                          fontFamily: 'monospace',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 min-h-[240px] border border-cyan-500/10 bg-[rgba(0,0,0,0.2)] p-4">
                  <div className="text-[10px] text-cyan-500/50 tracking-widest mb-2">DECISIONS BY CRISIS TYPE</div>
                  <ResponsiveContainer width="100%" height="100%" minHeight={220}>
                    <BarChart data={crisisStats} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.12)" />
                      <XAxis dataKey="type" tick={{ fill: 'rgba(0,229,255,0.65)', fontSize: 10 }} />
                      <YAxis tick={{ fill: 'rgba(0,229,255,0.5)', fontSize: 10 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#000d1a',
                          border: '1px solid rgba(0,229,255,0.3)',
                          fontFamily: 'monospace',
                        }}
                      />
                      <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                        {crisisStats.map((row, i) => (
                          <Cell
                            key={row.type}
                            fill={['#00e5ff', '#00ff88', '#ffaa00', '#ff6644'][i] ?? '#00e5ff'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mb-6 border border-cyan-500/10 bg-[rgba(0,0,0,0.2)] p-4">
                <div className="text-[clamp(0.65rem,0.75vw,0.8rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-3">
                  ── RESPONSE TIME TREND ──
                </div>
                <div style={{ height: 150 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={responseTimeData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.12)" />
                      <XAxis dataKey="id" tick={{ fill: 'rgba(0,229,255,0.55)', fontSize: 9 }} interval={0} angle={-25} textAnchor="end" height={48} />
                      <YAxis
                        tick={{ fill: 'rgba(0,229,255,0.5)', fontSize: 10 }}
                        label={{ value: 'min', angle: -90, position: 'insideLeft', fill: 'rgba(0,229,255,0.45)', fontSize: 10 }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: '#000d1a',
                          border: '1px solid rgba(0,229,255,0.3)',
                          fontFamily: 'monospace',
                        }}
                        formatter={(v: number) => [`${v} min`, 'Response']}
                      />
                      <ReferenceLine
                        y={avgResponseMinutes}
                        stroke="#ffaa00"
                        strokeDasharray="5 5"
                        label={{ value: `avg ${avgResponseMinutes.toFixed(1)}`, fill: '#ffaa00', fontSize: 10 }}
                      />
                      <Line type="monotone" dataKey="time" stroke="#00e5ff" strokeWidth={2} dot={{ r: 3, fill: '#00ff88' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <div className="text-[clamp(0.65rem,0.75vw,0.8rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-3">
                  ── RISK LEVEL DISTRIBUTION ──
                </div>
                <div className="space-y-3 border border-cyan-500/10 bg-[rgba(0,0,0,0.2)] p-4">
                  {[
                    { label: 'CRITICAL', count: riskDistribution.crit, pct: riskDistribution.critPct, color: '#ff4444' },
                    { label: 'HIGH', count: riskDistribution.high, pct: riskDistribution.highPct, color: '#ffaa00' },
                    { label: 'MODERATE', count: riskDistribution.mod, pct: riskDistribution.modPct, color: '#00e5ff' },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex justify-between text-[10px] tracking-widest mb-1">
                        <span style={{ color: row.color }}>{row.label}</span>
                        <span className="text-cyan-500/70">
                          {row.pct}% · {row.count} decisions
                        </span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{ width: `${row.pct}%`, background: row.color, boxShadow: `0 0 8px ${row.color}55` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {showOverrideModal && overrideTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 'min(600px, 90vw)',
              border: '2px solid rgba(255,50,50,0.6)',
              background: '#000d1a',
              boxShadow: '0 0 40px rgba(255,0,0,0.3)',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,50,50,0.3)',
                background: 'rgba(255,0,0,0.08)',
              }}
            >
              <div
                style={{
                  color: '#ff4444',
                  fontWeight: 'bold',
                  fontSize: 'clamp(0.9rem,1.2vw,1.2rem)',
                  letterSpacing: '0.3em',
                }}
              >
                ⚠ OVERRIDE WARNING
              </div>
              <div style={{ color: 'rgba(255,100,100,0.6)', fontSize: '11px', marginTop: '4px', letterSpacing: '0.15em' }}>
                Read the full risk assessment before deciding
              </div>
            </div>

            <div
              ref={riskScrollRef}
              onScroll={handleRiskScroll}
              style={{ flex: 1, overflowY: 'auto', padding: '20px' }}
            >
              <div style={{ marginBottom: '16px' }}>
                <div style={{ color: '#ffaa00', fontSize: '11px', letterSpacing: '0.2em', marginBottom: '8px' }}>
                  ── IF YOU OVERRIDE THIS DECISION, EXPECTED CONSEQUENCES ──
                </div>
                {overrideTarget.riskDescription.map((risk, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '8px',
                      color: 'rgba(255,200,200,0.8)',
                      fontSize: '12px',
                      letterSpacing: '0.1em',
                    }}
                  >
                    <span style={{ color: '#ff4444', flexShrink: 0 }}>►</span>
                    <span>{risk}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  padding: '12px',
                  border: '1px solid rgba(255,50,50,0.3)',
                  background: 'rgba(255,0,0,0.05)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em' }}>
                    RISK LEVEL
                  </span>
                  <span style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '11px' }}>{overrideTarget.riskLevel}</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    style={{
                      height: '100%',
                      width:
                        overrideTarget.riskLevel === 'CRITICAL' ? '90%' : overrideTarget.riskLevel === 'HIGH' ? '65%' : '40%',
                      background: overrideTarget.riskLevel === 'CRITICAL' ? '#ff4444' : '#ffaa00',
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  padding: '12px',
                  border: '1px solid rgba(255,170,0,0.2)',
                  background: 'rgba(255,170,0,0.03)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.2em', marginBottom: '4px' }}>
                  ESTIMATED AFFECTED POPULATION
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffaa00' }}>
                  {overrideTarget.affectedPopulation.toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>PERSONS</div>
              </div>

              {!hasScrolledToBottom && (
                <div
                  style={{
                    textAlign: 'center',
                    color: 'rgba(255,100,100,0.5)',
                    fontSize: '10px',
                    letterSpacing: '0.2em',
                    animation: 'blink 1s infinite',
                  }}
                >
                  ↓ SCROLL TO READ FULL RISK BRIEF ↓
                </div>
              )}
            </div>

            <div
              style={{
                padding: '16px 20px',
                borderTop: '1px solid rgba(255,50,50,0.2)',
                display: 'flex',
                gap: '12px',
              }}
            >
              <button
                type="button"
                onClick={() => setShowOverrideModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(0,229,255,0.08)',
                  border: '1px solid rgba(0,229,255,0.3)',
                  color: '#00e5ff',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  letterSpacing: '0.2em',
                }}
              >
                ← CANCEL
              </button>
              <button
                type="button"
                onClick={() => handleConfirmOverride(overrideTarget.id)}
                disabled={!hasScrolledToBottom}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: hasScrolledToBottom ? 'rgba(255,50,50,0.15)' : 'rgba(255,50,50,0.05)',
                  border: `1px solid ${hasScrolledToBottom ? 'rgba(255,50,50,0.6)' : 'rgba(255,50,50,0.2)'}`,
                  color: hasScrolledToBottom ? '#ff4444' : 'rgba(255,50,50,0.3)',
                  fontFamily: 'monospace',
                  cursor: hasScrolledToBottom ? 'pointer' : 'not-allowed',
                  letterSpacing: '0.2em',
                }}
              >
                {hasScrolledToBottom ? '✕ CONFIRM OVERRIDE' : 'SCROLL TO READ FULL BRIEF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
