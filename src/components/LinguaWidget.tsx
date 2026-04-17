import React, { useEffect, useRef, useState } from 'react';

const lexicon = [
  // ENVIRONMENT
  { hybrid: 'O₂-气体', zh: '氧气', en: 'Oxygen', category: 'ENV' },
  { hybrid: 'RAD-辐射值', zh: '辐射', en: 'Radiation', category: 'ENV' },
  { hybrid: 'PRS-气压态', zh: '气压', en: 'Pressure', category: 'ENV' },
  { hybrid: 'TEMP-温度值', zh: '温度', en: 'Temperature', category: 'ENV' },
  { hybrid: 'VENT-通风流', zh: '通风', en: 'Ventilation', category: 'ENV' },
  // HIBERNATION
  { hybrid: 'CRYO-舱位', zh: '休眠舱', en: 'Hibernation Pod', category: 'CRYO' },
  { hybrid: 'WAKE-seq启动', zh: '唤醒程序', en: 'Wake Sequence', category: 'CRYO' },
  { hybrid: 'DORMANT-态', zh: '休眠中', en: 'Dormant', category: 'CRYO' },
  { hybrid: 'BIO-评分', zh: '生物评分', en: 'Bio Score', category: 'CRYO' },
  { hybrid: 'META-代谢率', zh: '代谢率', en: 'Metabolism Rate', category: 'CRYO' },
  { hybrid: 'ROT-轮换cycle', zh: '轮换周期', en: 'Rotation Cycle', category: 'CRYO' },
  // EMERGENCY
  { hybrid: 'CRISIS-alert触发', zh: '危机警报', en: 'Crisis Alert', category: 'EMG' },
  { hybrid: 'EVAC-撤离protocol', zh: '疏散预案', en: 'Evacuation Protocol', category: 'EMG' },
  { hybrid: 'EMG-紧急mode', zh: '紧急状态', en: 'Emergency Mode', category: 'EMG' },
  { hybrid: 'DISPATCH-派遣cmd', zh: '派遣指令', en: 'Dispatch Command', category: 'EMG' },
  // SYSTEM
  { hybrid: 'AI-engine核心', zh: 'AI推理引擎', en: 'AI Engine', category: 'SYS' },
  { hybrid: 'OVERRIDE-人工干预', zh: '人工推翻', en: 'Human Override', category: 'SYS' },
  { hybrid: 'DECISION-决策queue', zh: '决策队列', en: 'Decision Queue', category: 'SYS' },
  { hybrid: 'AUTH-授权required', zh: '需要授权', en: 'Authorization Required', category: 'SYS' },
  { hybrid: 'DIAGNOSTIC-诊断sys', zh: '系统诊断', en: 'System Diagnostic', category: 'SYS' },
  // STATUS
  { hybrid: 'NOMINAL-正常态', zh: '正常', en: 'Nominal', category: 'STATUS' },
  { hybrid: 'WARN-警告level', zh: '警告', en: 'Warning', category: 'STATUS' },
  { hybrid: 'CRIT-危急state', zh: '危急', en: 'Critical', category: 'STATUS' },
  { hybrid: 'STABLE-稳定态', zh: '稳定', en: 'Stable', category: 'STATUS' },
  // MISSION
  { hybrid: 'NAV-导航sys', zh: '导航系统', en: 'Navigation System', category: 'MISSION' },
  { hybrid: 'EARTH-engine推进', zh: '地球发动机', en: 'Earth Engine', category: 'MISSION' },
  { hybrid: 'PROXIMA-目标星', zh: '比邻星', en: 'Proxima Centauri', category: 'MISSION' },
  { hybrid: 'WANDER-earth计划', zh: '流浪地球计划', en: 'Wandering Earth Project', category: 'MISSION' },
  { hybrid: 'TRAJ-轨迹path', zh: '飞行轨迹', en: 'Flight Trajectory', category: 'MISSION' },
  // CREW
  { hybrid: 'SPEC-专家unit', zh: '专业人员', en: 'Specialist', category: 'CREW' },
  { hybrid: 'SKILL-匹配度', zh: '技能匹配', en: 'Skill Match', category: 'CREW' },
  { hybrid: 'EQUITY-公平指数', zh: '公平指数', en: 'Equity Index', category: 'CREW' },
  { hybrid: 'ROSTER-机组list', zh: '机组名单', en: 'Crew Roster', category: 'CREW' },
];

export default function LinguaWidget() {
  const [pos, setPos] = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth - 80 : 100,
    y: typeof window !== 'undefined' ? window.innerHeight - 80 : 100,
  }));
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragMovedRef = useRef(false);

  const [showWidget, setShowWidget] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedEntry, setSelectedEntry] = useState<(typeof lexicon)[0] | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragMovedRef.current = false;
    setIsDragging(true);
    setDragOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPos(prev => {
        const nx = e.clientX - dragOffset.x;
        const ny = e.clientY - dragOffset.y;
        if (Math.abs(nx - prev.x) > 3 || Math.abs(ny - prev.y) > 3) dragMovedRef.current = true;
        return { x: nx, y: ny };
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const filtered = lexicon.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      item.hybrid.toLowerCase().includes(q) ||
      item.zh.includes(q) ||
      item.en.toLowerCase().includes(q);
    const matchCategory = activeCategory === 'ALL' || item.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowWidget(true);
          }
        }}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          zIndex: 9999,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'rgba(0,8,20,0.95)',
          border: '2px solid rgba(0,229,255,0.6)',
          boxShadow: '0 0 20px rgba(0,229,255,0.3)',
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onClick={() => {
          if (dragMovedRef.current) return;
          setShowWidget(true);
        }}
      >
        <span style={{ fontSize: '18px' }}>文</span>
        <span
          style={{
            fontSize: '7px',
            fontFamily: 'monospace',
            color: 'rgba(0,229,255,0.6)',
            letterSpacing: '0.1em',
          }}
        >
          LINGUA
        </span>
      </div>

      {showWidget && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(pos.x - 320, window.innerWidth - 400),
            top: Math.max(pos.y - 500, 60),
            zIndex: 10000,
            width: '420px',
            height: '520px',
            background: 'rgba(0,5,15,0.97)',
            border: '1px solid rgba(0,229,255,0.3)',
            boxShadow: '0 0 40px rgba(0,229,255,0.15)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(0,229,255,0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0,229,255,0.05)',
              flexShrink: 0,
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#00e5ff',
                  letterSpacing: '0.3em',
                  fontWeight: 'bold',
                }}
              >
                文 LINGUA
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '9px',
                  color: 'rgba(0,229,255,0.4)',
                  marginLeft: '8px',
                  letterSpacing: '0.2em',
                }}
              >
                THREE-COLUMN LEXICON
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowWidget(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(0,229,255,0.5)',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(0,229,255,0.1)', flexShrink: 0 }}>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="SEARCH TERMS..."
              style={{
                width: '100%',
                background: 'rgba(0,229,255,0.05)',
                border: '1px solid rgba(0,229,255,0.2)',
                color: '#00e5ff',
                fontFamily: 'monospace',
                fontSize: '11px',
                padding: '6px 10px',
                outline: 'none',
                letterSpacing: '0.1em',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              padding: '6px 12px',
              borderBottom: '1px solid rgba(0,229,255,0.15)',
              background: 'rgba(0,229,255,0.05)',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#ffaa00', letterSpacing: '0.2em' }}>
              混合语 HYBRID
            </span>
            <span style={{ fontSize: '9px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.2em' }}>
              中文 ZH
            </span>
            <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#00e5ff', letterSpacing: '0.2em' }}>
              English EN
            </span>
          </div>

          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                padding: '6px 10px',
                borderBottom: '1px solid rgba(0,229,255,0.1)',
                flexShrink: 0,
              }}
            >
              {['ALL', 'ENV', 'CRYO', 'EMG', 'SYS', 'STATUS', 'MISSION', 'CREW'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '8px',
                    fontFamily: 'monospace',
                    letterSpacing: '0.1em',
                    cursor: 'pointer',
                    background: activeCategory === cat ? 'rgba(0,229,255,0.15)' : 'transparent',
                    border: `1px solid ${activeCategory === cat ? '#00e5ff' : 'rgba(0,229,255,0.2)'}`,
                    color: activeCategory === cat ? '#00e5ff' : 'rgba(0,229,255,0.4)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {filtered.map((item, i) => (
              <div
                key={`${item.hybrid}-${item.en}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedEntry(item)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedEntry(item);
                  }
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  padding: '5px 12px',
                  borderBottom: '1px solid rgba(0,229,255,0.05)',
                  cursor: 'pointer',
                  background:
                    selectedEntry?.hybrid === item.hybrid
                      ? 'rgba(0,229,255,0.08)'
                      : i % 2 === 0
                        ? 'transparent'
                        : 'rgba(255,255,255,0.01)',
                }}
              >
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#ffaa00' }}>{item.hybrid}</span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{item.zh}</span>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#00e5ff' }}>{item.en}</span>
              </div>
            ))}
          </div>

          {selectedEntry && (
            <div
              style={{
                borderTop: '1px solid rgba(0,229,255,0.15)',
                padding: '12px',
                background: 'rgba(0,229,255,0.03)',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: '9px',
                  color: 'rgba(0,229,255,0.4)',
                  letterSpacing: '0.2em',
                  marginBottom: '8px',
                }}
              >
                ── SELECTED TERM ──
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  gap: '6px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
              >
                <span style={{ color: 'rgba(0,229,255,0.4)', fontSize: '9px' }}>LAYER 1 SOURCE</span>
                <span style={{ color: 'white' }}>{selectedEntry.zh}</span>
                <span style={{ color: 'rgba(0,229,255,0.4)', fontSize: '9px' }}>LAYER 2 ENGLISH</span>
                <span style={{ color: '#00e5ff' }}>{selectedEntry.en}</span>
                <span style={{ color: 'rgba(0,229,255,0.4)', fontSize: '9px' }}>LAYER 3 HYBRID</span>
                <span style={{ color: '#ffaa00' }}>{selectedEntry.hybrid}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
