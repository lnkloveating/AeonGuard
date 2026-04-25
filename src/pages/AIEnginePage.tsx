import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAeonStore } from '../store/aeonStore';
import { useOverrideBadge } from '../hooks/useOverrideBadge';
import { clearSessionDataForLogout } from '../utils/clearSessionLocalStorage';
import {
  Terminal, Home, Database, AlertTriangle, Cpu, Zap, FileText, Users, ClipboardList, Settings, LogOut, RefreshCw, ChevronLeft, ChevronRight
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

// Fixed pool of NOMINAL specialist pods to recommend from (always NOMINAL status)
const nominalSpecialists = [
  { pod: 'POD-001', person: 'CHEN_WEI',  role: 'Life Support Engineer',  bio: 94, skill: 98, equity: 87 },
  { pod: 'POD-005', person: 'YANOV_K',   role: 'Nuclear Engineer',        bio: 91, skill: 97, equity: 95 },
  { pod: 'POD-007', person: 'GARCIA_M',  role: 'Systems Engineer',        bio: 85, skill: 94, equity: 82 },
  { pod: 'POD-009', person: 'MÜLLER_H',  role: 'Geologist',               bio: 89, skill: 88, equity: 91 },
  { pod: 'POD-010', person: 'PATEL_R',   role: 'Biologist',               bio: 92, skill: 86, equity: 88 },
] as const;

type NominalSpecialist = (typeof nominalSpecialists)[number];

const specialistMap: Record<string, NominalSpecialist> = {
  oxygen: nominalSpecialists[0], // CHEN_WEI — Life Support
  radiation: nominalSpecialists[1], // YANOV_K — Nuclear
  power: nominalSpecialists[2], // GARCIA_M — Systems
  pressure: nominalSpecialists[3], // MÜLLER_H — Geology
  default: nominalSpecialists[0],
};

const buildScript = (crisisType: string, problemPod: string, problemPerson: string, source: 'c1' | 'c2'): string[] => {
  const specialist = specialistMap[crisisType] || specialistMap['default'];
  if (source === 'c1') {
    const bioSick = crisisType === 'oxygen' ? 68 : 74;
    const sk = 72;
    const eq = 70;
    const composite = (bioSick * 0.35 + sk * 0.4 + eq * 0.25).toFixed(1);
    return [
      '══════════════════════════════════════════',
      '  CRISIS-警报 RECEIVED · SYS-alert triggered',
      '══════════════════════════════════════════',
      `> SOURCE-来源: ${problemPod} · OCCUPANT-占用者: ${problemPerson}`,
      `> STATUS-状态: ${crisisType === 'oxygen' ? 'CRITICAL-危急' : 'WARNING-警告'} · IMMEDIATE-立即 ACTION-行动 REQUIRED-需要`,
      '',
      '> SCANNING-扫描 AFFECTED-受影响 HIBERNATION-休眠 POD-舱位...',
      '> ████████████████████████████████ 100%',
      '',
      '══════════════════════════════════════════',
      '  STEP 1: CRISIS-危机 IDENTIFICATION-识别',
      '══════════════════════════════════════════',
      `> CRISIS-危机 TYPE-类型: ${crisisType.toUpperCase()} (BIO-生物)`,
      `> AFFECTED-受影响 POD-舱位: ${problemPod} · ${problemPerson}`,
      `> CONSULT-参考 EXPERTISE-专长: ${specialist.role.toUpperCase()} (NOMINAL-正常池)`,
      '',
      '══════════════════════════════════════════',
      '  STEP 2: SKILL-技能 MATCHING-匹配',
      '══════════════════════════════════════════',
      '> PRIORITY-优先: WAKE-唤醒 OCCUPANT-占用者 IN-在 SOURCE-来源 POD-舱位',
      `> TARGET-目标: ${problemPerson} · ${problemPod} · NOT-非 ${specialist.pod}`,
      '',
      '══════════════════════════════════════════',
      '  STEP 3: THREE-三维 DIMENSION-维度 EVALUATION-评估',
      '══════════════════════════════════════════',
      `> BIO-生物 HEALTH-健康: ${bioSick}/100 · ${crisisType === 'oxygen' ? 'CRITICAL-危急' : 'WARNING-警告'}`,
      `> SKILL-技能 MATCH-匹配: ${sk}/100`,
      `> EQUITY-公平 INDEX-指数: ${eq}/100`,
      '',
      '> WEIGHTED-加权 COMPOSITE-综合 SCORE-评分 (OCCUPANT-占用者):',
      `> ${bioSick}×0.35 + ${sk}×0.40 + ${eq}×0.25 = ${composite}`,
      '',
      '══════════════════════════════════════════',
      '  STEP 4: FINAL-最终 RECOMMENDATION-推荐',
      '══════════════════════════════════════════',
      '> ┌─────────────────────────────────────────┐',
      `> │  WAKE-唤醒: ${problemPerson} · ${problemPod}     │`,
      `> │  COMPOSITE-综合 SCORE-评分: ${composite} / 100  │`,
      `> │  REASON-原因: STABILIZE-稳定 BIO-生物 CRISIS-危机  │`,
      '> └─────────────────────────────────────────┘',
      '',
      '> ANALYSIS-分析 COMPLETE-完成',
      '> FORWARDING-转发 TO HUMAN-人工 OVERRIDE-决策...',
      '> ► DECISION-决策 QUEUE-队列 UPDATED-更新 [+1 PENDING-待审]',
      '> _',
    ];
  }

  const composite = (specialist.bio * 0.35 + specialist.skill * 0.4 + specialist.equity * 0.25).toFixed(1);
  return [
    '══════════════════════════════════════════',
    '  CRISIS-警报 RECEIVED · SYS-alert triggered',
    '══════════════════════════════════════════',
    `> SOURCE-来源: ${problemPod} · OCCUPANT-占用者: ${problemPerson}`,
    `> STATUS-状态: ${crisisType === 'oxygen' ? 'CRITICAL-危急' : 'WARNING-警告'} · IMMEDIATE-立即 ACTION-行动 REQUIRED-需要`,
    '',
    '> SCANNING-扫描 NOMINAL-正常 STATUS-状态 SPECIALISTS-专家...',
    '> ████████████████████████████████ 100%',
    '',
    '══════════════════════════════════════════',
    '  STEP 1: CRISIS-危机 IDENTIFICATION-识别',
    '══════════════════════════════════════════',
    `> CRISIS-危机 TYPE-类型: ${crisisType.toUpperCase()}`,
    `> AFFECTED-受影响 POD-舱位: ${problemPod} · ${problemPerson}`,
    `> REQUIRED-需求 EXPERTISE-专长: ${specialist.role.toUpperCase()}`,
    '',
    '══════════════════════════════════════════',
    '  STEP 2: SKILL-技能 MATCHING-匹配',
    '══════════════════════════════════════════',
    '> SEARCHING-搜索 NOMINAL-正常态 SPECIALISTS-专家...',
    `> MATCH FOUND-找到: ${specialist.person} · ${specialist.pod}`,
    `> ROLE-职位: ${specialist.role.toUpperCase()}`,
    '> STATUS-状态: NOMINAL-正常态 · HEALTHY-健康 · READY-就绪',
    '',
    '══════════════════════════════════════════',
    '  STEP 3: THREE-三维 DIMENSION-维度 EVALUATION-评估',
    '══════════════════════════════════════════',
    `> BIO-生物 HEALTH-健康: ${specialist.bio}/100 · NOMINAL-正常态`,
    `> SKILL-技能 MATCH-匹配: ${specialist.skill}/100 ★`,
    `> EQUITY-公平 INDEX-指数: ${specialist.equity}/100`,
    '',
    '> WEIGHTED-加权 COMPOSITE-综合 SCORE-评分:',
    `> ${specialist.bio}×0.35 + ${specialist.skill}×0.40 + ${specialist.equity}×0.25 = ${composite}`,
    '',
    '══════════════════════════════════════════',
    '  STEP 4: FINAL-最终 RECOMMENDATION-推荐',
    '══════════════════════════════════════════',
    '> ┌─────────────────────────────────────────┐',
    `> │  WAKE-唤醒: ${specialist.person} · ${specialist.pod}     │`,
    `> │  ROLE-职位: ${specialist.role.toUpperCase()}  │`,
    `> │  COMPOSITE-综合 SCORE-评分: ${composite} / 100  │`,
    `> │  TO ASSIST-协助: ${problemPod} · ${problemPerson}  │`,
    '> └─────────────────────────────────────────┘',
    '',
    '> ANALYSIS-分析 COMPLETE-完成',
    '> FORWARDING-转发 TO HUMAN-人工 OVERRIDE-决策...',
    '> ► DECISION-决策 QUEUE-队列 UPDATED-更新 [+1 PENDING-待审]',
    '> _',
  ];
};

type ReasoningHistoryEntry = {
  id: string;
  time: string;
  crisis: string;
  recommended: string;
  score: number;
  action: 'PENDING' | 'ACCEPTED' | 'OVERRIDDEN';
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
  const { addDecision } = useAeonStore();
  const overrideBadge = useOverrideBadge();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [pendingCount, setPendingCount] = useState(() => {
    const n = parseInt(localStorage.getItem('pendingDecisionCount') || '0', 10);
    return Number.isNaN(n) ? 0 : n;
  });
  
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [titleDone, setTitleDone] = useState(false);
  const fullTitle = 'AI REASONING ENGINE';

  const [activeCrisisId, setActiveCrisisId] = useState<string | null>(null);
  const [activeCrisisInfo, setActiveCrisisInfo] = useState<null | { label: string; location: string }>(null);
  const [lastRec, setLastRec] = useState<null | {
    name: string;
    role: string;
    pod: string;
    bio: number;
    skill: number;
    equity: number;
    score: number;
  }>(null);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [reasoningHistory, setReasoningHistory] = useState<ReasoningHistoryEntry[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const cancelRef = useRef<boolean>(false);
  const hasAutoRunFromPodsRef = useRef(false);

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
    const sync = () => {
      const n = parseInt(localStorage.getItem('pendingDecisionCount') || '0', 10);
      setPendingCount(Number.isNaN(n) ? 0 : n);
    };
    sync();
    window.addEventListener('aeonguard:pendingDecisionCount', sync);
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('aeonguard:pendingDecisionCount', sync);
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const startReasoning = useCallback(
    (crisisType: string, problemPod?: string, problemPerson?: string, source: 'c1' | 'c2' = 'c2') => {
      if (isTyping) return;
      const problemPodResolved = problemPod || 'POD-119';
      const problemPersonResolved = problemPerson || 'UNKNOWN';
      const def = crisisScenarios.find(c => c.id === crisisType);
      if (!def) return;

      const labelSnap = localStorage.getItem('activeCrisisLabel') ?? def.label;
      const locSnap = localStorage.getItem('activeCrisisLocation') ?? def.location;
      const occupantRole = source === 'c1' ? localStorage.getItem('recommendedRole') : null;
      [
        'activeCrisisType', 'recommendedPod', 'recommendedPerson', 'recommendedRole', 'activeCrisisLabel', 'activeCrisisLocation',
      ].forEach(k => localStorage.removeItem(k));

      const specialist = specialistMap[crisisType] || specialistMap['default'];
      const composite = (
        specialist.bio * 0.35 + specialist.skill * 0.4 + specialist.equity * 0.25
      ).toFixed(1);
      const compositeNum = parseFloat(composite);
      const c1Bio = crisisType === 'oxygen' ? 68 : 74;
      const c1Skill = 72;
      const c1Equity = 70;
      const c1CompositeNum = parseFloat((c1Bio * 0.35 + c1Skill * 0.4 + c1Equity * 0.25).toFixed(1));
      const isC2HabitatEnv =
        source === 'c2' && specialist.pod === problemPodResolved && specialist.person === problemPersonResolved;

      setActiveCrisisId(crisisType);
      setLastRec(null);
      const script = buildScript(crisisType, problemPodResolved, problemPersonResolved, source);
      setDisplayedLines([]);
      setIsTyping(true);
      setCurrentStep(0);

      let lineIndex = 0;
      let cancelled = false;

      const addNextLine = () => {
        if (cancelled || cancelRef.current) return;
        if (lineIndex >= script.length) {
          const activeCrisis = crisisScenarios.find(c => c.id === crisisType);
          const isC1 = source === 'c1';
          const recPod = isC1 ? problemPodResolved : specialist.pod;
          const recPerson = isC1 ? problemPersonResolved : specialist.person;
          const recRole = isC1 ? (occupantRole || 'Crew') : specialist.role;
          const decisionScore = isC1 ? c1CompositeNum : compositeNum;
          const decisionBio = isC1 ? c1Bio : specialist.bio;
          const decisionSkill = isC1 ? c1Skill : specialist.skill;
          const decisionEquity = isC1 ? c1Equity : specialist.equity;
          const decisionCompositeStr = isC1 ? c1CompositeNum.toFixed(1) : composite;

          const decisionData = {
            id: `DEC-${Date.now()}`,
            crisisType: crisisType as 'oxygen' | 'radiation' | 'power' | 'pressure',
            crisisLabel: activeCrisis?.label || labelSnap,
            location: locSnap || activeCrisis?.location || problemPodResolved,
            recommendedPerson: recPerson,
            recommendedPod: recPod,
            role: recRole,
            score: decisionScore,
            status: 'PENDING' as const,
            triggeredAt: new Date().toISOString(),
            bioScore: decisionBio,
            skillScore: decisionSkill,
            equityScore: decisionEquity,
            riskLevel: (crisisType === 'oxygen' ? 'CRITICAL' : 'HIGH') as 'CRITICAL' | 'HIGH' | 'MODERATE',
            timeToFailure: crisisType === 'oxygen' ? '01:00:00' : '02:30:00',
            affectedPopulation: 1,
            riskDescription: isC1
              ? [
                  `${problemPersonResolved} in ${problemPodResolved} is in ${crisisType === 'oxygen' ? 'CRITICAL' : 'WARNING'} condition`,
                  'AI recommends waking this occupant in the affected pod to stabilize bio readings and enable intervention',
                  `Role on file: ${recRole} · composite score: ${decisionCompositeStr}/100`,
                  'Human override (C3) is required to authorize the wake sequence',
                ]
              : isC2HabitatEnv
                ? [
                    `${crisisType.toUpperCase()} environmental crisis detected — affected sector: ${locSnap || 'UNKNOWN'}`,
                    `${specialist.person} (${specialist.pod}) is the NOMINAL specialist best matched to remediate this crisis`,
                    `${specialist.person} has the highest ${specialist.role} skill match for this crisis type`,
                    `Composite score: ${decisionCompositeStr}/100`,
                    `Waking ${specialist.person} will not harm their long-term hibernation health`,
                  ]
                : [
                    `${problemPersonResolved} in ${problemPodResolved} is in ${crisisType === 'oxygen' ? 'CRITICAL' : 'WARNING'} condition`,
                    `${specialist.person} (${specialist.pod}) is recommended to assist — currently NOMINAL status`,
                    `${specialist.person} has the highest ${specialist.role} skill match for this crisis type`,
                    `Composite score: ${decisionCompositeStr}/100`,
                    `Waking ${specialist.person} will not harm their long-term hibernation health`,
                  ],
          };
          let alreadyExists = false;
          let wroteNew = false;
          try {
            const existing = JSON.parse(localStorage.getItem('pendingDecisions') || '[]') as {
              recommendedPod?: string;
              status?: string;
            }[];
            if (!Array.isArray(existing)) throw new Error('pendingDecisions is not an array');
            alreadyExists = existing.some(
              d => d.recommendedPod === recPod && d.status === 'PENDING'
            );
            if (!alreadyExists) {
              existing.unshift(decisionData);
              localStorage.setItem('pendingDecisions', JSON.stringify(existing));
              localStorage.setItem(
                'pendingDecisionCount',
                String(existing.filter(d => d.status === 'PENDING').length)
              );
              window.dispatchEvent(new Event('aeonguard:pendingDecisionCount'));
              window.dispatchEvent(new Event('aeonguard:decisionsUpdated'));
              wroteNew = true;
            }
          } catch (e) {
            console.error('Failed to save decision:', e);
          }
          if (wroteNew) {
            addDecision({
              crisisId: crisisType,
              recommendedPod: recPod,
              recommendedPerson: recPerson,
              score: decisionScore,
              reason: `Composite Score: ${decisionScore}`,
            });
            setReasoningHistory(prev => [
              {
                id: decisionData.id,
                time: 'JUST NOW',
                crisis: activeCrisis?.label || 'Unknown',
                recommended: recPerson,
                score: decisionScore,
                action: 'PENDING',
              },
              ...prev,
            ]);
          }
          setLastRec({
            name: recPerson,
            role: recRole,
            pod: recPod,
            bio: decisionBio,
            skill: decisionSkill,
            equity: decisionEquity,
            score: decisionScore,
          });
          setIsTyping(false);
          return;
        }
        const line = script[lineIndex];
        setDisplayedLines(prev => [...prev, line]);

        const stepMarkers = ['STEP 1', 'STEP 2', 'STEP 3', 'STEP 4'];
        stepMarkers.forEach((marker, i) => {
          if (line.includes(marker)) setCurrentStep(i + 1);
        });
        lineIndex++;

        const delay = line.includes('═') ? 50 : line.includes('STEP') ? 400 : line === '' ? 150 : 80;
        setTimeout(addNextLine, delay);
      };

      setTimeout(addNextLine, 300);
    },
    [isTyping, addDecision]
  );

  useEffect(() => {
    if (hasAutoRunFromPodsRef.current) return;
    const crisisType = localStorage.getItem('activeCrisisType');
    const recommendedPod = localStorage.getItem('recommendedPod');
    const recommendedPerson = localStorage.getItem('recommendedPerson');
    const crisisLabel = localStorage.getItem('activeCrisisLabel');
    const crisisLocation = localStorage.getItem('activeCrisisLocation');

    if (!crisisType) return;

    hasAutoRunFromPodsRef.current = true;
    setActiveCrisisId(crisisType);
    setActiveCrisisInfo({ label: crisisLabel || crisisType, location: crisisLocation || 'UNKNOWN' });

    // C2 (Habitat): no pod from C1, or placeholder only → use NOMINAL specialist as entry context
    // C1 (Pods): recommendedPod is the WARNING/CRITICAL pod
    const isFromC2 = !recommendedPod || recommendedPod === 'SPECIALIST';

    if (isFromC2) {
      const c2 = specialistMap[crisisType] || specialistMap['default'];
      setTimeout(() => startReasoning(crisisType, c2.pod, c2.person, 'c2'), 800);
    } else {
      const person = recommendedPerson || 'SPECIALIST';
      setTimeout(() => startReasoning(crisisType, recommendedPod || undefined, person, 'c1'), 800);
    }
  }, [startReasoning]);

  const handleLogout = () => {
    clearSessionDataForLogout();
    navigate('/');
  };

  useEffect(() => {
    return () => { cancelRef.current = true; };
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('pendingDecisions') || '[]';
      const stored = JSON.parse(raw) as {
        id?: string;
        status?: string;
        crisisLabel?: string;
        recommendedPerson?: string;
        score?: number;
      }[];
      if (!Array.isArray(stored)) return;
      const resolved = stored.filter(
        d => d.status === 'ACCEPTED' || d.status === 'OVERRIDDEN'
      );
      if (resolved.length > 0) {
        setReasoningHistory(
          resolved.map((d, i) => ({
            id: d.id || `res-${i}`,
            time: 'EARLIER' as const,
            crisis: d.crisisLabel || 'Unknown',
            recommended: d.recommendedPerson || '',
            score: typeof d.score === 'number' ? d.score : 0,
            action: d.status as 'ACCEPTED' | 'OVERRIDDEN',
          }))
        );
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    const onSettled = (e: Event) => {
      const ce = e as CustomEvent<{ id: string; status: 'ACCEPTED' | 'OVERRIDDEN' }>;
      const { id, status } = ce.detail || {};
      if (typeof id !== 'string' || (status !== 'ACCEPTED' && status !== 'OVERRIDDEN')) return;
      setReasoningHistory(prev =>
        prev.map(h => (h.id === id && h.action === 'PENDING' ? { ...h, action: status } : h))
      );
    };
    window.addEventListener('aeonguard:decisionSettled', onSettled);
    return () => window.removeEventListener('aeonguard:decisionSettled', onSettled);
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

  const defScenario = activeCrisisId ? crisisScenarios.find(c => c.id === activeCrisisId) : null;
  const activeCrisis = defScenario
    ? {
        ...defScenario,
        label: activeCrisisInfo?.label ?? defScenario.label,
        location: activeCrisisInfo?.location ?? defScenario.location,
      }
    : null;
  const activeCandidates = useMemo(
    () =>
      lastRec
        ? [
            {
              name: lastRec.name,
              role: lastRec.role,
              pod: lastRec.pod,
              bio: lastRec.bio,
              skill: lastRec.skill,
              equity: lastRec.equity,
              score: lastRec.score,
              rank: 1,
            },
          ]
        : [],
    [lastRec]
  );
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
          <span>AEONGUARD</span>
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
              {sidebarOpen && <div className="mb-2 text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold tracking-widest opacity-30">CORE</div>}
              <ul className="space-y-1">
                <SidebarItem to="/dashboard" icon={<Home size={14} />} label="HOME" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/pods" icon={<Database size={14} />} label="POD MONITORING" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/habitat" icon={<AlertTriangle size={14} />} label="HABITAT ALERT" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/ai" icon={<Cpu size={14} />} label="AI ENGINE" active collapsed={!sidebarOpen} />
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
              <div className="space-y-3 flex-1 overflow-y-auto px-1 min-h-0">
                {crisisScenarios.map(scenario => (
                  <div
                    key={scenario.id}
                    style={{
                      padding: '12px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.02)',
                      opacity: 0.35,
                      cursor: 'not-allowed',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.3)',
                      letterSpacing: '0.15em',
                    }}
                  >
                    <div style={{ marginBottom: '4px' }}>
                      {scenario.icon} {scenario.label}
                    </div>
                    <div style={{ fontSize: '9px', opacity: 0.5 }}>{scenario.location}</div>
                    <div
                      style={{
                        fontSize: '8px',
                        marginTop: '4px',
                        color: 'rgba(0,229,255,0.3)',
                      }}
                    >
                      REQUIRES C1/C2 TRIGGER
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: '16px',
                  padding: '10px 12px',
                  border: '1px solid rgba(0,229,255,0.1)',
                  background: 'rgba(0,229,255,0.03)',
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  color: 'rgba(0,229,255,0.4)',
                  letterSpacing: '0.15em',
                  lineHeight: 1.8,
                }}
              >
                <div>── HOW TO TRIGGER ──</div>
                <div style={{ marginTop: '6px', opacity: 0.7 }}>1. Go to POD MONITORING (C1)</div>
                <div style={{ opacity: 0.7 }}>2. Click a WARNING or CRITICAL pod</div>
                <div style={{ opacity: 0.7 }}>3. Click VIEW AI ANALYSIS button</div>
                <div style={{ marginTop: '6px', opacity: 0.5 }}>── OR ──</div>
                <div style={{ opacity: 0.7 }}>1. Go to HABITAT ALERT (C2)</div>
                <div style={{ opacity: 0.7 }}>2. Trigger a crisis event</div>
                <div style={{ opacity: 0.7 }}>3. Click VIEW AI ANALYSIS button</div>
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
                        [{Array.from({ length: 16 }).map((_, i) => i < (currentStep / 4) * 16 ? '█' : '░').join('')}] {Math.round((currentStep / 4) * 100)}%
                      </div>
                      <div className="text-[clamp(0.55rem,0.6vw,0.65rem)] text-cyan-500/50 tracking-widest">
                        {currentStep > 0 ? `STEP ${currentStep} OF 4` : 'AWAITING START'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[clamp(0.6rem,0.7vw,0.8rem)] text-cyan-500/50 tracking-widest">
                    SYSTEM STANDBY · USE POD MONITORING (C1) OR HABITAT ALERT (C2) TO BEGIN ANALYSIS
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
                  ── RECOMMENDED WAKE LIST ──
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
                  ── REASONING HISTORY ──
                </div>
                {reasoningHistory.length === 0 ? (
                  <div
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      color: 'rgba(0,229,255,0.2)',
                      letterSpacing: '0.2em',
                    }}
                  >
                    NO REASONING HISTORY · TRIGGER A CRISIS TO BEGIN
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reasoningHistory.map((h, i) => (
                      <div
                        key={h.id || i}
                        className="flex items-center justify-between border-b border-cyan-500/10 pb-2 text-[clamp(0.6rem,0.7vw,0.75rem)] tracking-widest"
                      >
                        <div className="w-16 text-cyan-500/40">{h.time}</div>
                        <div className="flex-1 text-cyan-200">{h.crisis}</div>
                        <div className="w-32 text-cyan-400">{h.recommended}</div>
                        <div className="w-16 text-right text-cyan-500/60 mr-4">{h.score}</div>
                        <div
                          className={`w-24 text-center px-1 py-0.5 border text-[clamp(0.5rem,0.55vw,0.6rem)] ${
                            h.action === 'ACCEPTED'
                              ? 'text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/10'
                              : h.action === 'OVERRIDDEN'
                                ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                : 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
                          }`}
                        >
                          {h.action}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section C */}
              <div className="w-[40%] flex flex-col gap-4">
                <div className="text-[clamp(0.7rem,0.8vw,0.9rem)] font-bold tracking-[0.2em] text-[#6464ff] mb-0">
                  ── ENGINE STATISTICS ──
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
