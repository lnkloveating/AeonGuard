import React, { useEffect, useMemo, useState } from 'react';
import DashboardShell from '../components/DashboardShell';

type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'ALL';

interface LogEntry {
  time: string;
  level: Exclude<LogLevel, 'ALL'>;
  module: string;
  msg: string;
}

const initialLogs: LogEntry[] = [
  { time: '847.12403.14:32:01', level: 'INFO', module: 'LIFE-SUPPORT-生命支持', msg: 'ROUTINE-例行 O₂-气体 SCAN-扫描 complete-完成. All SECTOR-区域 NOMINAL-正常态.' },
  { time: '847.12403.13:15:44', level: 'WARNING', module: 'HABITAT-环境 B1R2', msg: 'O₂-气体 LEVEL-水平 DROP-下降 detected-检测. VALUE-值: 71.3%. THRESHOLD-阈值: 78.0%' },
  { time: '847.12403.12:58:22', level: 'INFO', module: 'AI-ENGINE-推理核心', msg: 'CRISIS-危机 ANALYSIS-分析 initiated-启动. SCANNING-扫描 127 CRYO-舱位.' },
  { time: '847.12403.12:58:35', level: 'INFO', module: 'AI-ENGINE-推理核心', msg: 'RECOMMENDATION-推荐: CHEN_WEI CRYO-047. COMPOSITE-综合 SCORE-评分: 93.6' },
  { time: '847.12403.12:59:01', level: 'INFO', module: 'OVERRIDE-人工决策 SYS', msg: 'DECISION-决策 DEC-001 submitted-提交 for HUMAN-人工 REVIEW-审批.' },
  { time: '847.12403.11:30:15', level: 'INFO', module: 'CREW-机组 ROTATION-轮换', msg: 'ROTATION-轮换 CYCLE-周期 847-Q3 completed-完成 successfully-成功.' },
  { time: '847.12403.09:22:33', level: 'ERROR', module: 'ENGINE-发动机 GROUP-7', msg: 'FUEL-燃料 INJECTOR-注射器 ANOMALY-异常 detected-检测. AUTO-REPAIR-自动修复 initiated-启动.' },
  { time: '847.12403.09:22:55', level: 'INFO', module: 'ENGINE-发动机 GROUP-7', msg: 'AUTO-REPAIR-自动修复 successful-成功. OUTPUT-输出 restored-恢复 to 98.4%' },
  { time: '847.12402.23:11:08', level: 'INFO', module: 'NAV-导航 SYS-系统', msg: 'TRAJECTORY-轨迹 CORRECTION-修正 BURN-点火 complete-完成. +0.002% VELOCITY-速度.' },
  { time: '847.12402.18:45:30', level: 'WARNING', module: 'RAD-辐射 MONITOR-监控', msg: 'B3-E1 RAD-辐射 SPIKE-峰值: 89.3 mSv. MONITORING-监控中.' },
  { time: '847.12401.06:00:00', level: 'INFO', module: 'SYS-系统 DIAGNOSTIC-诊断', msg: 'DAILY-日常 DIAGNOSTIC-诊断 complete-完成. All 850 SYSTEMS-系统 checked-检查.' },
  { time: '847.12400.14:22:11', level: 'CRITICAL', module: 'PRS-气压 SYS-系统', msg: 'B2-I1 PRS-气压 DROP-下降 to 98.2 kPa. ALERT-警报 triggered-触发.' },
  { time: '847.12400.14:23:45', level: 'INFO', module: 'AI-ENGINE-推理核心', msg: 'SPECIALIST-专家 SMITH_J RECOMMENDED-推荐 for PRS-气压 REPAIR-修复.' },
  { time: '847.12400.15:01:22', level: 'INFO', module: 'OVERRIDE-人工决策 SYS', msg: 'DECISION-决策 accepted-接受 by ADMIN_01. SMITH_J CRYO-舱位 activated-激活.' },
  { time: '847.12399.08:30:00', level: 'INFO', module: 'HIBERNATION-休眠 MON-监控', msg: 'CRYO-047 STATUS-状态 NOMINAL-正常态. BIO-SCORE-生物评分: 94.' },
];

const autoLogs: Omit<LogEntry, 'time'>[] = [
  { level: 'INFO', module: 'LIFE-SUPPORT-生命支持', msg: 'O₂-气体 SCAN-扫描 NOMINAL-正常态. All SECTOR-区域 within RANGE-范围.' },
  { level: 'INFO', module: 'NAV-导航 SYS-系统', msg: 'TRAJECTORY-轨迹 NOMINAL-正常态. HEADING-航向: PROXIMA-比邻星 CENTAURI.' },
  { level: 'INFO', module: 'HIBERNATION-休眠 MON', msg: 'CRYO-舱位 SCAN-扫描 complete-完成. 127/127 NOMINAL-正常态.' },
  { level: 'INFO', module: 'ENGINE-发动机 SYS-系统', msg: 'ENGINE-发动机 OUTPUT-输出: 98.4%. All GROUPS-组 NOMINAL-正常态.' },
  { level: 'INFO', module: 'AI-ENGINE-推理核心', msg: 'STANDBY-待命 MODE-模式. No CRISIS-危机 detected-检测. MONITORING-监控中.' },
];

function LogRow({ entry }: { entry: LogEntry }) {
  const { level } = entry;
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        padding: '4px 8px',
        borderBottom: '1px solid rgba(0,229,255,0.05)',
        fontSize: 'clamp(0.5rem,0.65vw,0.7rem)',
        fontFamily: 'monospace',
        background:
          level === 'CRITICAL'
            ? 'rgba(255,0,0,0.05)'
            : level === 'ERROR'
              ? 'rgba(255,100,0,0.05)'
              : level === 'WARNING'
                ? 'rgba(255,170,0,0.03)'
                : 'transparent',
      }}
    >
      <span style={{ color: 'rgba(0,229,255,0.3)', flexShrink: 0 }}>{entry.time}</span>
      <span
        style={{
          flexShrink: 0,
          width: '70px',
          fontWeight: 'bold',
          color:
            level === 'CRITICAL' ? '#ff4444' : level === 'ERROR' ? '#ff6644' : level === 'WARNING' ? '#ffaa00' : '#00ff88',
        }}
      >
        [{entry.level}]
      </span>
      <span style={{ color: 'rgba(0,229,255,0.5)', flexShrink: 0, minWidth: '160px', maxWidth: '220px' }}>{entry.module}</span>
      <span style={{ color: 'rgba(255,255,255,0.7)' }}>{entry.msg}</span>
    </div>
  );
}

export default function SysLogPage() {
  const [logEntries, setLogEntries] = useState<LogEntry[]>(initialLogs);
  const [levelFilter, setLevelFilter] = useState<LogLevel>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const iv = window.setInterval(() => {
      const log = autoLogs[Math.floor(Math.random() * autoLogs.length)];
      const now = new Date();
      const timeStr = `847.12403.${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLogEntries(prev => [{ time: timeStr, ...log }, ...prev]);
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logEntries.filter(e => {
      if (levelFilter !== 'ALL' && e.level !== levelFilter) return false;
      if (!q) return true;
      return (
        e.msg.toLowerCase().includes(q) ||
        e.module.toLowerCase().includes(q) ||
        e.time.toLowerCase().includes(q) ||
        e.level.toLowerCase().includes(q)
      );
    });
  }, [logEntries, levelFilter, search]);

  const stats = useMemo(() => {
    const src = filtered;
    const count = src.length;
    const n = (lvl: Exclude<LogLevel, 'ALL'>) => src.filter(e => e.level === lvl).length;
    return {
      count,
      info: n('INFO'),
      warning: n('WARNING'),
      error: n('ERROR'),
      critical: n('CRITICAL'),
    };
  }, [filtered]);

  return (
    <DashboardShell archiveActive="syslog" typewriterTitle="SYSTEM LOG">
      <div className="p-6 flex flex-col gap-6 pb-16">
        <section className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'] as const).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setLevelFilter(l)}
                className={`px-3 py-1.5 text-[clamp(0.55rem,0.6vw,0.7rem)] tracking-widest border transition-colors ${
                  levelFilter === l
                    ? 'border-cyan-400 bg-cyan-500/15 text-cyan-300'
                    : 'border-cyan-500/20 text-cyan-500/60 hover:border-cyan-500/40'
                }`}
              >
                [{l}]
              </button>
            ))}
          </div>
          <input
            placeholder="FILTER LOG ENTRIES..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full lg:max-w-md bg-[rgba(0,20,40,0.6)] border border-cyan-500/25 px-3 py-2 text-[clamp(0.6rem,0.65vw,0.75rem)] tracking-widest text-cyan-200 placeholder:text-cyan-500/30 outline-none focus:border-cyan-400/50"
          />
        </section>

        <section className="border border-cyan-500/20 bg-[rgba(0,8,20,0.5)] max-h-[min(480px,50vh)] overflow-y-auto">
          {filtered.map((entry, i) => (
            <LogRow key={`${entry.time}-${i}`} entry={entry} />
          ))}
        </section>

        <section className="text-[clamp(0.6rem,0.65vw,0.75rem)] tracking-[0.12em] text-cyan-500/70 font-mono border border-cyan-500/15 bg-[rgba(0,0,0,0.25)] p-4">
          TOTAL ENTRIES: <span className="text-cyan-300">{stats.count}</span>
          <span className="mx-2 opacity-40">|</span>
          INFO: <span className="text-[#00ff88]">{stats.info}</span>
          <span className="mx-2 opacity-40">|</span>
          WARNING: <span className="text-amber-400">{stats.warning}</span>
          <span className="mx-2 opacity-40">|</span>
          ERROR: <span className="text-orange-400">{stats.error}</span>
          <span className="mx-2 opacity-40">|</span>
          CRITICAL: <span className="text-red-400">{stats.critical}</span>
        </section>
      </div>
    </DashboardShell>
  );
}
