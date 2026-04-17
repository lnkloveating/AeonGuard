import React, { useEffect, useMemo, useState } from 'react';
import DashboardShell from '../components/DashboardShell';

const SEC_PER_YEAR = 365 * 24 * 3600;
const PAD2 = (n: number) => String(n).padStart(2, '0');

function formatCountdown(totalSec: number) {
  let s = Math.max(0, Math.floor(totalSec));
  const years = Math.floor(s / SEC_PER_YEAR);
  s %= SEC_PER_YEAR;
  const days = Math.floor(s / (24 * 3600));
  s %= 24 * 3600;
  const hrs = Math.floor(s / 3600);
  s %= 3600;
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return { years, days, hrs, mins, secs };
}

function MissionProgressGauge() {
  const r = 80;
  const c = 2 * Math.PI * r;
  const pct = 0.189;
  const dashLen = c * pct;
  return (
    <div className="flex flex-col items-center">
      <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] text-cyan-500/50 mb-3">── MISSION PROGRESS ──</div>
      <svg width={200} height={200} viewBox="0 0 200 200" className="max-w-full">
        <circle cx={100} cy={100} r={r} fill="none" stroke="rgba(0,229,255,0.1)" strokeWidth={12} />
        <circle
          cx={100}
          cy={100}
          r={r}
          fill="none"
          stroke="#00e5ff"
          strokeWidth={12}
          strokeDasharray={`${dashLen} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 100 100)"
          style={{ filter: 'drop-shadow(0 0 6px #00e5ff)' }}
        />
        <text x={100} y={90} textAnchor="middle" fill="#00e5ff" fontSize={28} fontFamily="monospace" fontWeight="bold">
          18.9%
        </text>
        <text x={100} y={112} textAnchor="middle" fill="rgba(0,229,255,0.5)" fontSize={11} fontFamily="monospace">
          JOURNEY COMPLETE
        </text>
        <text x={100} y={130} textAnchor="middle" fill="rgba(0,229,255,0.3)" fontSize={9} fontFamily="monospace">
          0.8 LY / 4.22 LY
        </text>
      </svg>
    </div>
  );
}

const missionLogLines = [
  'YEAR 847 · DAY 12,403  All systems nominal. Crew rotation completed.',
  'YEAR 847 · DAY 12,401  Minor O₂ anomaly in B1-R2. Resolved.',
  'YEAR 846 · DAY 12,008  Engine group E-7 maintenance completed.',
  'YEAR 845 · DAY 11,680  Gravitational anomaly detected and resolved.',
  'YEAR 840 · DAY 10,950  10-year system diagnostic passed.',
  'YEAR 800 · DAY 9,490   Mid-journey milestone reached. All nominal.',
  'YEAR 500 · DAY 5,844   500-year mark. Crew morale protocols updated.',
  'YEAR 100 · DAY 1,095   First century completed. Systems optimized.',
  'YEAR 003 · DAY 1,096   Solar system boundary crossed.',
  'YEAR 001 · DAY 001     Mission commenced. Earth engines ignited.',
];

function TimelineNode({
  year,
  label,
  sub,
  status = 'future',
}: {
  year: string;
  label: string;
  sub: string;
  status?: 'past' | 'active' | 'future';
}) {
  const isActive = status === 'active';
  const isPast = status === 'past';
  return (
    <div className="flex flex-col items-center gap-4 relative z-10 min-w-0 flex-1">
      <div className={`text-[clamp(0.55rem,0.65vw,0.75rem)] font-bold tracking-widest ${isPast ? 'opacity-20' : 'opacity-40'}`}>
        {year}
      </div>
      <div
        className={`w-3 h-3 rounded-full border-2 shrink-0 ${
          isActive
            ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.8)] animate-pulse'
            : isPast
              ? 'bg-gray-600 border-gray-600'
              : 'bg-[#000d1a] border-cyan-500/30'
        }`}
      />
      <div className="text-center px-1">
        <div
          className={`text-[clamp(0.55rem,0.65vw,0.75rem)] font-bold tracking-widest ${
            isActive ? 'text-cyan-400' : isPast ? 'opacity-20' : 'opacity-60'
          }`}
        >
          {label}
        </div>
        <div className="text-[clamp(0.45rem,0.5vw,0.65rem)] tracking-widest opacity-30">{sub}</div>
      </div>
    </div>
  );
}

export default function MissionPage() {
  const initialSeconds = useMemo(
    () => 1653 * SEC_PER_YEAR + 42 * 24 * 3600 + 6 * 3600 + 22 * 60 + 14,
    []
  );
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSecondsLeft(s => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const cd = formatCountdown(secondsLeft);

  return (
    <DashboardShell archiveActive="mission" typewriterTitle="MISSION LOG">
      <div className="p-6 flex flex-col gap-10 pb-16">
        {/* Section 1 — Overview */}
        <section>
          <div className="text-[clamp(0.65rem,0.75vw,0.85rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">
            ── MISSION OVERVIEW ──
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Left — info card */}
            <div
              className="border border-cyan-500/30 bg-[rgba(0,15,30,0.6)] p-6 min-w-0"
              style={{ boxShadow: '0 0 24px rgba(0,229,255,0.06)' }}
            >
              <div className="text-[clamp(1rem,1.3vw,1.35rem)] font-bold tracking-[0.25em] text-cyan-300 mb-1">WANDERING EARTH PROJECT</div>
              <div className="text-[clamp(0.75rem,0.9vw,1rem)] tracking-[0.3em] text-cyan-500/70 mb-6">Wandering Earth Project</div>
              <dl className="space-y-2 text-[clamp(0.6rem,0.7vw,0.8rem)] tracking-[0.12em]">
                {[
                  ['LAUNCH DATE:', '2058.03.15'],
                  ['CURRENT YEAR:', '847'],
                  ['DESTINATION:', 'PROXIMA CENTAURI'],
                  ['DISTANCE:', '4.22 LIGHT YEARS'],
                  ['ELAPSED:', '0.8 LY (18.9% OF JOURNEY)'],
                  ['ETA:', 'YEAR 2500 · 1,653 YEARS REMAINING'],
                  ['CREW:', '127 SPECIALISTS IN HIBERNATION'],
                  ['STATUS:', 'NOMINAL'],
                ].map(([k, v]) => (
                  <div key={k} className="flex flex-wrap gap-3 border-b border-cyan-500/10 pb-2 last:border-0">
                    <dt className="text-cyan-500/50 w-40 shrink-0">{k}</dt>
                    <dd className="text-cyan-200/90">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Right — stacked panels */}
            <div className="flex flex-col gap-6 min-w-0">
              <div
                className="border border-cyan-500/25 bg-[rgba(0,15,30,0.45)] p-6 flex justify-center"
                style={{ boxShadow: '0 0 20px rgba(0,229,255,0.05)' }}
              >
                <MissionProgressGauge />
              </div>

              <div
                className="border border-cyan-500/25 bg-[rgba(0,15,30,0.45)] p-6 flex flex-col gap-4"
                style={{ boxShadow: '0 0 20px rgba(0,229,255,0.05)' }}
              >
                <div className="text-[clamp(0.6rem,0.7vw,0.75rem)] font-bold tracking-[0.2em] text-cyan-500/50">── NEXT MILESTONE ──</div>
                <div>
                  <div className="text-[clamp(0.85rem,1vw,1.1rem)] font-bold tracking-[0.15em] text-cyan-300">PROXIMA CENTAURI APPROACH</div>
                  <div className="text-[clamp(0.65rem,0.75vw,0.85rem)] tracking-[0.2em] text-cyan-500/60 mt-1">Proxima Centauri approach</div>
                </div>
                <dl className="space-y-1.5 text-[clamp(0.55rem,0.65vw,0.75rem)] tracking-[0.1em]">
                  <div className="flex flex-wrap gap-2">
                    <dt className="text-cyan-500/45 w-44 shrink-0">ESTIMATED ARRIVAL:</dt>
                    <dd className="text-cyan-200/90">YEAR 2500</dd>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <dt className="text-cyan-500/45 w-44 shrink-0">YEARS REMAINING:</dt>
                    <dd className="text-cyan-200/90">1,653</dd>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <dt className="text-cyan-500/45 w-44 shrink-0">DAYS REMAINING:</dt>
                    <dd className="text-cyan-200/90">603,645</dd>
                  </div>
                </dl>
                <div className="text-[clamp(0.5rem,0.55vw,0.65rem)] tracking-[0.2em] text-cyan-500/35">[LIVE COUNTDOWN]</div>
                <div
                  className="font-mono text-[clamp(0.65rem,0.75vw,0.85rem)] tracking-[0.12em] leading-relaxed"
                  style={{ color: '#ffaa00' }}
                >
                  {cd.years.toLocaleString()} YRS · {cd.days} DAYS · {PAD2(cd.hrs)} HRS · {PAD2(cd.mins)} MIN ·{' '}
                  {PAD2(cd.secs)} SEC
                </div>
                <div className="mt-2 pt-3 border-t border-cyan-500/10 text-[clamp(0.5rem,0.58vw,0.68rem)] space-y-1 tracking-[0.08em]">
                  <div className="text-cyan-500/45">PREVIOUS MILESTONE: SOLAR SYSTEM EXIT</div>
                  <div className="text-cyan-500/45">COMPLETED: YEAR 3 · DAY 1,096</div>
                  <div className="text-[#00ff88]/90">STATUS: ✓ ACHIEVED</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 — Timeline */}
        <section>
          <div className="text-[clamp(0.65rem,0.75vw,0.85rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">
            ── MISSION TIMELINE ──
          </div>
          <div className="relative py-10 px-2 overflow-x-auto min-h-[140px]">
            <div className="absolute top-1/2 left-0 right-0 min-w-full h-[1px] bg-cyan-500/30 -translate-y-1/2" />
            <div
              className="absolute top-1/2 left-0 -translate-y-1/2 z-20 pointer-events-none"
              style={{ animation: 'timeline-dot-travel 8s linear infinite' }}
            >
              <div className="relative">
                <div className="absolute right-full top-1/2 -translate-y-1/2 w-[60px] sm:w-[80px] h-[2px] bg-gradient-to-l from-[#00e5ff] to-transparent" />
                <div className="w-2 h-2 rounded-full bg-[#00e5ff] shadow-[0_0_10px_#00e5ff,0_0_20px_rgba(0,229,255,0.4)]" />
              </div>
            </div>
            <div className="flex justify-between relative min-w-[640px] gap-2">
              <TimelineNode year="2058" label="LAUNCH" sub="IGNITION" status="past" />
              <TimelineNode year="2061" label="SOLAR EXIT" sub="LEAVE SOLAR SYSTEM" status="past" />
              <TimelineNode year="NOW" label="YEAR 847" sub="CURRENT" status="active" />
              <TimelineNode year="2500" label="PROXIMA APPROACH" sub="PROXIMA APPROACH" status="future" />
              <TimelineNode year="2650" label="ARRIVAL" sub="ARRIVAL" status="future" />
            </div>
          </div>
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes timeline-dot-travel {
                0% { left: 0%; }
                80% { left: 50%; }
                90% { left: 50%; opacity: 1; }
                100% { left: 50%; opacity: 0; }
              }
            `,
          }} />
        </section>

        {/* Section 3 — Objectives */}
        <section>
          <div className="text-[clamp(0.65rem,0.75vw,0.85rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">
            ── MISSION OBJECTIVES ──
          </div>
          <ol className="space-y-3 max-w-4xl border border-cyan-500/15 bg-[rgba(0,0,0,0.25)] p-4">
            {[
              'Transport human civilization to Proxima Centauri system',
              'Maintain crew hibernation and rotation for 2,500 years',
              'Preserve genetic diversity — minimum 10,000 specialists',
              'Arrive with functional Earth Engine system',
              'Establish new civilization at destination',
            ].map((text, i) => (
              <li key={text} className="flex gap-4 text-[clamp(0.6rem,0.7vw,0.8rem)] tracking-[0.08em] text-cyan-400/90">
                <span className="text-cyan-500/40 font-bold w-8 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <span>{text}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Section 4 — Stats grid */}
        <section>
          <div className="text-[clamp(0.65rem,0.75vw,0.85rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">
            ── KEY STATISTICS ──
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl">
            {[
              ['TOTAL DISTANCE', '4.22 LY'],
              ['ENGINE COUNT', '10,000+'],
              ['CREW SIZE', '350,000'],
              ['FUEL RESERVES', '67.3%'],
              ['HULL INTEGRITY', '99.7%'],
              ['SYSTEMS ONLINE', '847/850'],
            ].map(([label, val]) => (
              <div key={label} className="border border-cyan-500/15 bg-[rgba(0,0,0,0.3)] p-4">
                <div className="text-[9px] text-cyan-500/40 tracking-widest mb-1">{label}</div>
                <div className="text-lg font-bold text-cyan-300">{val}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5 — Log */}
        <section>
          <div className="text-[clamp(0.65rem,0.75vw,0.85rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">
            ── MISSION LOG ──
          </div>
          <div className="max-w-4xl border border-cyan-500/15 bg-[rgba(0,0,0,0.35)] max-h-[320px] overflow-y-auto">
            {missionLogLines.map(line => (
              <div
                key={line}
                className="px-4 py-3 border-b border-cyan-500/10 text-[clamp(0.55rem,0.65vw,0.75rem)] tracking-[0.08em] text-cyan-400/80 font-mono"
              >
                {line}
              </div>
            ))}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
