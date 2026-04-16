import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAeonStore } from '../store/aeonStore';
import {
  Terminal, Home, Database, AlertTriangle, Cpu, Zap, FileText, Users, ClipboardList, Settings, LogOut, RefreshCw, Languages, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer
} from 'recharts';

const crisisScenarios = [
  { id: 'oxygen',    icon: '💨', label: 'OXYGEN DEPLETION',    location: 'SECTOR B1-R2', severity: 'CRITICAL', color: '#ff4444' },
  { id: 'radiation', icon: '☢',  label: 'RADIATION SURGE',     location: 'SECTOR B3-E1', severity: 'WARNING',  color: '#ffaa00' },
  { id: 'power',     icon: '⚡',  label: 'POWER SYSTEM FAILURE', location: 'SECTOR B3-E2', severity: 'CRITICAL', color: '#ff4444' },
  { id: 'pressure',  icon: '🔴', label: 'PRESSURE ANOMALY',    location: 'SECTOR B2-I1', severity: 'WARNING',  color: '#ffaa00' },
];

const reasoningScripts: Record<string, string[]> = {
  oxygen: [
    '══════════════════════════════════════════',
    '  CRISIS ALERT RECEIVED',
    '══════════════════════════════════════════',
    '> TYPE: OXYGEN DEPLETION · SEVERITY: CRITICAL',
    '> LOCATION: SECTOR B1-R2 · RESIDENTIAL ZONE B',
    '> CURRENT O₂ LEVEL: 71.3% · THRESHOLD: 78.0%',
    '> TIME TO CRITICAL FAILURE: 01:30:00',
    '',
    '> INITIATING EMERGENCY SPECIALIST SCAN...',
    '> SCANNING 127 HIBERNATION PODS...',
    '> ████████████████████████████████ 100%',
    '',
    '══════════════════════════════════════════',
    '  STEP 1: CRISIS TYPE IDENTIFICATION',
    '══════════════════════════════════════════',
    '> ANALYZING CRISIS PARAMETERS...',
    '> REQUIRED EXPERTISE:',
    '>   · LIFE SUPPORT ENGINEERING (PRIMARY)',
    '>   · STRUCTURAL ENGINEERING (SECONDARY)',
    '>   · MEDICAL OFFICER (SUPPORT)',
    '',
    '══════════════════════════════════════════',
    '  STEP 2: SKILL MATCHING',
    '══════════════════════════════════════════',
    '> SEARCHING SPECIALIST DATABASE...',
    '> LIFE SUPPORT ENGINEERS FOUND: 14',
    '> STRUCTURAL ENGINEERS FOUND: 18',
    '> MEDICAL OFFICERS FOUND: 12',
    '> TOTAL CANDIDATES: 44',
    '',
    '══════════════════════════════════════════',
    '  STEP 3: THREE-DIMENSION EVALUATION',
    '══════════════════════════════════════════',
    '> DIMENSION 1: BIOLOGICAL HEALTH ASSESSMENT',
    '>   CHEN_WEI    ♥52 BPM  36.1°C  18% META  → BIO-SCORE: 94',
    '>   SMITH_J     ♥48 BPM  35.8°C  16% META  → BIO-SCORE: 88',
    '>   ZHANG_LI    ♥55 BPM  36.5°C  21% META  → BIO-SCORE: 76',
    '>   YANOV_K     ♥44 BPM  35.6°C  15% META  → BIO-SCORE: 91',
    '',
    '> DIMENSION 2: SKILL MATCH ASSESSMENT',
    '>   CHEN_WEI    LIFE SUPPORT · 12YR EXP    → SKILL-SCORE: 98 ★',
    '>   SMITH_J     LIFE SUPPORT · 8YR EXP     → SKILL-SCORE: 91',
    '>   ZHANG_LI    STRUCTURAL   · 15YR EXP    → SKILL-SCORE: 85',
    '>   YANOV_K     LIFE SUPPORT · 10YR EXP    → SKILL-SCORE: 93',
    '',
    '> DIMENSION 3: NATIONAL ROTATION EQUITY',
    '>   CHECKING ROTATION HISTORY...',
    '>   CHEN_WEI  [CN]  LAST ACTIVE: 47 DAYS AGO  → EQUITY: 87',
    '>   SMITH_J   [US]  LAST ACTIVE: 23 DAYS AGO  → EQUITY: 76',
    '>   ZHANG_LI  [CN]  LAST ACTIVE: 12 DAYS AGO  → EQUITY: 65',
    '>   YANOV_K   [RU]  LAST ACTIVE: 89 DAYS AGO  → EQUITY: 95',
    '',
    '══════════════════════════════════════════',
    '  STEP 4: COMPOSITE SCORING',
    '══════════════════════════════════════════',
    '> CALCULATING WEIGHTED SCORES...',
    '>   BIO(35%) + SKILL(40%) + EQUITY(25%)',
    '',
    '>   CHEN_WEI  94×0.35 + 98×0.40 + 87×0.25 = 93.6  ★ RANK #1',
    '>   YANOV_K   91×0.35 + 93×0.40 + 95×0.25 = 92.5    RANK #2',
    '>   SMITH_J   88×0.35 + 91×0.40 + 76×0.25 = 86.4    RANK #3',
    '>   ZHANG_LI  76×0.35 + 85×0.40 + 65×0.25 = 77.8    RANK #4',
    '',
    '══════════════════════════════════════════',
    '  STEP 5: FINAL RECOMMENDATION',
    '══════════════════════════════════════════',
    '> ┌─────────────────────────────────────┐',
    '> │  RECOMMENDED: CHEN_WEI · POD-047   │',
    '> │  COMPOSITE SCORE: 93.6 / 100       │',
    '> │  ROLE: LIFE SUPPORT ENGINEER       │',
    '> │  STATUS: DORMANT · READY FOR WAKE  │',
    '> └─────────────────────────────────────┘',
    '',
    '> ANALYSIS COMPLETE',
    '> FORWARDING TO HUMAN OVERRIDE PANEL...',
    '> ► DECISION QUEUE UPDATED [+1 PENDING]',
    '> AWAITING HUMAN AUTHORIZATION...',
    '> _',
  ],
  radiation: [
    '══════════════════════════════════════════',
    '  CRISIS ALERT RECEIVED',
    '══════════════════════════════════════════',
    '> TYPE: RADIATION SURGE · SEVERITY: WARNING',
    '> LOCATION: SECTOR B3-E1 · ENERGY ZONE A',
    '> CURRENT RAD: 89.3 mSv · THRESHOLD: 100 mSv',
    '',
    '> INITIATING SPECIALIST SCAN...',
    '> SCANNING 127 HIBERNATION PODS...',
    '> ████████████████████████████████ 100%',
    '',
    '> REQUIRED EXPERTISE: NUCLEAR ENGINEER · RADIATION SPECIALIST',
    '',
    '> DIMENSION 1: BIO ASSESSMENT',
    '>   YANOV_K     ♥44 BPM  35.6°C  → BIO-SCORE: 91',
    '>   MÜLLER_H    ♥47 BPM  36.0°C  → BIO-SCORE: 89',
    '',
    '> DIMENSION 2: SKILL MATCH',
    '>   YANOV_K     NUCLEAR ENG · 15YR EXP  → SKILL-SCORE: 97 ★',
    '>   MÜLLER_H    GEOLOGY     · 11YR EXP  → SKILL-SCORE: 82',
    '',
    '> DIMENSION 3: EQUITY CHECK',
    '>   YANOV_K   [RU]  LAST: 89 DAYS  → EQUITY: 95',
    '>   MÜLLER_H  [DE]  LAST: 34 DAYS  → EQUITY: 78',
    '',
    '> FINAL SCORE:',
    '>   YANOV_K   91×0.35+97×0.40+95×0.25 = 94.4  ★ RANK #1',
    '>   MÜLLER_H  89×0.35+82×0.40+78×0.25 = 83.6    RANK #2',
    '',
    '> ┌─────────────────────────────────────┐',
    '> │  RECOMMENDED: YANOV_K · POD-023    │',
    '> │  COMPOSITE SCORE: 94.4 / 100       │',
    '> └─────────────────────────────────────┘',
    '> FORWARDING TO HUMAN OVERRIDE PANEL...',
    '> ► DECISION QUEUE UPDATED [+1 PENDING]',
    '> _',
  ],
  power: [
    '> TYPE: POWER SYSTEM FAILURE · SEVERITY: CRITICAL',
    '> LOCATION: SECTOR B3-E2',
    '> REQUIRED: SYSTEMS ENGINEER · ELECTRICAL SPECIALIST',
    '',
    '> SCANNING CANDIDATES...',
    '>   GARCIA_M  SYSTEMS ENG  BIO:85  SKILL:94  EQ:82  → 87.8 ★',
    '>   KIM_S     NAVIGATION   BIO:91  SKILL:78  EQ:88  → 85.3',
    '',
    '> ┌─────────────────────────────────────┐',
    '> │  RECOMMENDED: GARCIA_M · POD-067   │',
    '> │  COMPOSITE SCORE: 87.8 / 100       │',
    '> └─────────────────────────────────────┘',
    '> FORWARDING TO HUMAN OVERRIDE PANEL...',
    '> ► DECISION QUEUE UPDATED [+1 PENDING]',
    '> _',
  ],
  pressure: [
    '> TYPE: PRESSURE ANOMALY · SEVERITY: WARNING',
    '> LOCATION: SECTOR B2-I1',
    '> REQUIRED: STRUCTURAL ENGINEER',
    '',
    '> SCANNING CANDIDATES...',
    '>   SMITH_J    STRUCTURAL   BIO:92  SKILL:95  EQ:88  → 91.5 ★',
    '>   CHEN_WEI   LIFE SUPPORT BIO:88  SKILL:79  EQ:76  → 81.4',
    '',
    '> ┌─────────────────────────────────────┐',
    '> │  RECOMMENDED: SMITH_J · POD-041    │',
    '> │  COMPOSITE SCORE: 91.5 / 100       │',
    '> └─────────────────────────────────────┘',
    '> FORWARDING TO HUMAN OVERRIDE PANEL...',
    '> ► DECISION QUEUE UPDATED [+1 PENDING]',
    '> _',
  ],
};

const historyData = [
  { time: '2H AGO',  crisis: 'OXYGEN DEPLETION',    recommended: 'CHEN_WEI',  score: 93.6, action: 'ACCEPTED' },
  { time: '6H AGO',  crisis: 'RADIATION SURGE',     recommended: 'YANOV_K',   score: 94.4, action: 'ACCEPTED' },
  { time: '1D AGO',  crisis: 'POWER FAILURE',       recommended: 'GARCIA_M',  score: 87.8, action: 'OVERRIDDEN' },
  { time: '3D AGO',  crisis: 'PRESSURE ANOMALY',    recommended: 'CHEN_WEI',  score: 92.8, action: 'ACCEPTED' },
  { time: '7D AGO',  crisis: 'OXYGEN DEPLETION',    recommended: 'SMITH_J',   score: 86.4, action: 'ACCEPTED' },
];

const candidateMaps: Record<string, any[]> = {
  oxygen: [
    { name: 'CHEN_WEI', role: 'LIFE SUPPORT ENGINEER', pod: 'POD-047', bio: 94, skill: 98, equity: 87, score: 93.6, rank: 1 },
    { name: 'YANOV_K',  role: 'LIFE SUPPORT ENGINEER', pod: 'POD-023', bio: 91, skill: 93, equity: 95, score: 92.5, rank: 2 },
    { name: 'SMITH_J',  role: 'LIFE SUPPORT ENGINEER', pod: 'POD-112', bio: 88, skill: 91, equity: 76, score: 86.4, rank: 3 },
    { name: 'ZHANG_LI', role: 'STRUCTURAL ENGINEER',   pod: 'POD-088', bio: 76, skill: 85, equity: 65, score: 77.8, rank: 4 },
  ],
  radiation: [
    { name: 'YANOV_K',  role: 'NUCLEAR ENGINEER', pod: 'POD-023', bio: 91, skill: 97, equity: 95, score: 94.4, rank: 1 },
    { name: 'MÜLLER_H', role: 'GEOLOGY',          pod: 'POD-055', bio: 89, skill: 82, equity: 78, score: 83.6, rank: 2 },
  ],
  power: [
    { name: 'GARCIA_M', role: 'SYSTEMS ENGINEER', pod: 'POD-067', bio: 85, skill: 94, equity: 82, score: 87.8, rank: 1 },
    { name: 'KIM_S',    role: 'NAVIGATION',       pod: 'POD-034', bio: 91, skill: 78, equity: 88, score: 85.3, rank: 2 },
  ],
  pressure: [
    { name: 'SMITH_J',  role: 'STRUCTURAL ENGINEER', pod: 'POD-041', bio: 92, skill: 95, equity: 88, score: 91.5, rank: 1 },
    { name: 'CHEN_WEI', role: 'LIFE SUPPORT ENGINEER', pod: 'POD-047', bio: 88, skill: 79, equity: 76, score: 81.4, rank: 2 },
  ]
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#000d1a] font-mono text-red-500">
          <div className="border border-red-500/30 bg-red-500/10 p-8">
            <h1 className="text-xl font-bold mb-4 text-[clamp(1rem,1.5vw,1.5rem)] tracking-[0.3em]">⚠ SYSTEM CRASH [MODULE: AI_ENGINE]</h1>
            <p className="text-[clamp(0.6rem,0.7vw,0.8rem)] opacity-80 uppercase tracking-widest">{String(this.state.error)}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AIEnginePage() {
  return (
    <ErrorBoundary>
      <AIEnginePageContent />
    </ErrorBoundary>
  );
}

function AIEnginePageContent() {
  const { addDecision, pendingDecisions } = useAeonStore();
  const pendingCount = pendingDecisions.filter(d => d.status === 'PENDING').length;
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [titleDone, setTitleDone] = useState(false);
  const fullTitle = 'AI推理引擎 · AI REASONING ENGINE';

  const [activeCrisisId, setActiveCrisisId] = useState<string | null>(null);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);

  const langLabels: Record<string, string> = { zh: '中文', en: 'ENG', mixed: '混合' };
  const currentLang = localStorage.getItem('lang') || 'zh';

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

  const startReasoning = (crisisId: string) => {
    if (isTyping) return;
    setActiveCrisisId(crisisId);
    const script = reasoningScripts[crisisId];
    if (!script) return;
    setDisplayedLines([]);
    setIsTyping(true);
    setCurrentStep(0);

    let lineIndex = 0;
    let cancelled = false;

    const addNextLine = () => {
      if (cancelled || cancelRef.current) return;
      if (lineIndex >= script.length) {
        setIsTyping(false);
        const topCandidate = candidateMaps[crisisId]?.[0];
        if (topCandidate) {
          addDecision({
            crisisId: crisisId,
            recommendedPod: topCandidate.pod,
            recommendedPerson: topCandidate.name,
            score: topCandidate.score,
            reason: `Composite Score: ${topCandidate.score}`,
          });

          const podRecommendations: Record<string, string> = {
            oxygen: 'POD-047',
            radiation: 'POD-023',
            power: 'POD-067',
            pressure: 'POD-041',
          };
          const podId = podRecommendations[crisisId];
          if (podId) {
            localStorage.setItem(`podOverride_${podId}`, 'WAKING');
          }
        }
        return;
      }
      const line = script[lineIndex];
      setDisplayedLines(prev => [...prev, line]);
      
      const stepMarkers = ['STEP 1', 'STEP 2', 'STEP 3', 'STEP 4', 'STEP 5'];
      stepMarkers.forEach((marker, i) => {
        if (line.includes(marker)) setCurrentStep(i + 1);
      });
      lineIndex++;
      
      const delay = line.includes('═') ? 50
        : line.includes('STEP') ? 400
        : line === '' ? 150
        : 80;
      setTimeout(addNextLine, delay);
    };

    setTimeout(addNextLine, 300);

    return () => { cancelled = true; };
  };

  useEffect(() => {
    const crisisType = localStorage.getItem('activeCrisisType');
    if (crisisType && reasoningScripts[crisisType]) {
      setActiveCrisisId(crisisType);
      setTimeout(() => {
        startReasoning(crisisType);
      }, 1000);
      // Optional: Clear it so we don't keep auto-starting on fresh navigations
      localStorage.removeItem('activeCrisisType');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aeonguard_auth');
    navigate('/');
  };
  const cycleLanguage = () => {
    const langs = ['zh', 'en', 'mixed'];
    const nextLang = langs[(langs.indexOf(currentLang) + 1) % langs.length];
    localStorage.setItem('lang', nextLang);
    window.location.reload();
  };

  const cancelRef = useRef<boolean>(false);

  useEffect(() => {
    return () => { cancelRef.current = true; };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayedLines]);

  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const nodes = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: 0.2 + Math.random() * 0.5,
      vy: (Math.random() - 0.5) * 0.1,
      r: Math.random() * 2 + 1
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x > canvas.width) node.x = 0;
        if (node.y < 0) node.y = canvas.height;
        if (node.y > canvas.height) node.y = 0;
      });

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(100, 100, 255, ${0.08 * (1 - dist / 100)})`;
            ctx.stroke();
          }
        }
      }

      nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(100,100,255,0.1)';
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const activeCrisis = activeCrisisId ? crisisScenarios.find(c => c.id === activeCrisisId) : null;
  const activeCandidates = activeCrisisId ? candidateMaps[activeCrisisId] || [] : [];
  const analysisComplete = !isTyping && displayedLines.length > 0;

  return (
    <div className="flex h-screen w-full flex-col bg-[#000d1a] font-mono text-cyan-400 selection:bg-cyan-500/30">
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      <canvas ref={bgCanvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      <nav className="fixed top-0 z-50 flex h-12 w-full items-center justify-between border-b border-cyan-500/30 bg-[#000d1a]/80 px-4 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
        <div className="flex items-center gap-2 font-bold tracking-[0.2em]">
          <Terminal size={18} className="text-cyan-400" />
          <span>AEONGUARD · 永卫系统</span>
        </div>
        <div className="flex-1 overflow-hidden mx-8 border-x border-cyan-500/10">
          <div className="animate-[ticker_60s_linear_infinite] whitespace-nowrap text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest text-cyan-500/80">
            {[0, 1].map(dup => (
              <React.Fragment key={dup}>
                <span className="mx-4">🟢 AI ENGINE: ONLINE</span>
                <span className="mx-4">🟢 SPECIALIST DB: 127/127 SYNCED</span>
                <span className="mx-4">🟢 QUEUE: {pendingCount} PENDING</span>
                <span className="mx-4">🟢 LAST CALC: 2.3s</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest">
          <div className="flex items-center gap-2 mr-2">
            <button onClick={() => window.location.reload()} className="p-1.5 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors text-cyan-400/60 hover:text-cyan-400">
              <RefreshCw size={14} />
            </button>
            <button onClick={cycleLanguage} className="flex items-center gap-2 px-3 py-1 border border-cyan-400/50 bg-cyan-400/5 text-cyan-400 hover:bg-cyan-400/10 transition-all">
              <Languages size={14} />
              <span>{langLabels[currentLang]}</span>
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

      <div className="flex flex-1 pt-12">
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
              {sidebarOpen && <div className="mb-2 text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold tracking-widest opacity-30">核心系统 CORE</div>}
              <ul className="space-y-1">
                <SidebarItem to="/dashboard" icon={<Home size={14} />} label="主页 HOME" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/pods" icon={<Database size={14} />} label="休眠舱监控 PODS" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/habitat" icon={<AlertTriangle size={14} />} label="环境警报 HABITAT" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/ai" icon={<Cpu size={14} />} label="AI推理引擎 AI ENGINE" active collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/override" icon={<Zap size={14} />} label="人工决策 OVERRIDE" badge={pendingCount} collapsed={!sidebarOpen} />
              </ul>
            </div>
            <div className="h-[1px] w-full bg-cyan-500/10" />
            <div>
              {sidebarOpen && <div className="mb-2 text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold tracking-widest opacity-30">档案 ARCHIVE</div>}
              <ul className="space-y-1">
                <SidebarItem to="/dashboard/mission" icon={<FileText size={14} />} label="任务档案 MISSION" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/crew" icon={<Users size={14} />} label="机组名单 CREW" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/syslog" icon={<ClipboardList size={14} />} label="系统日志 SYSLOG" collapsed={!sidebarOpen} />
              </ul>
            </div>
            <div className="h-[1px] w-full bg-cyan-500/10" />
            <SidebarItem to="/dashboard/settings" icon={<Settings size={14} />} label="设置 SETTINGS" collapsed={!sidebarOpen} />
          </div>
        </aside>

        <main className={`flex-1 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-[14vw]' : 'ml-[48px]'}`}>
          <div className="border-b border-cyan-500/20 bg-[#000814]/90 p-6 pb-4 relative z-10">
            <h1 className="text-[clamp(1.2rem,1.8vw,1.8rem)] font-bold tracking-[0.3em] text-cyan-400 mb-2">
              {displayedTitle}
              {!titleDone && <span style={{ animation: 'blink 0.8s infinite' }}>|</span>}
            </h1>
            <div className="text-[clamp(0.6rem,0.7vw,0.8rem)] tracking-[0.2em] text-cyan-500/50">
              AEONGUARD DECISION SUPPORT SYSTEM · SPECIALIST ALLOCATION MODULE
            </div>
          </div>

          <div className="flex bg-[#000d1a] relative z-10 border-b border-cyan-500/10" style={{ height: '500px' }}>
            {/* Left Panel - Crisis Selector */}
            <div className="w-[35%] p-6 border-r border-[#6464ff]/10 flex flex-col">
              <div className="text-[clamp(0.8rem,0.9vw,1rem)] font-bold tracking-[0.3em] text-[#6464ff] mb-6">
                ── SELECT CRISIS EVENT ──
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto px-1">
                {crisisScenarios.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => startReasoning(c.id)}
                    disabled={isTyping}
                    className={`w-full text-left p-3 border transition-all ${
                      isTyping ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-[#6464ff]/10'
                    } ${
                      activeCrisisId === c.id
                        ? 'border-[#6464ff] bg-[#6464ff]/10 shadow-[0_0_10px_rgba(100,100,255,0.2)]'
                        : 'border-cyan-500/20 bg-black/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{c.icon}</span>
                      <div className="flex-1">
                        <div className="text-[clamp(0.7rem,0.8vw,0.9rem)] font-bold tracking-widest mb-1 text-cyan-100">{c.label}</div>
                        <div className="text-[clamp(0.55rem,0.65vw,0.7rem)] text-cyan-500/50 uppercase tracking-widest">{c.location}</div>
                      </div>
                      <span className={`text-[clamp(0.5rem,0.6vw,0.65rem)] font-bold px-2 py-1 border tracking-widest ${
                        c.severity === 'CRITICAL' ? 'text-red-400 border-red-500/30' : 'text-amber-400 border-amber-500/30'
                      }`}>
                        {c.severity}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 border border-cyan-500/20 bg-black/50 p-4">
                <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-3">
                  ── ACTIVE CRISIS ──
                </div>
                {activeCrisis ? (
                  <div>
                    <div className="font-bold text-cyan-300 text-[clamp(0.8rem,0.9vw,1rem)] mb-2 flex items-center gap-2">
                      {activeCrisis.icon} {activeCrisis.label}
                    </div>
                    <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] text-cyan-500/60 tracking-widest space-y-1 mb-4">
                      <div>LOCATION: {activeCrisis.location}</div>
                      <div>TRIGGERED: 0.0s AGO</div>
                      <div className="flex items-center gap-2 mt-1">
                        STATUS: 
                        <span className="text-[#00e5ff] font-bold" style={isTyping ? { animation: 'blink 1s infinite' } : {}}>
                          {isTyping ? 'ANALYZING...' : 'RESOLVED'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-[clamp(0.55rem,0.6vw,0.65rem)] text-cyan-500/40 tracking-widest mb-1">ANALYSIS PROGRESS</div>
                      <div className="font-mono text-[clamp(0.7rem,0.8vw,0.9rem)] text-[#6464ff] mb-1">
                        [{Array.from({ length: 16 }).map((_, i) => i < (currentStep / 5) * 16 ? '█' : '░').join('')}] {Math.round((currentStep / 5) * 100)}%
                      </div>
                      <div className="text-[clamp(0.55rem,0.6vw,0.65rem)] text-cyan-500/50 tracking-widest">
                        {currentStep > 0 ? `STEP ${currentStep} OF 5` : 'AWAITING START'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[clamp(0.6rem,0.7vw,0.8rem)] text-cyan-500/50 tracking-widest">
                    SYSTEM STANDBY · SELECT A CRISIS TO BEGIN ANALYSIS
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Terminal */}
            <div className="w-[65%] flex flex-col p-6">
              <div className="text-[clamp(0.8rem,0.9vw,1rem)] font-bold tracking-[0.3em] text-[#6464ff] mb-4">
                ── AEONGUARD AI · 推理终端 ──
              </div>
              <div ref={terminalRef} style={{ height: '500px', overflowY: 'auto' }} className="p-4 bg-[rgba(0,0,0,0.6)] border border-[rgba(100,100,255,0.15)] font-mono text-[clamp(0.55rem,0.7vw,0.75rem)] leading-[1.8] custom-scrollbar">
                {displayedLines.length === 0 ? (
                  <div className="text-[#6464ff]/80">
                    <div>AEONGUARD AI ENGINE v4.7</div>
                    <div>═══════════════════════════════════</div>
                    <div>SYSTEM STATUS: ONLINE</div>
                    <div>SPECIALIST DATABASE: 127 PODS LOADED</div>
                    <div>EVALUATION MODULES: READY</div>
                    <br />
                    <div>AWAITING CRISIS INPUT...</div>
                    <div className="text-[#00e5ff] mt-2" style={{ animation: 'blink 0.8s infinite' }}>{'> _'}</div>
                  </div>
                ) : (
                  <>
                    {displayedLines.map((line, i) => (
                      <div key={i} style={{
                        color: line.includes('RECOMMENDED') || line.includes('★') ? '#00ff88'
                          : line.includes('CRISIS') || line.includes('CRITICAL') ? '#ff4444'
                          : line.includes('WARNING') ? '#ffaa00'
                          : line.includes('══') ? 'rgba(100,100,255,0.6)'
                          : line.includes('STEP') ? '#6464ff'
                          : 'rgba(0,229,255,0.8)',
                        fontWeight: line.includes('RECOMMENDED') || line.includes('══') ? 'bold' : 'normal',
                      }}>
                        {line || '\u00A0'}
                      </div>
                    ))}
                    {isTyping && <div className="text-[#00e5ff] mt-2 inline-block" style={{ animation: 'blink 0.8s infinite' }}>▋</div>}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* BELOW MAIN LAYOUT */}
          <div className="bg-[#000d1a] relative z-10">
            {/* Section A */}
            {analysisComplete && activeCandidates.length > 0 && (
              <div className="p-6 border-b border-cyan-500/10 fade-in">
                <div className="text-[clamp(0.8rem,0.9vw,1rem)] font-bold tracking-[0.3em] text-[#6464ff] mb-6">
                  ── 推荐唤醒名单 · RECOMMENDED WAKE LIST ──
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                  {activeCandidates.map((c) => (
                    <div key={c.name} className={`min-w-[280px] p-4 border bg-black/40 relative ${c.rank === 1 ? 'border-[#00ff88]/50 shadow-[0_0_15px_rgba(0,255,136,0.1)]' : 'border-cyan-500/20'}`}>
                      <div className="absolute top-0 right-0 px-2 py-1 text-[clamp(0.6rem,0.7vw,0.8rem)] font-bold" style={{
                        backgroundColor: c.rank === 1 ? '#00ff88' : 'rgba(0,229,255,0.1)',
                        color: c.rank === 1 ? '#000' : 'rgba(0,229,255,0.5)'
                      }}>
                        #{c.rank}
                      </div>
                      <div className="mb-4 pr-8">
                        <div className="text-[clamp(0.8rem,0.9vw,1rem)] font-bold text-cyan-200">{c.name}</div>
                        <div className="text-[clamp(0.55rem,0.6vw,0.7rem)] text-cyan-500/50 tracking-widest">{c.role} · {c.pod}</div>
                      </div>
                      
                      <div className="flex mb-4 gap-4">
                        <div className="w-[80px] h-[80px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius="80%" data={[
                              { subject: 'BIO', A: c.bio, fullMark: 100 },
                              { subject: 'SKILL', A: c.skill, fullMark: 100 },
                              { subject: 'EQT', A: c.equity, fullMark: 100 }
                            ]}>
                              <PolarGrid stroke="rgba(0,229,255,0.1)" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(0,229,255,0.4)', fontSize: 8 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                              <Radar dataKey="A" stroke={c.rank === 1 ? '#00ff88' : '#6464ff'} fill={c.rank === 1 ? '#00ff88' : '#6464ff'} fillOpacity={0.3} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 flex flex-col justify-center space-y-2">
                          <div className="text-right">
                            <div className="text-[clamp(0.5rem,0.55vw,0.6rem)] text-cyan-500/40">COMPOSITE</div>
                            <div className={`text-2xl font-bold ${c.rank === 1 ? 'text-[#00ff88]' : 'text-cyan-400'}`}>{c.score}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-[clamp(0.55rem,0.6vw,0.65rem)]">
                        <div className="flex items-center gap-2">
                          <span className="w-8 opacity-50">BIO</span>
                          <div className="flex-1 h-1 bg-black/50 border border-cyan-500/20">
                            <div className="h-full bg-cyan-400/50" style={{ width: `${c.bio}%` }} />
                          </div>
                          <span className="w-6 text-right text-cyan-300">{c.bio}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-8 opacity-50">SKL</span>
                          <div className="flex-1 h-1 bg-black/50 border border-cyan-500/20">
                            <div className="h-full bg-cyan-400/50" style={{ width: `${c.skill}%` }} />
                          </div>
                          <span className="w-6 text-right text-cyan-300">{c.skill}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-8 opacity-50">EQT</span>
                          <div className="flex-1 h-1 bg-black/50 border border-cyan-500/20">
                            <div className="h-full bg-cyan-400/50" style={{ width: `${c.equity}%` }} />
                          </div>
                          <span className="w-6 text-right text-cyan-300">{c.equity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex p-6 border-b border-cyan-500/10 pb-12 gap-8">
              {/* Section B */}
              <div className="w-[60%] border border-cyan-500/20 bg-black/30 p-4">
                <div className="text-[clamp(0.7rem,0.8vw,0.9rem)] font-bold tracking-[0.2em] text-[#6464ff] mb-4">
                  ── REASONING HISTORY · 历史记录 ──
                </div>
                <div className="space-y-2">
                  {historyData.map((h, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-cyan-500/10 pb-2 text-[clamp(0.6rem,0.7vw,0.75rem)] tracking-widest">
                      <div className="w-16 text-cyan-500/40">{h.time}</div>
                      <div className="flex-1 text-cyan-200">{h.crisis}</div>
                      <div className="w-32 text-cyan-400">{h.recommended}</div>
                      <div className="w-16 text-right text-cyan-500/60 mr-4">{h.score}</div>
                      <div className={`w-24 text-center px-1 py-0.5 border text-[clamp(0.5rem,0.55vw,0.6rem)] ${
                        h.action === 'ACCEPTED' ? 'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                      }`}>
                        {h.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section C */}
              <div className="w-[40%] flex flex-col gap-4">
                <div className="text-[clamp(0.7rem,0.8vw,0.9rem)] font-bold tracking-[0.2em] text-[#6464ff] mb-0">
                  ── ENGINE STATISTICS · 系统统计 ──
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-cyan-500/20 bg-black/30 p-4 flex flex-col justify-center items-center text-center">
                    <div className="text-[clamp(0.55rem,0.6vw,0.7rem)] text-cyan-500/50 mb-1 tracking-widest">TOTAL ANALYSES</div>
                    <div className="text-2xl font-bold text-cyan-300">47</div>
                  </div>
                  <div className="border border-cyan-500/20 bg-black/30 p-4 flex flex-col justify-center items-center text-center">
                    <div className="text-[clamp(0.55rem,0.6vw,0.7rem)] text-cyan-500/50 mb-1 tracking-widest">ACCEPTANCE RATE</div>
                    <div className="text-2xl font-bold text-[#00ff88]">89.4%</div>
                  </div>
                  <div className="border border-cyan-500/20 bg-black/30 p-4 flex flex-col justify-center items-center text-center">
                    <div className="text-[clamp(0.55rem,0.6vw,0.7rem)] text-cyan-500/50 mb-1 tracking-widest">AVG ANALYSIS TIME</div>
                    <div className="text-2xl font-bold text-cyan-300">2.3s</div>
                  </div>
                  <div className="border border-cyan-500/20 bg-black/30 p-4 flex flex-col justify-center items-center text-center">
                    <div className="text-[clamp(0.55rem,0.6vw,0.7rem)] text-cyan-500/50 mb-1 tracking-widest">SPECIALISTS WOKEN</div>
                    <div className="text-2xl font-bold text-cyan-300">23</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
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
