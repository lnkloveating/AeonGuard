import React, { useMemo, useState } from 'react';
import DashboardShell from '../components/DashboardShell';

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

const FLAG: Record<string, string> = {
  CN: '🇨🇳',
  US: '🇺🇸',
  RU: '🇷🇺',
  DE: '🇩🇪',
  KR: '🇰🇷',
  JP: '🇯🇵',
  IN: '🇮🇳',
  FR: '🇫🇷',
  GB: '🇬🇧',
};

/** Deterministic pool: 45 CN, 28 US, 18 RU, 12 DE, 9 KR, 15 other (JP/IN/FR/GB mix) */
const NATIONALITY_POOL: string[] = [
  ...Array(45).fill('CN'),
  ...Array(28).fill('US'),
  ...Array(18).fill('RU'),
  ...Array(12).fill('DE'),
  ...Array(9).fill('KR'),
  ...['JP', 'IN', 'FR', 'GB', 'JP', 'IN', 'FR', 'GB', 'JP', 'IN', 'FR', 'GB', 'JP', 'IN', 'FR'],
];

type CrewStatus = 'AWAKE' | 'DORMANT' | 'WARNING' | 'CRITICAL';

interface CrewMember {
  pod: string;
  name: string;
  nationality: string;
  role: string;
  status: CrewStatus;
  days: number;
  health: number;
}

function buildCrewRoster(): CrewMember[] {
  const base: CrewMember[] = [
    { pod: 'POD-001', name: 'CHEN_WEI', nationality: 'CN', role: 'Life Support Engineer', status: 'DORMANT', days: 847, health: 94 },
    { pod: 'POD-002', name: 'ZHANG_F', nationality: 'CN', role: 'Structural Engineer', status: 'DORMANT', days: 423, health: 88 },
    { pod: 'POD-003', name: 'WANG_L', nationality: 'CN', role: 'Medical Officer', status: 'DORMANT', days: 612, health: 91 },
    { pod: 'POD-004', name: 'LI_J', nationality: 'CN', role: 'Nuclear Engineer', status: 'DORMANT', days: 234, health: 87 },
    { pod: 'POD-005', name: 'YANOV_K', nationality: 'RU', role: 'Nuclear Engineer', status: 'DORMANT', days: 789, health: 91 },
    { pod: 'POD-006', name: 'SMITH_J', nationality: 'US', role: 'Medical Officer', status: 'DORMANT', days: 345, health: 88 },
    { pod: 'POD-007', name: 'GARCIA_M', nationality: 'MX', role: 'Systems Engineer', status: 'DORMANT', days: 567, health: 85 },
    { pod: 'POD-008', name: 'KIM_S', nationality: 'KR', role: 'Navigation', status: 'AWAKE', days: 0, health: 95 },
    { pod: 'POD-009', name: 'MÜLLER_H', nationality: 'DE', role: 'Geologist', status: 'DORMANT', days: 432, health: 89 },
    { pod: 'POD-010', name: 'PATEL_R', nationality: 'IN', role: 'Biologist', status: 'DORMANT', days: 321, health: 92 },
  ];

  for (let i = 10; i < 127; i++) {
    const podNum = i + 1;
    const pod = `POD-${String(podNum).padStart(3, '0')}`;
    let status: CrewStatus = 'DORMANT';
    if (podNum === 12) status = 'AWAKE';
    else if (podNum >= 119 && podNum <= 123) status = 'WARNING';
    else if (podNum >= 126) status = 'CRITICAL';

    const nat = NATIONALITY_POOL[i];
    const days = status === 'AWAKE' ? 0 : 50 + ((i * 17 + 11) % 800);
    const health =
      status === 'CRITICAL' ? 62 + (i % 8) : status === 'WARNING' ? 72 + (i % 10) : 75 + ((i * 13) % 22);

    base.push({
      pod,
      name: randomName(i),
      nationality: nat,
      role: randomRole(i),
      status,
      days,
      health: Math.min(99, health),
    });
  }
  return base;
}

const crewRosterStatic = buildCrewRoster();

function healthColor(h: number) {
  if (h > 85) return '#00ff88';
  if (h >= 70) return '#ffaa00';
  return '#ff4444';
}

function rowBg(status: CrewStatus, index: number) {
  if (status === 'AWAKE') return 'rgba(0,255,136,0.06)';
  if (status === 'WARNING' || status === 'CRITICAL') return 'rgba(255,170,0,0.06)';
  return index % 2 === 0 ? 'rgba(0,229,255,0.02)' : 'transparent';
}

export default function CrewPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'AWAKE' | 'DORMANT' | 'WARNING'>('ALL');

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return crewRosterStatic.filter(c => {
      if (filter === 'AWAKE' && c.status !== 'AWAKE') return false;
      if (filter === 'DORMANT' && c.status !== 'DORMANT') return false;
      if (filter === 'WARNING' && c.status !== 'WARNING' && c.status !== 'CRITICAL') return false;
      if (!q) return true;
      return c.name.toUpperCase().includes(q) || c.role.toUpperCase().includes(q) || c.pod.toUpperCase().includes(q);
    });
  }, [search, filter]);

  const summary = useMemo(() => {
    const all = crewRosterStatic;
    return {
      total: all.length,
      hib: all.filter(c => c.status === 'DORMANT' || c.status === 'WARNING' || c.status === 'CRITICAL').length,
      awake: all.filter(c => c.status === 'AWAKE').length,
    };
  }, []);

  const natStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of crewRosterStatic) {
      const k = ['CN', 'US', 'RU', 'DE', 'KR'].includes(c.nationality) ? c.nationality : 'OTHER';
      counts[k] = (counts[k] ?? 0) + 1;
    }
    const total = crewRosterStatic.length;
    const rows = [
      { code: 'CN', flag: '🇨🇳', n: counts.CN ?? 0 },
      { code: 'US', flag: '🇺🇸', n: counts.US ?? 0 },
      { code: 'RU', flag: '🇷🇺', n: counts.RU ?? 0 },
      { code: 'DE', flag: '🇩🇪', n: counts.DE ?? 0 },
      { code: 'KR', flag: '🇰🇷', n: counts.KR ?? 0 },
      { code: 'OTHER', flag: '🌐', n: counts.OTHER ?? 0 },
    ];
    const maxN = Math.max(...rows.map(r => r.n), 1);
    return rows.map(r => ({
      ...r,
      pct: total ? ((r.n / total) * 100).toFixed(1) : '0',
      barPct: (r.n / maxN) * 100,
    }));
  }, []);

  return (
    <DashboardShell archiveActive="crew" typewriterTitle="CREW ROSTER">
      <div className="p-6 flex flex-col gap-8 pb-16">
        <section className="flex flex-wrap gap-4 text-[clamp(0.6rem,0.7vw,0.8rem)] tracking-[0.15em] border border-cyan-500/15 bg-[rgba(0,0,0,0.25)] p-4">
          <span>
            <span className="text-cyan-500/50">TOTAL CREW:</span> <span className="text-cyan-300 font-bold">{summary.total}</span>
          </span>
          <span className="text-cyan-500/30">|</span>
          <span>
            <span className="text-cyan-500/50">HIBERNATING:</span> <span className="text-cyan-300 font-bold">{summary.hib}</span>
          </span>
          <span className="text-cyan-500/30">|</span>
          <span>
            <span className="text-cyan-500/50">AWAKE:</span> <span className="text-[#00ff88] font-bold">{summary.awake}</span>
          </span>
          <span className="text-cyan-500/30">|</span>
          <span>
            <span className="text-cyan-500/50">NEXT ROTATION:</span> <span className="text-amber-400 font-bold">43 DAYS</span>
          </span>
        </section>

        <section className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <input
            placeholder="SEARCH BY NAME OR ROLE..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] bg-[rgba(0,20,40,0.6)] border border-cyan-500/25 px-3 py-2 text-[clamp(0.6rem,0.65vw,0.75rem)] tracking-widest text-cyan-200 placeholder:text-cyan-500/30 outline-none focus:border-cyan-400/50"
          />
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'AWAKE', 'DORMANT', 'WARNING'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-[clamp(0.55rem,0.6vw,0.7rem)] tracking-widest border transition-colors ${
                  filter === f
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300'
                    : 'border-cyan-500/20 text-cyan-500/60 hover:border-cyan-500/40'
                }`}
              >
                [{f}]
              </button>
            ))}
          </div>
        </section>

        <section className="overflow-x-auto border border-cyan-500/15">
          <table className="w-full border-collapse text-left text-[clamp(0.55rem,0.62vw,0.72rem)]">
            <thead>
              <tr className="bg-cyan-500/10 text-cyan-500/80 tracking-[0.15em]">
                <th className="p-2 border-b border-cyan-500/20">POD ID</th>
                <th className="p-2 border-b border-cyan-500/20">NAME</th>
                <th className="p-2 border-b border-cyan-500/20">NATIONALITY</th>
                <th className="p-2 border-b border-cyan-500/20">ROLE</th>
                <th className="p-2 border-b border-cyan-500/20">STATUS</th>
                <th className="p-2 border-b border-cyan-500/20">HIBERNATION DAYS</th>
                <th className="p-2 border-b border-cyan-500/20">HEALTH</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr key={c.pod} style={{ background: rowBg(c.status, idx) }}>
                  <td className="p-2 border-b border-cyan-500/10 font-mono text-cyan-300">{c.pod}</td>
                  <td className="p-2 border-b border-cyan-500/10">{c.name}</td>
                  <td className="p-2 border-b border-cyan-500/10 whitespace-nowrap">
                    <span className="mr-1">{FLAG[c.nationality] ?? '🌐'}</span>
                    {c.nationality}
                  </td>
                  <td className="p-2 border-b border-cyan-500/10">{c.role}</td>
                  <td className="p-2 border-b border-cyan-500/10">{c.status}</td>
                  <td className="p-2 border-b border-cyan-500/10">{c.days}</td>
                  <td className="p-2 border-b border-cyan-500/10 font-bold" style={{ color: healthColor(c.health) }}>
                    {c.health}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <div className="text-[clamp(0.65rem,0.75vw,0.85rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">
            ── NATIONALITY DISTRIBUTION · 国籍分布 (RQ3) ──
          </div>
          <div className="max-w-xl space-y-2 border border-cyan-500/15 bg-[rgba(0,0,0,0.2)] p-4 font-mono text-[clamp(0.55rem,0.62vw,0.72rem)]">
            {natStats.map(r => (
              <div key={r.code} className="flex items-center gap-2">
                <span className="w-24 shrink-0">
                  {r.flag} {r.code}
                </span>
                <div className="flex-1 h-2 bg-white/5 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500/50 to-cyan-400/30 rounded"
                    style={{ width: `${r.barPct}%` }}
                  />
                </div>
                <span className="w-24 text-right text-cyan-400/90 shrink-0">
                  {r.n} ({r.pct}%)
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
