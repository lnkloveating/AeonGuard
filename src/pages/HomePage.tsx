import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Languages
} from 'lucide-react';
import { motion } from 'motion/react';
import EarthScene from '../components/EarthScene';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function HomePage() {
  const navigate = useNavigate();

  const heroFullText = '流浪地球计划 · WANDERING EARTH PROJECT';
  const [heroDisplayed, setHeroDisplayed] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [scanningCard, setScanningCard] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setHeroDisplayed(heroFullText.slice(0, i));
      if (i >= heroFullText.length) {
        clearInterval(iv);
        setTimeout(() => setShowCursor(false), 2000);
      }
    }, 60);
    return () => clearInterval(iv);
  }, []);

  const [tickerStats, setTickerStats] = useState({
    engine: 98.4,
    pods: 127,
    oxygen: 85,
    temp: -272
  });

  const [healthStats, setHealthStats] = useState({
    cpu: 78,
    mem: 61,
    pwr: 94,
    net: 32
  });

  const [engineGroups, setEngineGroups] = useState([94, 98, 91, 99]);
  const [now, setNow] = useState(new Date());
  const [countdown, setCountdown] = useState({ d: 43, h: 6, m: 22, s: 14 });
  const [habitatPop, setHabitatPop] = useState(3.500);
  const [coreTemp, setCoreTemp] = useState(500);

  const engineHistory = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}h`,
      e1: 88 + Math.sin(i * 0.4) * 6 + Math.random() * 2,
      e2: 92 + Math.sin(i * 0.3 + 1) * 5 + Math.random() * 2,
      e3: 86 + Math.sin(i * 0.5 + 2) * 7 + Math.random() * 2,
      e4: 94 + Math.sin(i * 0.35 + 0.5) * 4 + Math.random() * 2,
    }));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerStats(prev => ({
        engine: +(prev.engine + (Math.random() * 0.4 - 0.2)).toFixed(1),
        pods: prev.pods,
        oxygen: +(prev.oxygen + (Math.random() * 0.2 - 0.1)).toFixed(1),
        temp: prev.temp + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)
      }));
      setHealthStats(prev => ({
        cpu: Math.min(100, Math.max(0, prev.cpu + Math.floor(Math.random() * 6 - 3))),
        mem: Math.min(100, Math.max(0, prev.mem + Math.floor(Math.random() * 4 - 2))),
        pwr: Math.min(100, Math.max(0, prev.pwr + Math.floor(Math.random() * 2 - 1))),
        net: Math.min(100, Math.max(0, prev.net + Math.floor(Math.random() * 10 - 5))),
      }));
      setEngineGroups(prev => prev.map(val =>
        Math.min(100, Math.max(85, val + (Math.random() * 4 - 2)))
      ));
      setHabitatPop(+(3.500 + (Math.random() * 0.002 - 0.001)).toFixed(3));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setCoreTemp(480 + Math.floor(Math.random() * 41));
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
      setCountdown(prev => {
        let { d, h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; d--; }
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- System Pulse canvas ---
  const pulseCanvasRef = useRef<HTMLCanvasElement>(null);
  const pulseAnimRef = useRef<number>(0);

  useEffect(() => {
    const canvas = pulseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;
    let offset = 0;

    const draw = () => {
      const cw = w();
      const ch = h();
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      for (let x = 0; x < cw; x++) {
        const t = (x + offset) * 0.04;
        const base = Math.sin(t) * (ch * 0.25);
        const spike = Math.sin(t * 3.7) > 0.85 ? Math.sin(t * 7) * (ch * 0.3) : 0;
        const noise = (Math.sin(t * 13.3) + Math.sin(t * 7.1)) * 2;
        const y = ch / 2 + base + spike + noise;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      offset += 1.5;
      pulseAnimRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(pulseAnimRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // --- Dramatic space background canvas ---
  const spaceCanvasRef = useRef<HTMLCanvasElement>(null);
  const spaceAnimRef = useRef<number>(0);

  useEffect(() => {
    const canvas = spaceCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cw = 0, ch = 0;
    const resize = () => {
      cw = window.innerWidth;
      ch = window.innerHeight;
      canvas.width = cw;
      canvas.height = ch;
    };
    resize();
    window.addEventListener('resize', resize);

    // Layer 1 — Stars
    const tinyStars = Array.from({ length: 150 }, () => ({
      x: Math.random() * cw, y: Math.random() * ch,
      twinkleSpeed: 0.5 + Math.random() * 2,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));
    const mediumStars = Array.from({ length: 60 }, () => ({
      x: Math.random() * cw, y: Math.random() * ch,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
    }));
    const brightStars = Array.from({ length: 20 }, () => ({
      x: Math.random() * cw, y: Math.random() * ch,
    }));

    // Layer 2 — Nebula clouds
    const nebulae = [
      { x: 0.15, y: 0.25, r: 250, color: [0, 30, 80, 0.15] as [number, number, number, number], phaseOff: 0 },
      { x: 0.75, y: 0.15, r: 300, color: [40, 0, 80, 0.12] as [number, number, number, number], phaseOff: 2 },
      { x: 0.55, y: 0.70, r: 220, color: [0, 80, 100, 0.10] as [number, number, number, number], phaseOff: 4 },
      { x: 0.25, y: 0.80, r: 280, color: [0, 60, 60, 0.12] as [number, number, number, number], phaseOff: 6 },
    ];

    // Layer 3 — Shooting stars
    type ShootingStar = { x: number; y: number; life: number; maxLife: number; speed: number; angle: number };
    let shootingStars: ShootingStar[] = [];
    let nextShootTime = performance.now() + 2000 + Math.random() * 3000;

    let frame = 0;

    const draw = (timestamp: number) => {
      ctx.clearRect(0, 0, cw, ch);
      frame++;
      const t = timestamp / 1000;

      // --- Layer 2: Nebula clouds (drawn first, behind stars) ---
      for (const n of nebulae) {
        const pulse = 0.8 + 0.4 * ((Math.sin((t + n.phaseOff) * (Math.PI / 4)) + 1) / 2);
        const [r, g, b, a] = n.color;
        const grad = ctx.createRadialGradient(n.x * cw, n.y * ch, 0, n.x * cw, n.y * ch, n.r);
        grad.addColorStop(0, `rgba(${r},${g},${b},${(a * pulse).toFixed(3)})`);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(n.x * cw - n.r, n.y * ch - n.r, n.r * 2, n.r * 2);
      }

      // --- Layer 1: Tiny stars (twinkle) ---
      for (const s of tinyStars) {
        const opacity = 0.3 + 0.7 * ((Math.sin(t * s.twinkleSpeed + s.twinkleOffset) + 1) / 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity.toFixed(2)})`;
        ctx.fillRect(s.x - 0.5, s.y - 0.5, 1, 1);
      }

      // --- Layer 1: Medium stars (drift) ---
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      for (const s of mediumStars) {
        s.x += s.vx; s.y += s.vy;
        if (s.x < 0) s.x = cw; if (s.x > cw) s.x = 0;
        if (s.y < 0) s.y = ch; if (s.y > ch) s.y = 0;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Layer 1: Bright stars (cross flare) ---
      for (const s of brightStars) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(s.x - 6, s.y); ctx.lineTo(s.x + 6, s.y);
        ctx.moveTo(s.x, s.y - 6); ctx.lineTo(s.x, s.y + 6);
        ctx.stroke();
      }

      // --- Layer 3: Shooting stars ---
      if (timestamp >= nextShootTime) {
        const edge = Math.random();
        shootingStars.push({
          x: edge < 0.5 ? Math.random() * cw : 0,
          y: edge < 0.5 ? 0 : Math.random() * ch * 0.5,
          life: 0,
          maxLife: 0.8,
          speed: 6 + Math.random() * 4,
          angle: Math.PI / 4 + (Math.random() - 0.5) * 0.4,
        });
        nextShootTime = timestamp + 4000 + Math.random() * 2000;
      }
      shootingStars = shootingStars.filter(s => s.life < s.maxLife);
      for (const s of shootingStars) {
        s.life += 1 / 60;
        const dx = Math.cos(s.angle) * s.speed;
        const dy = Math.sin(s.angle) * s.speed;
        s.x += dx; s.y += dy;
        const progress = s.life / s.maxLife;
        const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
        const tailLen = 80;
        const grad = ctx.createLinearGradient(
          s.x, s.y,
          s.x - Math.cos(s.angle) * tailLen,
          s.y - Math.sin(s.angle) * tailLen,
        );
        grad.addColorStop(0, `rgba(255,255,255,${(alpha * 0.9).toFixed(2)})`);
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - Math.cos(s.angle) * tailLen, s.y - Math.sin(s.angle) * tailLen);
        ctx.stroke();
      }

      // --- Layer 4: Scan line ---
      const scanCycle = 12;
      const scanY = ((t % scanCycle) / scanCycle) * ch;
      ctx.fillStyle = 'rgba(0,229,255,0.06)';
      ctx.fillRect(0, scanY, cw, 2);

      spaceAnimRef.current = requestAnimationFrame(draw);
    };
    spaceAnimRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(spaceAnimRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('aeonguard_auth');
    navigate('/');
  };

  const cycleLanguage = () => {
    const langs = ['zh', 'en', 'mixed'];
    const currentLang = localStorage.getItem('lang') || 'zh';
    const nextLang = langs[(langs.indexOf(currentLang) + 1) % langs.length];
    localStorage.setItem('lang', nextLang);
    window.location.reload();
  };

  const handleCardClick = (index: number, route: string) => {
    if (scanningCard !== null) return;
    setScanningCard(index);
    setTimeout(() => {
      setScanningCard(null);
      navigate(route);
    }, 400);
  };

  const langLabels: Record<string, string> = { zh: '中文', en: 'ENG', mixed: '混合' };
  const currentLang = localStorage.getItem('lang') || 'zh';

  return (
    <div className="flex h-screen w-full flex-col bg-[#000d1a] font-mono text-cyan-400 selection:bg-cyan-500/30">
      {/* Space Background */}
      <canvas ref={spaceCanvasRef} className="fixed inset-0 z-0 pointer-events-none" />

      {/* Hex Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="h-full w-full opacity-40" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 104l30-17.32V17.32L30 0 0 17.32v69.36L30 104zM30 101.15L2.5 85.27V18.73L30 2.85l27.5 15.88v66.54l-27.5 15.88z' fill='rgba(0, 229, 255, 0.04)' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 104px'
        }} />
      </div>

      {/* Top Navbar */}
      <nav className="fixed top-0 z-50 flex h-12 w-full items-center justify-between border-b border-cyan-500/30 bg-[#000d1a]/80 px-4 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
        <div className="flex items-center gap-2 font-bold tracking-[0.2em]">
          <Terminal size={18} className="text-cyan-400" />
          <span>AEONGUARD · 永卫系统</span>
        </div>
        <div className="flex-1 overflow-hidden mx-8 border-x border-cyan-500/10">
          <div className="animate-[ticker_60s_linear_infinite] whitespace-nowrap text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest text-cyan-500/80">
            {[0, 1].map(dup => (
              <React.Fragment key={dup}>
                <span className="mx-4">🟢 引擎输出: {tickerStats.engine}%</span>
                <span className="mx-4 text-amber-400">⚠ WARNING: EXTERNAL TEMP -272°C · HULL BREACH RISK: NONE</span>
                <span className="mx-4">🟢 休眠舱: {tickerStats.pods}/127</span>
                <span className="mx-4">► NEXT GRAVITATIONAL ASSIST: JUPITER +127 DAYS</span>
                <span className="mx-4">🟢 氧气: {tickerStats.oxygen}%</span>
                <span className="mx-4">► FUSION REACTOR OUTPUT: STABLE · CORE TEMP: 5,500°C</span>
                <span className="mx-4">🟢 位置: 距太阳 0.8 光年</span>
                <span className="mx-4">► SURFACE: UNINHABITABLE · POPULATION UNDERGROUND: 3.5 BILLION</span>
                <span className="mx-4">🟢 外部温度: {tickerStats.temp}°C</span>
                <span className="mx-4">► DISTANCE FROM SOL: 0.8 LY · HEADING: PROXIMA CENTAURI · ETA: 1,653 YEARS</span>
                <span className="mx-4">🟢 下次轮换: 43天</span>
                <span className="mx-4">► ALL CREW HIBERNATION PODS NOMINAL · NEXT ROTATION: 43 DAYS</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest">
          <div className="flex items-center gap-2 mr-2">
            <button onClick={() => window.location.reload()} className="p-1.5 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors text-cyan-400/60 hover:text-cyan-400">
              <RefreshCw size={14} />
            </button>
            <button onClick={cycleLanguage} className="flex items-center gap-2 px-3 py-1 border border-cyan-400/50 bg-cyan-400/5 text-cyan-400 hover:bg-cyan-400/10 transition-all font-mono">
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
        {/* Left Sidebar */}
        <aside className={`fixed left-0 h-full border-r border-cyan-500/30 bg-[#000d1a]/95 z-40 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[14vw] min-w-[160px] max-w-[220px] p-4' : 'w-[48px] p-2'}`}>
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
                <SidebarItem to="/dashboard" icon={<Home size={14} />} label="主页 HOME" active collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/pods" icon={<Database size={14} />} label="休眠舱监控 PODS" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/habitat" icon={<AlertTriangle size={14} />} label="环境警报 HABITAT" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/ai" icon={<Cpu size={14} />} label="AI推理引擎 AI ENGINE" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/override" icon={<Zap size={14} />} label="人工决策 OVERRIDE" badge={2} collapsed={!sidebarOpen} />
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
            {sidebarOpen && (
              <div className="space-y-3">
                <div className="text-[clamp(0.5625rem,0.625vw,0.8125rem)] font-bold tracking-[0.2em] text-center opacity-40">── SYSTEM HEALTH ──</div>
                <div className="space-y-2">
                  <HealthBar label="CPU" value={healthStats.cpu} />
                  <HealthBar label="MEM" value={healthStats.mem} />
                  <HealthBar label="PWR" value={healthStats.pwr} />
                  <HealthBar label="NET" value={healthStats.net} />
                </div>
              </div>
            )}
            {sidebarOpen && <div className="h-[1px] w-full bg-cyan-500/10" />}
            {sidebarOpen && (
              <div className="space-y-3">
                <div className="text-[clamp(0.5625rem,0.625vw,0.8125rem)] font-bold tracking-[0.2em] text-center opacity-40">── SHIP TIME ──</div>
                <div className="text-center space-y-1">
                  <div className="text-[clamp(1rem,1.2vw,1.25rem)] font-bold tracking-[0.1em] text-cyan-400">
                    {now.toLocaleTimeString('en-GB', { hour12: false })}
                  </div>
                  <div className="text-[clamp(0.5625rem,0.625vw,0.8125rem)] tracking-[0.2em] opacity-60">YEAR 847 · DAY 12,403</div>
                </div>
                <div className="pt-2 text-center">
                  <div className="text-[clamp(0.5rem,0.55vw,0.6875rem)] tracking-[0.2em] opacity-40 mb-1">NEXT CREW ROTATION</div>
                  <div className="text-[clamp(0.625rem,0.8vw,0.8125rem)] font-bold text-amber-500/80 tracking-widest">
                    {countdown.d}D {String(countdown.h).padStart(2, '0')}H {String(countdown.m).padStart(2, '0')}M {String(countdown.s).padStart(2, '0')}S
                  </div>
                </div>
              </div>
            )}
            {sidebarOpen && <div className="h-[1px] w-full bg-cyan-500/10" />}
            <SidebarItem to="/dashboard/settings" icon={<Settings size={14} />} label="设置 SETTINGS" collapsed={!sidebarOpen} />
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden bg-[#000d1a] transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-[14vw]' : 'ml-[48px]'}`}>

          {/* Section 1: Hero */}
          <section className="relative flex h-[calc(100vh-48px)] flex-col p-8 overflow-hidden">
            {/* Title */}
            <div className="w-full flex flex-col items-center mb-6 z-10">
              <h2 className="text-[clamp(1.75rem,2.5vw,2.5rem)] font-bold tracking-[0.3em] text-cyan-400">
                {heroDisplayed}
                {showCursor && <span className="inline-block animate-[blink_0.8s_infinite]">|</span>}
              </h2>
              <div className="h-[1px] w-full max-w-5xl bg-cyan-400/30 mt-3 shadow-[0_0_10px_rgba(0,229,255,0.2)]" />
            </div>

            {/* Two columns */}
            <div className="flex-1 flex w-full gap-6 min-h-0">
              {/* Left: 3D Earth (60%) */}
              <div className="w-[58vw] relative rounded-sm overflow-hidden border border-cyan-500/10">
                <EarthScene width="100%" height="100%" />
              </div>

              {/* Right: Navigation Status (40%) */}
              <div className="w-[28vw] flex flex-col border border-cyan-500/20 bg-[#000814]/90 overflow-hidden">
                <div className="p-3 border-b border-cyan-500/10 text-[clamp(0.5625rem,0.625vw,0.8125rem)] font-bold tracking-[0.2em] text-cyan-500/40 text-center">
                  ── NAVIGATION STATUS ──
                </div>
                <div className="flex-1 flex flex-col p-4 min-h-0">
                  {/* Star map */}
                  <div className="flex-1 relative mb-4 border border-cyan-500/10 bg-black/40 overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 200 170">
                      {/* Grid */}
                      {[...Array(5)].map((_, i) => (
                        <React.Fragment key={i}>
                          <line x1="0" y1={i * 32} x2="200" y2={i * 32} stroke="rgba(6,182,212,0.05)" strokeWidth="0.5" />
                          <line x1={i * 40} y1="0" x2={i * 40} y2="160" stroke="rgba(6,182,212,0.05)" strokeWidth="0.5" />
                        </React.Fragment>
                      ))}

                      {/* Background stars — 35 fixed-seed positions */}
                      {[
                        [12,8],[45,14],[78,5],[112,22],[155,11],[188,18],[23,38],[67,42],[134,35],
                        [170,45],[9,62],[52,58],[95,50],[143,55],[180,68],[30,88],[85,95],[120,92],
                        [160,85],[15,110],[55,118],[100,105],[140,115],[175,108],[35,135],[75,128],
                        [110,140],[150,132],[190,145],[5,148],[48,150],[90,155],[128,148],[165,152],[195,30]
                      ].map(([cx, cy], i) => (
                        <circle key={`bg-${i}`} cx={cx} cy={cy}
                          r={0.5 + ((i * 7 + 3) % 4) * 0.5}
                          fill="white"
                          opacity={0.15 + ((i * 13 + 5) % 6) * 0.05}
                        />
                      ))}

                      {/* Faint planned trajectory (offset y-8) */}
                      <line x1="25" y1="72" x2="175" y2="72" stroke="rgba(6,182,212,0.1)" strokeWidth="1" strokeDasharray="4 4" />

                      {/* Main trajectory */}
                      <line x1="25" y1="80" x2="175" y2="80" stroke="rgba(6,182,212,0.2)" strokeWidth="1" strokeDasharray="4 4" />

                      {/* Tick marks along trajectory every 25px */}
                      {[50, 75, 100, 125, 150].map(x => (
                        <line key={`tick-${x}`} x1={x} y1="78" x2={x} y2="82" stroke="rgba(6,182,212,0.2)" strokeWidth="0.5" />
                      ))}

                      {/* Direction arrow */}
                      <polygon points="95,77 101,80 95,83" fill="rgba(6,182,212,0.5)" />

                      {/* SOL */}
                      <circle cx="25" cy="80" r="2.5" fill="rgba(251,191,36,0.5)" />
                      <text x="25" y="95" textAnchor="middle" fontSize="6" fill="rgba(251,191,36,0.5)" fontFamily="monospace">SOL</text>

                      {/* PROXIMA */}
                      <circle cx="175" cy="80" r="2" fill="rgba(34,211,238,0.3)" />
                      <text x="175" y="95" textAnchor="middle" fontSize="5" fill="rgba(34,211,238,0.3)" fontFamily="monospace">PROXIMA</text>
                      <text x="175" y="103" textAnchor="middle" fontSize="4.5" fill="rgba(34,211,238,0.2)" fontFamily="monospace">3.4 LY</text>

                      {/* Earth — dotted orbit circle */}
                      <circle cx="68" cy="80" r="12" fill="none" stroke="rgba(0,229,255,0.2)" strokeWidth="0.5" strokeDasharray="2 3" />

                      {/* Earth glow ring */}
                      <circle cx="68" cy="80" r="4" fill="none" stroke="#22d3ee" strokeWidth="0.5" opacity="0.4" />
                      <circle cx="68" cy="80" r="3" fill="#22d3ee">
                        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
                      </circle>
                      <text x="68" y="62" textAnchor="middle" fontSize="7" fill="#22d3ee" fontFamily="monospace" fontWeight="bold">EARTH</text>
                      <text x="68" y="70" textAnchor="middle" fontSize="5.5" fill="rgba(34,211,238,0.6)" fontFamily="monospace">0.8 LY FROM SOL</text>

                      {/* Coordinate text below Earth */}
                      <text x="68" y="100" textAnchor="middle" fontSize="5" fill="rgba(0,229,255,0.5)" fontFamily="monospace">COORD: α=265.8° δ=-28.9°</text>

                      {/* Distance scale ruler at bottom */}
                      <line x1="25" y1="155" x2="145" y2="155" stroke="rgba(0,229,255,0.25)" strokeWidth="0.5" />
                      {[0, 1, 2, 3, 4].map(i => {
                        const x = 25 + i * 30;
                        const labels = ['0', '0.5 LY', '1.0 LY', '1.5 LY', '2.0 LY'];
                        return (
                          <React.Fragment key={`ruler-${i}`}>
                            <line x1={x} y1="153" x2={x} y2="157" stroke="rgba(0,229,255,0.25)" strokeWidth="0.5" />
                            <text x={x} y="163" textAnchor="middle" fontSize="5" fill="rgba(0,229,255,0.25)" fontFamily="monospace">{labels[i]}</text>
                          </React.Fragment>
                        );
                      })}
                    </svg>
                    <div className="absolute top-1 left-2 text-[clamp(0.4375rem,0.5vw,0.625rem)] opacity-25 tracking-widest">INTERSTELLAR NAVIGATION CHART · 星际导航图</div>
                    <div className="absolute bottom-1 right-2 text-[clamp(0.4375rem,0.5vw,0.625rem)] text-cyan-400/30 tracking-widest">SECTOR: ALPHA CENTAURI VECTOR</div>
                  </div>

                  {/* Data */}
                  <div className="space-y-2 text-[clamp(0.625rem,0.7vw,0.875rem)] font-mono">
                    {[
                      ['SPEED', '0.031% c'],
                      ['HEADING', 'PROXIMA CENTAURI'],
                      ['DISTANCE', '0.8 LY'],
                      ['MISSION DAY', '12,403'],
                      ['ETA PROXIMA', '1,653 YEARS'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between items-center border-b border-cyan-500/5 pb-1">
                        <span className="opacity-40 tracking-widest text-[clamp(0.5625rem,0.625vw,0.8125rem)]">{label}</span>
                        <span className="font-bold text-cyan-400">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom stat line */}
            <div className="mt-4 text-center text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-[0.4em] text-cyan-400/60 font-bold z-10">
              第 847 年 · 位置: 距太阳 0.8 光年 · 速度: 0.031% c
            </div>
            <div className="mt-3 text-center z-10 font-mono" style={{ color: 'rgba(0,229,255,0.4)', fontSize: 'clamp(0.6rem,0.75vw,0.85rem)', letterSpacing: '0.15em' }}>
              <div className="animate-[fadeIn_0.8s_ease_0.5s_both]">Year 847 of the 2,500-year journey to Proxima Centauri.</div>
              <div className="animate-[fadeIn_0.8s_ease_1s_both]">Humanity's last hope — a wandering planet driven by 10,000 engines.</div>
            </div>
          </section>

          {/* Section 2: System Modules */}
          <section className="p-[3vw] space-y-8 bg-cyan-500/[0.02] border-y border-cyan-500/10">
            <h3 className="text-[clamp(0.9rem,1.2vw,1.4rem)] font-bold tracking-[0.3em]">系统模块 · SYSTEM MODULES</h3>
            <div className="grid grid-cols-2 gap-[2vw]">
              {/* Card 1: Pod Monitoring */}
              <div onClick={() => handleCardClick(0, '/dashboard/pods')} className="group relative flex flex-col bg-[rgba(0,15,30,0.9)] border border-[rgba(0,229,255,0.2)] hover:border-[rgba(0,229,255,0.6)] transition-colors overflow-hidden cursor-pointer" style={scanningCard === 0 ? { backgroundColor: 'rgba(0,229,255,0.08)' } : undefined}>
                {scanningCard === 0 && <div className="absolute left-0 w-full h-[2px] z-10 animate-[scanline_0.4s_ease-out_forwards]" style={{ background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)', boxShadow: '0 0 8px #00e5ff' }} />}
                <div className="flex-1 p-[1.5vw] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[clamp(0.8rem,1vw,1.1rem)] font-bold tracking-[0.2em]">休眠舱监控 / POD MONITORING</h4>
                    <span className="text-[clamp(0.5rem,0.55vw,0.6875rem)] font-bold tracking-widest px-2 py-0.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">127 ACTIVE</span>
                  </div>
                  <p className="text-[clamp(0.5625rem,0.625vw,0.8125rem)] tracking-widest opacity-50">实时监控127个休眠舱生命体征</p>
                  <div className="flex items-end gap-[3px] h-12 pt-2">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="flex-1 bg-cyan-500/40 rounded-t-sm"
                        animate={{ height: [`${40 + Math.random() * 30}%`, `${60 + Math.random() * 35}%`, `${35 + Math.random() * 40}%`] }}
                        transition={{ repeat: Infinity, duration: 1.5 + Math.random(), ease: 'easeInOut', delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
                <div className="border-t border-cyan-500/10 px-[1.5vw] py-3 flex items-center justify-between text-[clamp(0.5625rem,0.625vw,0.8125rem)] tracking-[0.2em] text-cyan-500/60 group-hover:text-cyan-400 transition-colors">
                  <span>进入系统 ENTER SYSTEM</span>
                  <ChevronRight size={14} />
                </div>
              </div>

              {/* Card 2: Habitat Alerts */}
              <div onClick={() => handleCardClick(1, '/dashboard/habitat')} className="group relative flex flex-col bg-[rgba(0,15,30,0.9)] border border-[rgba(0,229,255,0.2)] hover:border-[rgba(0,229,255,0.6)] transition-colors overflow-hidden cursor-pointer" style={scanningCard === 1 ? { backgroundColor: 'rgba(0,229,255,0.08)' } : undefined}>
                {scanningCard === 1 && <div className="absolute left-0 w-full h-[2px] z-10 animate-[scanline_0.4s_ease-out_forwards]" style={{ background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)', boxShadow: '0 0 8px #00e5ff' }} />}
                <div className="flex-1 p-[1.5vw] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[clamp(0.8rem,1vw,1.1rem)] font-bold tracking-[0.2em]">环境警报 / HABITAT ALERTS</h4>
                    <span className="text-[clamp(0.5rem,0.55vw,0.6875rem)] font-bold tracking-widest px-2 py-0.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">ALL NOMINAL</span>
                  </div>
                  <p className="text-[clamp(0.5625rem,0.625vw,0.8125rem)] tracking-widest opacity-50">氧气/辐射/气压三重监控系统</p>
                  <div className="flex justify-around items-center h-12 pt-2">
                    {[
                      { label: 'O₂', value: 85, color: '#22d3ee' },
                      { label: 'RAD', value: 12, color: '#22d3ee' },
                      { label: 'PRS', value: 92, color: '#22d3ee' },
                    ].map((g, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <svg width="36" height="36" viewBox="0 0 36 36">
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="2.5" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={g.color} strokeWidth="2.5" strokeDasharray={`${g.value}, 100`} strokeLinecap="round" />
                          <text x="18" y="21" textAnchor="middle" fontSize="8" fill={g.color} fontFamily="monospace" fontWeight="bold">{g.value}</text>
                        </svg>
                        <span className="text-[clamp(0.375rem,0.45vw,0.5rem)] opacity-50 tracking-widest">{g.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-cyan-500/10 px-[1.5vw] py-3 flex items-center justify-between text-[clamp(0.5625rem,0.625vw,0.8125rem)] tracking-[0.2em] text-cyan-500/60 group-hover:text-cyan-400 transition-colors">
                  <span>进入系统 ENTER SYSTEM</span>
                  <ChevronRight size={14} />
                </div>
              </div>

              {/* Card 3: AI Engine */}
              <div onClick={() => handleCardClick(2, '/dashboard/ai')} className="group relative flex flex-col bg-[rgba(0,15,30,0.9)] border border-[rgba(0,229,255,0.2)] hover:border-[rgba(0,229,255,0.6)] transition-colors overflow-hidden cursor-pointer" style={scanningCard === 2 ? { backgroundColor: 'rgba(0,229,255,0.08)' } : undefined}>
                {scanningCard === 2 && <div className="absolute left-0 w-full h-[2px] z-10 animate-[scanline_0.4s_ease-out_forwards]" style={{ background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)', boxShadow: '0 0 8px #00e5ff' }} />}
                <div className="flex-1 p-[1.5vw] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[clamp(0.8rem,1vw,1.1rem)] font-bold tracking-[0.2em]">AI推理引擎 / AI ENGINE</h4>
                    <span className="text-[clamp(0.5rem,0.55vw,0.6875rem)] font-bold tracking-widest px-2 py-0.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">STANDBY</span>
                  </div>
                  <p className="text-[clamp(0.5625rem,0.625vw,0.8125rem)] tracking-widest opacity-50">危机响应自动推理与专家调度</p>
                  <div className="h-12 pt-2 overflow-hidden relative font-mono">
                    <motion.div
                      className="absolute left-0 top-0 w-full flex flex-col gap-1"
                      animate={{ y: [0, -80] }}
                      transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                    >
                      {[
                        '> INFERENCE_CORE: IDLE',
                        '> THREAT_LEVEL: 0.02',
                        '> LAST_TRIGGER: 2H AGO',
                        '> MODEL_VER: 847.3.1',
                        '> QUEUE: EMPTY',
                        '> CONFIDENCE: 99.7%',
                        '> NEXT_SCAN: 12M',
                        '> NEURAL_NET: LOADED',
                        '> INFERENCE_CORE: IDLE',
                        '> THREAT_LEVEL: 0.02',
                      ].map((line, i) => (
                        <div key={i} className="text-[clamp(0.4375rem,0.5vw,0.625rem)] text-cyan-500/40 whitespace-nowrap">{line}</div>
                      ))}
                    </motion.div>
                  </div>
                </div>
                <div className="border-t border-cyan-500/10 px-[1.5vw] py-3 flex items-center justify-between text-[clamp(0.5625rem,0.625vw,0.8125rem)] tracking-[0.2em] text-cyan-500/60 group-hover:text-cyan-400 transition-colors">
                  <span>进入系统 ENTER SYSTEM</span>
                  <ChevronRight size={14} />
                </div>
              </div>

              {/* Card 4: Override */}
              <div onClick={() => handleCardClick(3, '/dashboard/override')} className="group relative flex flex-col bg-[rgba(0,15,30,0.9)] border border-[rgba(0,229,255,0.2)] hover:border-[rgba(0,229,255,0.6)] transition-colors overflow-hidden cursor-pointer" style={scanningCard === 3 ? { backgroundColor: 'rgba(0,229,255,0.08)' } : undefined}>
                {scanningCard === 3 && <div className="absolute left-0 w-full h-[2px] z-10 animate-[scanline_0.4s_ease-out_forwards]" style={{ background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)', boxShadow: '0 0 8px #00e5ff' }} />}
                <div className="flex-1 p-[1.5vw] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[clamp(0.8rem,1vw,1.1rem)] font-bold tracking-[0.2em]">人工决策 / OVERRIDE</h4>
                    <span className="text-[clamp(0.5rem,0.55vw,0.6875rem)] font-bold tracking-widest px-2 py-0.5 border border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse">2 PENDING</span>
                  </div>
                  <p className="text-[clamp(0.5625rem,0.625vw,0.8125rem)] tracking-widest opacity-50">待审批决策队列与风险评估</p>
                  <div className="flex items-center gap-3 h-12 pt-2">
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.8)]" />
                      <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500/50 animate-ping" />
                    </div>
                    <span className="text-[clamp(0.5625rem,0.625vw,0.8125rem)] font-bold tracking-[0.2em] text-red-400/80">2 DECISIONS PENDING REVIEW</span>
                  </div>
                </div>
                <div className="border-t border-cyan-500/10 px-[1.5vw] py-3 flex items-center justify-between text-[clamp(0.5625rem,0.625vw,0.8125rem)] tracking-[0.2em] text-cyan-500/60 group-hover:text-cyan-400 transition-colors">
                  <span>进入系统 ENTER SYSTEM</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Mission Timeline */}
          <section className="p-[3vw] space-y-12 bg-cyan-500/[0.02] border-y border-cyan-500/10">
            <h3 className="text-[clamp(0.9rem,1.2vw,1.4rem)] font-bold tracking-[0.3em]">任务时间线 · MISSION TIMELINE</h3>
            <div className="relative py-12">
              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-500/30 -translate-y-1/2" />
              {/* Traveling dot with trail */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 z-20 pointer-events-none" style={{ animation: 'timeline-dot-travel 8s linear infinite' }}>
                <div className="relative">
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-[80px] h-[2px] bg-gradient-to-l from-[#00e5ff] to-transparent" />
                  <div className="w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff,0_0_20px_rgba(0,229,255,0.4)]" />
                </div>
              </div>
              <div className="flex justify-between relative">
                <TimelineNode year="2058" label="发动机点火" sub="IGNITION" status="past" />
                <TimelineNode year="2061" label="离开太阳系" sub="SOLAR EXIT" status="past" />
                <TimelineNode year="NOW" label="YEAR 847" sub="CURRENT" status="active" />
                <TimelineNode year="2500" label="接近比邻星" sub="APPROACH" status="future" />
                <TimelineNode year="2650" label="抵达新家园" sub="ARRIVAL" status="future" />
              </div>
            </div>
          </section>

          {/* Section 3: Underground Status */}
          <section className="p-[3vw] space-y-8 bg-[#000d1a]">
            <h3 className="text-[clamp(0.9rem,1.2vw,1.4rem)] font-bold tracking-[0.3em]">地下城状态 · UNDERGROUND STATUS</h3>
            <div className="space-y-6">
              <StatusRow label="地表层 SURFACE" info="-272°C · 引擎运行中" progress={60} tag="⚠ UNINHABITABLE" tagColor="#ef4444" />
              <StatusRow label="居住层 HABITAT" info="18°C · 人口 3.5亿" progress={100} tag={`👥 ${habitatPop.toFixed(3)}B`} tagColor="#00ff88" />
              <StatusRow label="工业层 INDUSTRY" info="24°C · 能源输出 98%" progress={98} tag={`⚡ ${tickerStats.engine}%`} tagColor="#ffaa00" />
              <StatusRow label="地核层 CORE" info="5500°C · 反应堆稳定" progress={100} tag={`🌡 5,${coreTemp}°C`} tagColor="#ff6644" />
            </div>
          </section>

          {/* Section 4: Engine Output */}
          <section className="p-[3vw] space-y-8 bg-cyan-500/[0.02] border-y border-cyan-500/10">
            <h3 className="text-[clamp(0.9rem,1.2vw,1.4rem)] font-bold tracking-[0.3em]">── ENGINE OUTPUT · 发动机输出 ──</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[3vw]">
              <div className="space-y-6">
                {engineGroups.map((val, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest">
                      <span className="font-bold opacity-60">E-GROUP {i + 1}</span>
                      <span className="text-cyan-400 font-bold">{val.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 border border-cyan-500/10 rounded-sm overflow-hidden">
                      <motion.div
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-[#00e5ff] to-[#ffaa00] shadow-[0_0_10px_rgba(0,229,255,0.3)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col border border-[rgba(0,229,255,0.1)] bg-[rgba(0,0,0,0.4)]">
                <div className="p-3 text-[clamp(0.6rem,0.7vw,0.75rem)] font-mono font-bold tracking-[0.2em] text-cyan-500/60 text-center">
                  24H ENGINE OUTPUT HISTORY
                </div>
                <div style={{ width: '100%', height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={engineHistory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                      <XAxis dataKey="hour" tick={{ fontSize: 9, fill: 'rgba(0,229,255,0.3)' }} tickLine={{ stroke: 'rgba(0,229,255,0.15)' }} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: 'rgba(0,229,255,0.3)' }} tickLine={{ stroke: 'rgba(0,229,255,0.15)' }} axisLine={false} domain={[80, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#000d1a', border: '1px solid rgba(0,229,255,0.2)', fontFamily: 'monospace', fontSize: 11 }}
                        labelStyle={{ color: '#00e5ff' }}
                        itemStyle={{ padding: 0 }}
                      />
                      <Line type="monotone" dataKey="e1" stroke="#00e5ff" strokeWidth={1.5} dot={false} name="E1" />
                      <Line type="monotone" dataKey="e2" stroke="#ffaa00" strokeWidth={1.5} dot={false} name="E2" />
                      <Line type="monotone" dataKey="e3" stroke="#00ff88" strokeWidth={1.5} dot={false} name="E3" />
                      <Line type="monotone" dataKey="e4" stroke="#ff6644" strokeWidth={1.5} dot={false} name="E4" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="p-3 border-t border-cyan-500/10 flex justify-around text-[clamp(0.6rem,0.7vw,0.75rem)] font-mono tracking-widest">
                  <span><span className="opacity-40">TOTAL THRUST:</span> <span className="text-cyan-400 font-bold">1.5×10¹⁵ N</span></span>
                  <span><span className="opacity-40">COMBINED OUTPUT:</span> <span className="text-amber-500 font-bold">98.4%</span></span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Crew Duty */}
          <section className="p-[3vw] space-y-8 bg-[#000d1a]">
            <h3 className="text-[clamp(0.9rem,1.2vw,1.4rem)] font-bold tracking-[0.3em]">── ON DUTY · 值班状态 ──</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <CrewCard name="CHEN_WEI" role="结构工程师" status="AWAKE" />
              <CrewCard name="YANOV_K" role="核工程师" status="DORMANT" pod="023" />
              <CrewCard name="SMITH_J" role="医疗官" status="DORMANT" pod="041" />
              <CrewCard name="ZHANG_LI" role="生命支持" status="DORMANT" pod="011" />
              <CrewCard name="GARCIA_M" role="系统工程师" status="DORMANT" pod="067" />
              <CrewCard name="KIM_S" role="导航官" status="AWAKE" />
            </div>
          </section>

          {/* Section 6: Recent Events + System Pulse */}
          <section className="p-[3vw] space-y-8 bg-[#000d1a]">
            <h3 className="text-[clamp(0.9rem,1.2vw,1.4rem)] font-bold tracking-[0.3em]">近期事件 · RECENT EVENTS</h3>
            <div className="grid grid-cols-[65%_35%] gap-6">
              <div className="border border-cyan-500/10 bg-[#000f1e]/50 p-6 space-y-4">
                <EventItem time="2小时前" icon="🟡" text="AI推理引擎触发 · 氧气舱A-7轻微异常 · 已处理" />
                <EventItem time="6小时前" icon="🟢" text="机组轮换完成 · ZHANG_LI进入休眠 · CHEN_WEI唤醒" />
                <EventItem time="1天前" icon="🟢" text="引擎组E-7例行维护完成" />
                <EventItem time="3天前" icon="🔴" text="辐射读数异常 · 已由工程师修复" />
                <EventItem time="7天前" icon="🟢" text="系统全面检查通过" />
              </div>
              <div className="border border-cyan-500/10 bg-[rgba(0,0,0,0.4)] flex flex-col overflow-hidden">
                <div className="p-3 border-b border-cyan-500/10 text-[clamp(0.5625rem,0.625vw,0.8125rem)] font-bold tracking-[0.2em] text-cyan-500/40 text-center">
                  ── SYSTEM PULSE · 系统脉冲 ──
                </div>
                <div className="flex-1 min-h-[180px] relative">
                  <canvas ref={pulseCanvasRef} className="absolute inset-0 w-full h-full" />
                </div>
                <div className="p-2 border-t border-cyan-500/10 text-[clamp(0.4375rem,0.5vw,0.625rem)] tracking-[0.3em] text-cyan-500/30 text-center">
                  ENGINE OUTPUT · REAL-TIME
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="p-[3vw] border-t border-cyan-500/10 bg-[#000d1a] text-center space-y-4">
            <div className="text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-[0.4em] opacity-40">
              AEONGUARD · 永卫系统 · 联合地球政府 · 地球发动机管理局
            </div>
            <div className="text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-[0.2em] opacity-20">
              流浪地球计划 · 第847年 · 保障全人类生存
            </div>
          </footer>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scanline {
          0% { top: 0%; opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes timeline-dot-travel {
          0% { left: 0%; }
          80% { left: 50%; }
          90% { left: 50%; opacity: 1; }
          100% { left: 50%; opacity: 0; }
        }
      ` }} />
    </div>
  );
}

function SidebarItem({ to, icon, label, active = false, badge, collapsed = false }: { to: string, icon: React.ReactNode, label: string, active?: boolean, badge?: number, collapsed?: boolean }) {
  return (
    <li className="relative group/item">
      <Link
        to={to}
        className={`flex items-center py-2 text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest transition-all hover:bg-cyan-500/10 ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} ${active ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-cyan-500/60'}`}
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
        {collapsed && badge && (
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

function HealthBar({ label, value }: { label: string, value: number }) {
  const blocks = 10;
  const activeBlocks = Math.round((value / 100) * blocks);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[clamp(0.5rem,0.55vw,0.6875rem)] tracking-widest opacity-60">
        <span className="font-bold">{label}</span>
        <span>{value}%</span>
      </div>
      <div className="flex gap-0.5">
        {[...Array(blocks)].map((_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              backgroundColor: i < activeBlocks ? 'rgba(34,211,238,1)' : 'rgba(8,51,68,0.3)',
              boxShadow: i < activeBlocks ? '0 0 5px rgba(6,182,212,0.5)' : 'none'
            }}
            className="h-1 flex-1 rounded-sm"
          />
        ))}
      </div>
    </div>
  );
}

function StatusRow({ label, info, progress, tag, tagColor }: { label: string, info: string, progress: number, tag?: string, tagColor?: string }) {
  return (
    <div className="space-y-2 p-2 hover:bg-cyan-500/[0.02] transition-colors">
      <div className="flex items-center text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest">
        <span className="font-bold">{label}</span>
        <span className="opacity-60 ml-auto">{info}</span>
        {tag && (
          <span className="ml-4 font-mono font-bold text-[clamp(0.55rem,0.7vw,0.75rem)] tracking-widest" style={{ color: tagColor }}>{tag}</span>
        )}
      </div>
      <div className="h-1.5 w-full bg-white/10 border border-cyan-500/10">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${progress}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-[#00e5ff] to-[#0088aa] shadow-[0_0_10px_rgba(0,229,255,0.3)]"
        />
      </div>
    </div>
  );
}

function TimelineNode({ year, label, sub, status = 'future' }: { year: string, label: string, sub: string, status?: 'past' | 'active' | 'future' }) {
  const isActive = status === 'active';
  const isPast = status === 'past';
  return (
    <div className="flex flex-col items-center gap-4 relative z-10">
      <div className={`text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold tracking-widest ${isPast ? 'opacity-20' : 'opacity-40'}`}>{year}</div>
      <div className={`w-3 h-3 rounded-full border-2 ${isActive ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse' : isPast ? 'bg-gray-600 border-gray-600' : 'bg-[#000d1a] border-cyan-500/30'}`} />
      <div className="text-center">
        <div className={`text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold tracking-widest ${isActive ? 'text-cyan-400' : isPast ? 'opacity-20' : 'opacity-60'}`}>{label}</div>
        <div className="text-[clamp(0.5rem,0.55vw,0.6875rem)] tracking-widest opacity-30">{sub}</div>
      </div>
    </div>
  );
}

function CrewCard({ name, role, status, pod }: { name: string, role: string, status: 'AWAKE' | 'DORMANT', pod?: string }) {
  const isAwake = status === 'AWAKE';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);

    let offset = 0;

    const ecgY = (phase: number, amp: number): number => {
      if (phase < 0.40) return 0;
      if (phase < 0.44) return -Math.sin(((phase - 0.40) / 0.04) * Math.PI) * amp * 0.1;
      if (phase < 0.48) return 0;
      if (phase < 0.50) return ((phase - 0.48) / 0.02) * amp * 0.1;
      if (phase < 0.53) return amp * 0.1 - Math.sin(((phase - 0.50) / 0.03) * Math.PI) * (amp * 0.1 + amp * 0.8);
      if (phase < 0.56) return Math.sin(((phase - 0.53) / 0.03) * Math.PI) * amp * 0.2;
      if (phase < 0.60) return 0;
      if (phase < 0.72) return -Math.sin(((phase - 0.60) / 0.12) * Math.PI) * amp * 0.18;
      return 0;
    };

    const draw = () => {
      const dpr = window.devicePixelRatio;
      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cw, ch);

      const midY = ch / 2;

      if (isAwake) {
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        const period = 100;
        for (let x = 0; x < cw; x++) {
          const phase = ((x + offset) % period) / period;
          const y = midY + ecgY(phase, ch * 0.8);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        offset += 1;
      } else {
        ctx.strokeStyle = 'rgba(0,229,255,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0; x < cw; x++) {
          const y = midY + Math.sin((x + offset) * 0.05) * 3;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        offset += 0.5;
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [isAwake]);

  return (
    <div className={`relative border bg-[#000f1e]/80 transition-all ${isAwake ? 'border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-cyan-500/10 opacity-60'}`}>
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-[clamp(0.625rem,0.8vw,0.8125rem)] font-bold tracking-widest text-white">{name}</div>
            <div className="text-[clamp(0.5625rem,0.625vw,0.8125rem)] tracking-widest opacity-40 mt-1">{role}</div>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[clamp(0.5rem,0.55vw,0.6875rem)] font-bold tracking-widest ${isAwake ? 'bg-green-500/20 text-green-400' : 'bg-cyan-500/10 text-cyan-400/60'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isAwake ? 'bg-green-400 animate-pulse' : 'bg-cyan-400/40'}`} />
            {status}
          </div>
        </div>
        {pod && <div className="text-[clamp(0.5rem,0.55vw,0.6875rem)] tracking-[0.2em] opacity-30 border-t border-cyan-500/5 pt-2">LOCATION: POD_{pod}</div>}
      </div>
      <div className="border-t border-cyan-500/10">
        <canvas ref={canvasRef} className="w-full" style={{ height: '30px' }} />
      </div>
    </div>
  );
}

function EventItem({ time, icon, text }: { time: string, icon: string, text: string }) {
  return (
    <div className="flex items-center gap-4 text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest border-b border-cyan-500/5 pb-2 last:border-0">
      <span className="opacity-30 w-16">{time}</span>
      <span className="text-[clamp(0.625rem,0.8vw,0.8125rem)]">{icon}</span>
      <span className="opacity-70">{text}</span>
    </div>
  );
}
