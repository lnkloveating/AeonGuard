import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import {
  Terminal, Home, Database, AlertTriangle, Cpu, Zap, FileText,
  Users, ClipboardList, Settings, LogOut, RefreshCw,
  ChevronLeft, ChevronRight, Languages,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis, ReferenceLine,
} from 'recharts';

// ─── Types & Data ────────────────────────────────────────────────

type FloorId = 'B1' | 'B2' | 'B3' | 'B4';
type ZoneStatus = 'NOMINAL' | 'WARNING' | 'CRITICAL';

interface Zone { id: string; label: string; type: string; status: ZoneStatus }
interface AlertEvent { time: string; icon: string; text: string; color: string }

const FLOOR_NAMES: Record<FloorId, string> = { B1: '居住层', B2: '工业层', B3: '能源层', B4: '核心层' };

const FLOOR_ZONES: Record<FloorId, Zone[]> = {
  B1: [
    { id: 'B1-R1', label: '居民区 A', type: 'RESIDENTIAL', status: 'NOMINAL' },
    { id: 'B1-R2', label: '居民区 B', type: 'RESIDENTIAL', status: 'WARNING' },
  ],
  B2: [
    { id: 'B2-I1', label: '工业区 A', type: 'INDUSTRIAL', status: 'NOMINAL' },
    { id: 'B2-I2', label: '工业区 B', type: 'INDUSTRIAL', status: 'NOMINAL' },
  ],
  B3: [
    { id: 'B3-E1', label: '能源区 A', type: 'ENERGY', status: 'NOMINAL' },
    { id: 'B3-E2', label: '能源区 B', type: 'ENERGY', status: 'NOMINAL' },
  ],
  B4: [
    { id: 'B4-C1', label: '反应堆区 A', type: 'REACTOR', status: 'NOMINAL' },
    { id: 'B4-C2', label: '反应堆区 B', type: 'REACTOR', status: 'NOMINAL' },
  ],
};

const ZONE_DATA: Record<string, { oxygen: number; radiation: number; pressure: number }> = {
  'B1-R1': { oxygen: 85.2, radiation: 12.4, pressure: 101.3 },
  'B1-R2': { oxygen: 71.3, radiation: 15.1, pressure: 98.2 },
  'B2-I1': { oxygen: 83.1, radiation: 18.5, pressure: 103.2 },
  'B2-I2': { oxygen: 84.0, radiation: 11.2, pressure: 105.1 },
  'B3-E1': { oxygen: 80.5, radiation: 22.3, pressure: 99.8 },
  'B3-E2': { oxygen: 82.1, radiation: 19.7, pressure: 101.5 },
  'B4-C1': { oxygen: 42.1, radiation: 89.3, pressure: 142.5 },
  'B4-C2': { oxygen: 38.7, radiation: 94.1, pressure: 156.2 },
};

// ─── Atmospheric background canvas (environment / chemical feel) ─

type GasParticle = { kind: 'o2' | 'hazard'; x: number; y: number; vy: number; phase: number };
type PressureWave = { cx: number; cy: number; start: number };
type Spark = { x: number; y: number; start: number };
type NetNode = { x: number; y: number; vx: number; vy: number };
type StreamCell = { char: string; y: number };

const DATA_STREAM_POOL = ['O', '₂', 'N', '%', '▲', '▼', '·', '|', '—', 'mSv', 'kPa'] as const;

function HabitatAtmosphereCanvas({ crisisActive }: { crisisActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const crisisRef = useRef(crisisActive);
  crisisRef.current = crisisActive;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const particles: GasParticle[] = [];
    for (let i = 0; i < 20; i++) {
      particles.push({
        kind: 'o2',
        x: Math.random() * w,
        y: Math.random() * h,
        vy: 0.2 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
      });
    }
    for (let i = 0; i < 20; i++) {
      particles.push({
        kind: 'hazard',
        x: Math.random() * w,
        y: Math.random() * h,
        vy: 0.2 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const waves: PressureWave[] = [];
    let nextWaveAt = performance.now() + 4000 + Math.random() * 2000;
    const sparks: Spark[] = [];
    let wasCrisis = false;

    const netNodes: NetNode[] = [];
    for (let i = 0; i < 35; i++) {
      netNodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
      });
    }

    const streamCols: { cells: StreamCell[]; dropEvery: number; speed: number; pool: string[]; crisisRed: boolean }[] = [];
    for (let c = 0; c < 8; c++) {
      const poolStart = c % 4;
      const pool = [
        ...DATA_STREAM_POOL.slice(poolStart),
        ...DATA_STREAM_POOL.slice(0, poolStart),
      ];
      streamCols.push({
        cells: [],
        dropEvery: 8 + (c % 5) + Math.floor(c / 3),
        speed: 0.9 + c * 0.15,
        pool,
        crisisRed: c % 3 === 0 || c === 5,
      });
    }
    let frameCount = 0;

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    let rafId = 0;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(48, now - last) / 16.67;
      last = now;
      const crisis = crisisRef.current;
      frameCount++;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.y -= p.vy * dt;
        p.x += Math.sin(now * 0.0008 + p.phase) * 0.12 * dt;
        if (p.y < -30) {
          p.y = h + Math.random() * 40;
          p.x = Math.random() * w;
        }
        if (p.x < -20) p.x = w + 10;
        if (p.x > w + 20) p.x = -10;
      }

      if (now >= nextWaveAt && waves.length < 3) {
        waves.push({ cx: Math.random() * w, cy: Math.random() * h, start: now });
        nextWaveAt = now + 4000 + Math.random() * 2000;
      }

      for (let i = waves.length - 1; i >= 0; i--) {
        const wave = waves[i];
        const t = (now - wave.start) / 2000;
        if (t >= 1) {
          waves.splice(i, 1);
          continue;
        }
        const radius = t * 200;
        const alpha = (1 - t) * 0.08;
        ctx.strokeStyle = `rgba(0,229,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(wave.cx, wave.cy, Math.max(1, radius), 0, Math.PI * 2);
        ctx.stroke();
      }

      for (const p of particles) {
        if (p.kind === 'o2') {
          const dx = 7;
          ctx.fillStyle = 'rgba(0,229,255,0.12)';
          ctx.strokeStyle = 'rgba(0,229,255,0.12)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x + dx, p.y, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(p.x + 3, p.y);
          ctx.lineTo(p.x + dx - 3, p.y);
          ctx.stroke();
        } else {
          ctx.fillStyle = 'rgba(255,100,0,0.08)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (crisis) {
        if (!wasCrisis) {
          const n = 5 + Math.floor(Math.random() * 4);
          for (let i = 0; i < n; i++) {
            sparks.push({ x: Math.random() * w, y: Math.random() * h, start: now });
          }
        }
        wasCrisis = true;
        if (sparks.length < 8 && Math.random() < 0.18) {
          sparks.push({ x: Math.random() * w, y: Math.random() * h, start: now });
        }
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          const age = now - s.start;
          if (age > 500) {
            sparks.splice(i, 1);
            continue;
          }
          const a = (1 - age / 500) * 0.3;
          ctx.fillStyle = `rgba(255,50,50,${a})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        wasCrisis = false;
        sparks.length = 0;
      }

      const scanY = ((now % 20000) / 20000) * (h + 60) - 30;
      ctx.strokeStyle = 'rgba(0,229,255,0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(w, scanY);
      ctx.stroke();

      // ── Effect 5: connected particle network ──
      const maxNet = crisis ? 150 : 120;
      const lineBase = crisis ? 0.1 : 0.08;
      for (const n of netNodes) {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < 0) n.x += w; else if (n.x > w) n.x -= w;
        if (n.y < 0) n.y += h; else if (n.y > h) n.y -= h;
      }
      for (let i = 0; i < netNodes.length; i++) {
        for (let j = i + 1; j < netNodes.length; j++) {
          const a = netNodes[i];
          const b = netNodes[j];
          const dist = Math.hypot(b.x - a.x, b.y - a.y);
          if (dist < maxNet && dist > 0) {
            const alpha = (1 - dist / maxNet) * lineBase;
            ctx.strokeStyle = crisis ? `rgba(255,50,50,${alpha})` : `rgba(0,229,255,${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.fillStyle = crisis ? 'rgba(255,50,50,0.35)' : 'rgba(0,229,255,0.25)';
      for (const n of netNodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Effect 6: data stream columns ──
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const colW = w / 8;
      streamCols.forEach((col, ci) => {
        const cx = (ci + 0.5) * colW;
        const crisisCol = crisis && col.crisisRed;
        for (let k = col.cells.length - 1; k >= 0; k--) {
          col.cells[k].y += col.speed * dt;
          if (col.cells[k].y > h + 24) col.cells.splice(k, 1);
        }
        if ((frameCount + ci * 2) % col.dropEvery === 0) {
          const pick = col.pool[Math.floor(Math.random() * col.pool.length)];
          col.cells.unshift({ char: pick, y: -8 });
        }
        for (const cell of col.cells) {
          ctx.fillStyle = crisisCol ? 'rgba(255,50,50,0.08)' : 'rgba(0,229,255,0.06)';
          ctx.fillText(cell.char, cx, cell.y);
        }
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: 'transparent' }}
      aria-hidden
    />
  );
}

function seededTrend(base: { oxygen: number; radiation: number; pressure: number }) {
  return Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}h`,
    oxygen: +(base.oxygen + Math.sin(i * 0.7) * 2.5 + Math.cos(i * 1.3) * 1.2).toFixed(1),
    radiation: +(base.radiation + Math.sin(i * 0.5 + 1) * 1.8 + Math.cos(i * 0.9) * 0.8).toFixed(1),
    pressure: +(base.pressure + Math.sin(i * 0.6 + 2) * 1.5 + Math.cos(i * 1.1) * 0.6).toFixed(1),
  }));
}

// ─── SVG Semicircle Gauge ────────────────────────────────────────

function SemiGauge({ value, min, max, unit, label, safeMin, safeMax, color }: {
  value: number; min: number; max: number; unit: string;
  label: string; safeMin: number; safeMax: number; color: string;
}) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const isWarning = value < safeMin || value > safeMax;
  const angle = Math.PI + pct * Math.PI;
  const cx = 100, cy = 90, r = 70;

  const describeArc = (start: number, end: number) => {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const needleX = cx + (r - 15) * Math.cos(angle);
  const needleY = cy + (r - 15) * Math.sin(angle);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <svg width="200" height="110" viewBox="0 0 200 110">
        <path d={describeArc(Math.PI, 2 * Math.PI)}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
        <path d={describeArc(Math.PI + ((safeMin - min) / (max - min)) * Math.PI, Math.PI + ((safeMax - min) / (max - min)) * Math.PI)}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="14" />
        <path d={describeArc(Math.PI, angle)}
          fill="none" stroke={isWarning ? '#ffaa00' : color}
          strokeWidth="12" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${isWarning ? '#ffaa00' : color})` }} />
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const a = Math.PI + t * Math.PI;
          const x1 = cx + (r - 18) * Math.cos(a);
          const y1 = cy + (r - 18) * Math.sin(a);
          const x2 = cx + (r - 8) * Math.cos(a);
          const y2 = cy + (r - 8) * Math.sin(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,229,255,0.3)" strokeWidth="1.5" />;
        })}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="white" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.8 }} />
        <circle cx={cx} cy={cy} r="4" fill="white" opacity="0.8" />
        <text x={cx} y={cy - 18} textAnchor="middle" fill={isWarning ? '#ffaa00' : color} fontSize="20" fontFamily="monospace" fontWeight="bold">
          {value.toFixed(1)}
        </text>
        <text x={cx} y={cy - 4} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">
          {unit}
        </text>
        <text x={cx - r + 5} y={cy + 16} fill="rgba(0,229,255,0.3)" fontSize="8" fontFamily="monospace">{min}</text>
        <text x={cx + r - 5} y={cy + 16} fill="rgba(0,229,255,0.3)" fontSize="8" fontFamily="monospace" textAnchor="end">{max}</text>
      </svg>
      <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(0,229,255,0.6)', marginTop: '-8px' }}>
        {label}
      </div>
      <div style={{
        marginTop: '4px', padding: '2px 10px',
        border: `1px solid ${isWarning ? '#ffaa00' : color}`,
        color: isWarning ? '#ffaa00' : color,
        fontSize: '9px', fontFamily: 'monospace', letterSpacing: '0.15em',
        animation: isWarning ? 'warningPulse 1.5s infinite' : 'none',
      }}>
        {isWarning ? '⚠ WARNING' : '✓ NOMINAL'}
      </div>
    </div>
  );
}

// ─── Environment Heatmap ─────────────────────────────────────────

const HEATMAP_SENSORS = [
  { key: 'oxygen' as const, label: 'O₂ OXYGEN', unit: '%', min: 60, max: 100, safeMin: 78, safeMax: 95, color: '#00e5ff' },
  { key: 'radiation' as const, label: 'RAD RADIATION', unit: 'mSv', min: 0, max: 50, safeMin: 0, safeMax: 25, color: '#00ff88' },
  { key: 'pressure' as const, label: 'PRS PRESSURE', unit: 'kPa', min: 85, max: 115, safeMin: 95, safeMax: 110, color: '#ffaa00' },
];

const ZONE_GRID = [
  ['B1-R1', 'B1-R2', 'B2-I1', 'B2-I2'],
  ['B3-E1', 'B3-E2', 'B4-C1', 'B4-C2'],
];

const ZONE_SHORT_LABELS: Record<string, string> = {
  'B1-R1': '居民A', 'B1-R2': '居民B',
  'B2-I1': '工业A', 'B2-I2': '工业B',
  'B3-E1': '能源A', 'B3-E2': '能源B',
  'B4-C1': '核心A', 'B4-C2': '核心B',
};

function getHeatColor(value: number, min: number, max: number, safeMin: number, safeMax: number) {
  if (value < safeMin || value > safeMax) return 'rgba(255,100,0,0.6)';
  const pct = (value - min) / (max - min);
  if (pct > 0.7) return 'rgba(0,229,255,0.5)';
  if (pct > 0.4) return 'rgba(0,200,100,0.5)';
  return 'rgba(255,200,0,0.4)';
}

function EnvironmentHeatmap({ selectedZone, onSelectZone }: {
  selectedZone: string; onSelectZone: (id: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
      {HEATMAP_SENSORS.map(sensor => (
        <div key={sensor.key} style={{ border: '1px solid rgba(0,229,255,0.1)', padding: '12px', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: sensor.color, letterSpacing: '0.2em', marginBottom: '10px' }}>
            {sensor.label}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
            {ZONE_GRID.flat().map(zoneId => {
              const val = ZONE_DATA[zoneId][sensor.key];
              
              let min = sensor.min; let max = sensor.max;
              let safeMin = sensor.safeMin; let safeMax = sensor.safeMax;
              if (zoneId.startsWith('B4')) {
                if (sensor.key === 'oxygen') { min = 20; max = 100; safeMin = 35; safeMax = 50; }
                if (sensor.key === 'radiation') { min = 0; max = 150; safeMin = 0; safeMax = 100; }
                if (sensor.key === 'pressure') { min = 100; max = 200; safeMin = 130; safeMax = 170; }
              }
              const bgColor = getHeatColor(val, min, max, safeMin, safeMax);
              const isSelected = selectedZone === zoneId;
              return (
                <div key={zoneId} onClick={() => onSelectZone(zoneId)}
                  style={{
                    background: bgColor,
                    border: isSelected ? `2px solid ${sensor.color}` : '1px solid rgba(255,255,255,0.1)',
                    padding: '6px 4px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                  }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' }}>
                    {ZONE_SHORT_LABELS[zoneId]}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', color: 'white', marginTop: '2px' }}>
                    {val.toFixed(1)}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '7px', color: 'rgba(255,255,255,0.4)' }}>
                    {sensor.unit}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', background: 'rgba(255,100,0,0.6)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '7px', color: 'rgba(255,255,255,0.3)' }}>WARNING</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', background: 'rgba(0,200,100,0.5)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '7px', color: 'rgba(255,255,255,0.3)' }}>NORMAL</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '8px', height: '8px', background: 'rgba(0,229,255,0.5)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '7px', color: 'rgba(255,255,255,0.3)' }}>OPTIMAL</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 3D Habitat Viewer ───────────────────────────────────────────

function Habitat3DViewer({ activeFloor, selectedZone, zoneStatuses }: { activeFloor: string, selectedZone: string, zoneStatuses: Record<string, ZoneStatus> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const b3ObjectsRef = useRef<THREE.Object3D[]>([]);
  const b4ObjectsRef = useRef<{ mesh: THREE.Object3D, isLight?: boolean, isRing?: boolean, ringIndex?: number }[]>([]);
  const timeRef = useRef(0);
  const activeFloorRef = useRef(activeFloor);
  
  useEffect(() => { activeFloorRef.current = activeFloor; }, [activeFloor]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x000810);
    scene.fog = new THREE.FogExp2(0x000d1a, 0.0008);

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 3000);
    camera.position.set(0, 300, 600);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '1';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = false;
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Attach refs for external effects early
    (container as any)._camera = camera;
    (container as any)._controls = controls;

    // Lighting
    const ambient = new THREE.AmbientLight(0x112233, 1.2);
    scene.add(ambient);
    (container as any)._ambientLight = ambient;

    const topLight = new THREE.DirectionalLight(0x00aaff, 0.6);
    topLight.position.set(0, 500, 0);
    scene.add(topLight);

    const bottomLight = new THREE.PointLight(0xff6600, 1.2, 800);
    bottomLight.position.set(0, -200, 0);
    scene.add(bottomLight);

    const rimLight = new THREE.DirectionalLight(0x00e5ff, 0.3);
    rimLight.position.set(0, 100, 500);
    scene.add(rimLight);

    // B3 Energy Towers (Procedural Additions)
    const towerGeo = new THREE.CylinderGeometry(8, 8, 120, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.8, roughness: 0.2 });
    const positions = [ [-100, 60, -80], [100, 60, -80], [-100, 60, 80], [100, 60, 80] ];
    positions.forEach(pos => {
      const tower = new THREE.Mesh(towerGeo, towerMat);
      tower.position.set(pos[0], pos[1], pos[2]);
      const l = new THREE.PointLight(0xffaa00, 1, 300);
      l.position.set(0, 60, 0); // top of cylinder
      tower.add(l);
      tower.visible = false; // Hide initially
      scene.add(tower);
      b3ObjectsRef.current.push(tower);
    });

    // Models
    const loader = new GLTFLoader();
    const modelConfigs = [
      { file: '/models/r1.glb', position: [-150, 0, 0], name: 'r1', zone: 'B1-R1', label: '居民区 A' },
      { file: '/models/r2.glb', position: [150, 0, 0],  name: 'r2', zone: 'B1-R2', label: '居民区 B' },
      { file: '/models/i1.glb', position: [-150, 0, 0], name: 'i1', zone: 'B2-I1', label: '工业区 A' },
      { file: '/models/i2.glb', position: [150, 0, 0],  name: 'i2', zone: 'B2-I2', label: '工业区 B' },
    ];

    const modelsMap = new Map<string, THREE.Group>();

    modelConfigs.forEach(config => {
      loader.load(config.file, (gltf) => {
        const model = gltf.scene;
        model.position.set(...(config.position as [number, number, number]));

        const isResidential = config.name.toLowerCase().startsWith('r');
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(isResidential ? 0x0a2a3a : 0x1a1200),
              emissive: new THREE.Color(isResidential ? 0x003355 : 0x331800),
              emissiveIntensity: 0.4,
              metalness: 0.7,
              roughness: 0.4,
            });
            const edges = new THREE.EdgesGeometry(child.geometry);
            const lineMat = new THREE.LineBasicMaterial({
              color: isResidential ? 0x00e5ff : 0xffaa00,
              transparent: true,
              opacity: 0.25,
            });
            child.add(new THREE.LineSegments(edges, lineMat));
          }
        });
        scene.add(model);
        modelsMap.set(config.zone, model);
      });
    });

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    // Need a ResizeObserver because flex layout could resize the div without window resize event
    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(container);

    let rafId: number;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      
      const t = timeRef.current;
      timeRef.current += 0.01;
      
      const floor = activeFloorRef.current;
      if (floor === 'B3') {
        b3ObjectsRef.current.forEach((tower, i) => {
          const light = tower.children.find(c => c instanceof THREE.PointLight) as THREE.PointLight | undefined;
          if (light) light.intensity = 0.8 + Math.sin(t * 2 + i) * 0.4;
        });
      } else if (floor === 'B4') {
        const objs = b4ObjectsRef.current;
        objs.forEach(obj => {
          if (obj.isRing) {
             const idx = obj.ringIndex || 0;
             if (idx % 3 === 0) obj.mesh.rotation.z += 0.005;
             else if (idx % 3 === 1) obj.mesh.rotation.z -= 0.003;
             else obj.mesh.rotation.x += 0.004;
          }
          if (obj.isLight) {
             (obj.mesh as THREE.PointLight).intensity = 1.0 + Math.sin(t * 2 + (obj.ringIndex || 0) * 0.7) * 0.5;
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Attach to DOM element for the other useEffect
    (container as any)._modelsMap = modelsMap;

    return () => {
      resizeObserver.disconnect();
      renderer.dispose();
      container.innerHTML = '';
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Camera reset logic
  useEffect(() => {
    if (!containerRef.current) return;
    const camera = (containerRef.current as any)._camera as THREE.PerspectiveCamera;
    const controls = (containerRef.current as any)._controls as OrbitControls;
    if (camera && controls) {
      camera.position.set(0, 300, 600);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }, [activeFloor]);

  // Update logic when activeFloor, selectedZone or zoneStatuses changes
  useEffect(() => {
    if (!containerRef.current) return;
    const scene = sceneRef.current;
    if (!scene) return;

    if (activeFloor === 'B4') {
      scene.background = new THREE.Color(0x0a0000);
      scene.fog = new THREE.FogExp2(0x110000, 0.001);
    } else {
      scene.background = new THREE.Color(0x000810);
      scene.fog = new THREE.FogExp2(0x000d1a, 0.0008);
    }

    if (activeFloor !== 'B4' && b4ObjectsRef.current.length > 0) {
      b4ObjectsRef.current.forEach(({ mesh }) => {
        scene.remove(mesh);
        if ((mesh as any).geometry) (mesh as any).geometry.dispose();
        if ((mesh as any).material) {
           const mat = (mesh as any).material;
           if (Array.isArray(mat)) mat.forEach(m => m.dispose());
           else mat.dispose();
        }
      });
      b4ObjectsRef.current = [];
    }

    const ambLight = (containerRef.current as any)._ambientLight as THREE.AmbientLight;
    if (ambLight) {
      if (activeFloor === 'B4') {
        ambLight.color.setHex(0x221100);
        ambLight.intensity = 1.0;
      } else {
        ambLight.color.setHex(0x112233);
        ambLight.intensity = 1.2;
      }
    }

    if (activeFloor === 'B4' && b4ObjectsRef.current.length === 0) {
       function createCylinder(start: number[], end: number[], radius: number, mat: THREE.Material) {
         const dir = new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
         const len = dir.length();
         const geo = new THREE.CylinderGeometry(radius, radius, len, 8);
         const mesh = new THREE.Mesh(geo, mat);
         mesh.position.set((start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2);
         mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
         return mesh;
       }

       const reactorPositions = [
         [-240, 80, -180], [0, 90, -180], [240, 80, -180],
         [-240, 85, 0],    [0, 100, 0],   [240, 85, 0],
         [-240, 80, 180],  [0, 90, 180],  [240, 80, 180],
       ];

       reactorPositions.forEach(([x, y, z], i) => {
         let innerRadius = 18;
         let outerGlow = 26;
         if (i === 4) {
           innerRadius = 24;
           outerGlow = 34; // Center reactor
         } else if (i === 0 || i === 2 || i === 6 || i === 8) {
           innerRadius = 15;
           outerGlow = 22; // Corner reactors
         }

         const glowGeo = new THREE.SphereGeometry(outerGlow, 32, 32);
         const glowMat = new THREE.MeshStandardMaterial({ color: 0xff2200, emissive: 0xff4400, emissiveIntensity: 1.5, transparent: true, opacity: 0.15 });
         const glow = new THREE.Mesh(glowGeo, glowMat);
         glow.position.set(x, y, z);
         scene.add(glow);
         b4ObjectsRef.current.push({ mesh: glow });

         const coreGeo = new THREE.SphereGeometry(innerRadius, 32, 32);
         const coreMat = new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff3300, emissiveIntensity: 2.0, metalness: 0.2, roughness: 0.8 });
         const coreMesh = new THREE.Mesh(coreGeo, coreMat);
         coreMesh.position.set(x, y, z);
         scene.add(coreMesh);
         b4ObjectsRef.current.push({ mesh: coreMesh });

         const ringGeo = new THREE.TorusGeometry(outerGlow + 4, 1.5, 8, 48);
         const ringMat = new THREE.MeshBasicMaterial({ color: i === 4 ? 0xff4400 : i % 2 === 0 ? 0xff8800 : 0xffaa00, transparent: true, opacity: 0.7 });
         const ring = new THREE.Mesh(ringGeo, ringMat);
         ring.position.set(x, y, z);
         ring.rotation.x = Math.PI / 3 + i * 0.3;
         scene.add(ring);
         b4ObjectsRef.current.push({ mesh: ring, isRing: true, ringIndex: i });

         const light = new THREE.PointLight(0xff4400, 1.2, 200);
         light.position.set(x, y, z);
         scene.add(light);
         b4ObjectsRef.current.push({ mesh: light, isLight: true, ringIndex: i });
       });

       const connections = [
         [0,1],[1,2],  // top row
         [3,4],[4,5],  // middle row
         [6,7],[7,8],  // bottom row
         [0,3],[3,6],  // left column
         [1,4],[4,7],  // center column
         [2,5],[5,8],  // right column
       ];
       const pipeMat = new THREE.MeshStandardMaterial({ color: 0x331100, metalness: 0.9, roughness: 0.2 });
       connections.forEach(([from, to]) => {
         const p1 = reactorPositions[from];
         const p2 = reactorPositions[to];
         const pipe = createCylinder(p1, p2, 4, pipeMat);
         scene.add(pipe);
         b4ObjectsRef.current.push({ mesh: pipe });
       });
    }

    // Toggle B3 towers
    b3ObjectsRef.current.forEach(t => t.visible = (activeFloor === 'B3'));

    const modelsMap = (containerRef.current as any)._modelsMap as Map<string, THREE.Group>;
    
    if (modelsMap) {
      modelsMap.forEach((model, zoneId) => {
        // Handle visibility based on activeFloor
        if (activeFloor === 'B1') {
          model.visible = zoneId === 'B1-R1' || zoneId === 'B1-R2';
        } else if (activeFloor === 'B2') {
          model.visible = zoneId === 'B2-I1' || zoneId === 'B2-I2';
        } else if (activeFloor === 'B3') {
          model.visible = zoneId === 'B1-R1' || zoneId === 'B1-R2';
        } else if (activeFloor === 'B4') {
          model.visible = zoneId === 'B2-I1'; // Use i1.glb as base
        } else {
          model.visible = false;
        }

        const isSelected = zoneId === selectedZone;
        
        model.traverse(child => {
          if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
            const isRes = zoneId.includes('R1') || zoneId.includes('R2');
            
            if (activeFloor === 'B3') {
              child.material.color.setHex(0x2a1500);
              child.material.emissive.setHex(0x552200);
              child.material.emissiveIntensity = isSelected && model.visible ? 1.0 : 0.6;
              child.material.metalness = 0.8;
              child.material.roughness = 0.3;
            } else if (activeFloor === 'B4' && zoneId === 'B2-I1') {
              child.material.color.setHex(0x1a0500);
              child.material.emissive.setHex(0x330800);
              child.material.emissiveIntensity = isSelected && model.visible ? 1.0 : 0.5;
              child.material.metalness = 0.9;
              child.material.roughness = 0.3;
            } else {
              child.material.color.setHex(isRes ? 0x0a2a3a : 0x1a1200);
              child.material.emissive.setHex(isRes ? 0x003355 : 0x331800);
              child.material.emissiveIntensity = isSelected && model.visible ? 1.0 : 0.4;
              child.material.metalness = 0.7;
              child.material.roughness = 0.4;
            }
          }

          if (child instanceof THREE.LineSegments && child.material instanceof THREE.LineBasicMaterial) {
             const isRes = zoneId.includes('R1') || zoneId.includes('R2');
             if (activeFloor === 'B3') {
               child.material.color.setHex(0xffaa00);
               child.material.opacity = 0.25;
             } else if (activeFloor === 'B4' && zoneId === 'B2-I1') {
               child.material.color.setHex(0xff4400);
               child.material.opacity = 0.3;
             } else {
               child.material.color.setHex(isRes ? 0x00e5ff : 0xffaa00);
               child.material.opacity = 0.25;
             }
          }
        });
      });
    }
  }, [activeFloor, selectedZone, zoneStatuses]);

  return (
    <>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function HabitatPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Typewriter title (same pattern as PodsPage)
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [titleDone, setTitleDone] = useState(false);
  const fullTitle = '环境警报系统 · HABITAT ALERT SYSTEM';

  const [activeFloor, setActiveFloor] = useState<FloorId>('B1');
  const [selectedZone, setSelectedZone] = useState<string>('B1-R1');
  const [dataVisible, setDataVisible] = useState(true);
  const [zoneStatuses, setZoneStatuses] = useState<Record<string, ZoneStatus>>(() => {
    const out: Record<string, ZoneStatus> = {};
    for (const zones of Object.values(FLOOR_ZONES)) for (const z of zones) out[z.id] = z.status;
    return out;
  });

  const [alerts, setAlerts] = useState<AlertEvent[]>([
    { time: '2MIN AGO', icon: '🟢', text: '全区扫描完成 · ALL NOMINAL', color: 'text-cyan-400/70' },
    { time: '15MIN AGO', icon: '🟡', text: 'B1-R2 居民区 B O₂ 水平下降', color: 'text-amber-400/70' },
    { time: '1HR AGO', icon: '🟢', text: '辐射屏蔽层检测通过', color: 'text-cyan-400/70' },
    { time: '3HR AGO', icon: '🟡', text: 'B4-C1 气压波动已恢复', color: 'text-amber-400/70' },
    { time: '6HR AGO', icon: '🟢', text: '能源层温度稳定', color: 'text-cyan-400/70' },
    { time: '1DAY AGO', icon: '🔴', text: 'B3-E1 辐射峰值事件 已修复', color: 'text-red-400/70' },
  ]);
  const [crisisActive, setCrisisActive] = useState(false);
  const [crisisBanner, setCrisisBanner] = useState(false);
  const [crisisAcknowledged, setCrisisAcknowledged] = useState(false);
  const [countdown, setCountdown] = useState(5400);
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null);
  const [selectedVent, setSelectedVent] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [dispatchedRoutes, setDispatchedRoutes] = useState<string[]>([]);
  const [alertMuted, setAlertMuted] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const alertIntervalRef = useRef<number>(0);

  const initAudio = () => {
    if (audioCtxRef.current) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtxRef.current = new AC();
  };

  const playAlertBeep = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const playTone = (freq: number, startTime: number, duration: number, volume: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playTone(880, now, 0.3, 0.3);
    playTone(660, now + 0.35, 0.3, 0.3);
    playTone(880, now + 0.7, 0.3, 0.3);
    playTone(660, now + 1.05, 0.3, 0.3);
  };

  const stopAlert = () => {
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = 0;
    }
  };

  useEffect(() => {
    return () => {
      stopAlert();
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const [ventData, setVentData] = useState([
    { id: 'VENT-A1', zone: 'B1-R1 居民区A', flow: 450, target: 480, status: 'NORMAL' },
    { id: 'VENT-A2', zone: 'B1-R2 居民区B', flow: 285, target: 480, status: 'LOW' },
    { id: 'VENT-B1', zone: 'B2-I1 工业区A', flow: 520, target: 500, status: 'NORMAL' },
    { id: 'VENT-B2', zone: 'B2-I2 工业区B', flow: 495, target: 500, status: 'NORMAL' },
    { id: 'VENT-C1', zone: 'B3-E1 能源区A', flow: 380, target: 420, status: 'NORMAL' },
    { id: 'VENT-C2', zone: 'B3-E2 能源区B', flow: 410, target: 420, status: 'NORMAL' },
    { id: 'VENT-D1', zone: 'B4-C1 核心区A', flow: 320, target: 350, status: 'NORMAL' },
    { id: 'VENT-D2', zone: 'B4-C2 核心区B', flow: 298, target: 350, status: 'LOW' },
  ]);

  useEffect(() => {
    const iv = setInterval(() => {
      setVentData(prev => prev.map(v => {
        const delta = Math.round((Math.random() - 0.5) * 20);
        const flow = Math.max(0, v.flow + delta);
        return { ...v, flow, status: flow < v.target * 0.7 ? 'LOW' : 'NORMAL' };
      }));
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (!crisisActive) { setCountdown(5400); return; }
    const iv = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(iv);
  }, [crisisActive]);

  const currentZones = FLOOR_ZONES[activeFloor];
  const zoneEnv = ZONE_DATA[selectedZone];
  const zoneTrend = useMemo(() => seededTrend(zoneEnv), [selectedZone]);

  useEffect(() => {
    setSelectedZone(FLOOR_ZONES[activeFloor][0].id);
  }, [activeFloor]);

  const handleZoneSelect = (zoneId: string) => {
    if (zoneId === selectedZone) return;
    const floor = zoneId.split('-')[0] as FloorId;
    setDataVisible(false);
    setTimeout(() => {
      if (floor !== activeFloor) setActiveFloor(floor);
      setSelectedZone(zoneId);
      setDataVisible(true);
    }, 150);
  };

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayedTitle(fullTitle.slice(0, i));
      if (i >= fullTitle.length) { clearInterval(iv); setTimeout(() => setTitleDone(true), 2000); }
    }, 60);
    return () => clearInterval(iv);
  }, []);

  const triggerCrisis = () => {
    if (crisisActive) {
      setCrisisActive(false);
      setCrisisBanner(false);
      setCrisisAcknowledged(false);
      setAlertMuted(false);
      setSelectedRoute(null);
      setDispatchedRoutes([]);
      stopAlert();
      setZoneStatuses(prev => ({ ...prev, 'B1-R2': 'WARNING' }));
      return;
    }
    initAudio();
    setCrisisActive(true);
    setCrisisBanner(true);
    setAlertMuted(false);
    setZoneStatuses(prev => ({ ...prev, 'B1-R2': 'CRITICAL' }));
    setAlerts(prev => [
      { time: 'NOW', icon: '🔴', text: 'CRISIS: B1-R2 O₂ 急剧下降 · AI ENGINE ACTIVATING', color: 'text-red-400' },
      ...prev,
    ]);
    playAlertBeep();
    alertIntervalRef.current = window.setInterval(playAlertBeep, 3000);
    setTimeout(() => setCrisisBanner(false), 5000);
  };

  const langLabels: Record<string, string> = { zh: '中文', en: 'ENG', mixed: '混合' };
  const currentLang = localStorage.getItem('lang') || 'zh';
  const handleLogout = () => { localStorage.removeItem('aeonguard_auth'); navigate('/'); };
  const cycleLanguage = () => {
    const langs = ['zh', 'en', 'mixed'];
    localStorage.setItem('lang', langs[(langs.indexOf(currentLang) + 1) % langs.length]);
    window.location.reload();
  };

  const allZonesFlat = Object.entries(FLOOR_ZONES).flatMap(([, zones]) => zones);

  return (
    <div className="flex h-screen w-full flex-col bg-[#000d1a] font-mono text-cyan-400 selection:bg-cyan-500/30">
      <HabitatAtmosphereCanvas crisisActive={crisisActive} />

      {/* ─── Navbar ─── */}
      <nav className="fixed top-0 z-50 flex h-12 w-full items-center justify-between border-b border-cyan-500/30 bg-[#000d1a]/80 px-4 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.1)]">
        <div className="flex items-center gap-2 font-bold tracking-[0.2em]">
          <Terminal size={18} className="text-cyan-400" /><span>AEONGUARD · 永卫系统</span>
        </div>
        <div className="flex-1 overflow-hidden mx-8 border-x border-cyan-500/10">
          <div className="animate-[ticker_60s_linear_infinite] whitespace-nowrap text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest text-cyan-500/80">
            {[0, 1].map(dup => (
              <React.Fragment key={dup}>
                <span className="mx-4">🟢 环境系统: ALL NOMINAL</span>
                <span className="mx-4">🟢 氧气水平: 85.2% AVG</span>
                <span className="mx-4">🟢 辐射屏蔽: ACTIVE</span>
                <span className="mx-4">🟢 气压: 101.3 kPa</span>
                <span className="mx-4">🟢 地表温度: -272°C</span>
                <span className="mx-4">🟢 核心温度: 5500°C STABLE</span>
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest">
          <div className="flex items-center gap-2 mr-2">
            <button onClick={() => window.location.reload()} className="p-1.5 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors text-cyan-400/60 hover:text-cyan-400"><RefreshCw size={14} /></button>
            <button onClick={cycleLanguage} className="flex items-center gap-2 px-3 py-1 border border-cyan-400/50 bg-cyan-400/5 text-cyan-400 hover:bg-cyan-400/10 transition-all font-mono"><Languages size={14} /><span>{langLabels[currentLang]}</span></button>
          </div>
          <div className="flex items-center gap-2">
            <span className="opacity-50">ADMIN_01 · ADMINISTRATOR</span>
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1 border border-cyan-500/30 px-2 py-1 hover:bg-cyan-500/10 transition-colors"><LogOut size={12} />LOGOUT</button>
        </div>
      </nav>

      <div className="relative z-[1] flex flex-1 pt-12 bg-[#000d1a]">
        {/* ─── Sidebar ─── */}
        <aside className={`fixed left-0 h-full border-r border-cyan-500/30 bg-[#000d1a]/95 z-40 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out ${sidebarOpen ? 'w-[14vw] min-w-[160px] max-w-[220px] p-4' : 'w-[48px] p-2'}`}>
          <div className="relative">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute top-0 right-0 p-1 text-cyan-400 hover:bg-[rgba(0,229,255,0.1)] transition-colors z-10">
              {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>
          </div>
          <div className={`flex flex-col gap-4 ${sidebarOpen ? '' : 'mt-6'}`}>
            <div>
              {sidebarOpen && <div className="mb-2 text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold tracking-widest opacity-30">核心系统 CORE</div>}
              <ul className="space-y-1">
                <SidebarItem to="/dashboard" icon={<Home size={14} />} label="主页 HOME" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/pods" icon={<Database size={14} />} label="休眠舱监控 PODS" collapsed={!sidebarOpen} />
                <SidebarItem to="/dashboard/habitat" icon={<AlertTriangle size={14} />} label="环境警报 HABITAT" active collapsed={!sidebarOpen} />
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
            <SidebarItem to="/dashboard/settings" icon={<Settings size={14} />} label="设置 SETTINGS" collapsed={!sidebarOpen} />
          </div>
        </aside>

        {/* ─── Crisis overlays ─── */}
        {crisisActive && (
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 998,
            border: '3px solid rgba(255,50,50,0.8)', animation: 'borderPulse 1s ease-in-out infinite',
            boxShadow: 'inset 0 0 60px rgba(255,0,0,0.2)',
          }} />
        )}
        {crisisActive && (
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999,
            animation: 'redAlert 1.5s ease-in-out infinite',
          }} />
        )}
        {crisisActive && (
          <div style={{
            position: 'fixed', top: '48px', left: 0, right: 0, zIndex: 1000,
            background: 'rgba(180,0,0,0.95)', padding: '8px 24px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '2px solid #ff4444', animation: 'bannerPulse 0.8s ease-in-out infinite',
            fontFamily: 'monospace',
          }}>
            <span style={{ color: '#fff', fontSize: 'clamp(0.7rem,0.9vw,1rem)', letterSpacing: '0.3em', fontWeight: 'bold' }}>
              🚨 CRISIS ALERT · B1-R2 O₂ CRITICAL · 危机警报 · 立即响应
            </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', letterSpacing: '0.2em' }}>
              AEONGUARD AI ENGINE ACTIVATED · 永卫系统已介入
            </span>
          </div>
        )}
        {crisisActive && (
          <button onClick={() => { stopAlert(); setAlertMuted(true); }} style={{
            position: 'fixed', top: '96px', right: '16px', zIndex: 1001,
            background: alertMuted ? 'rgba(60,60,60,0.9)' : 'rgba(180,0,0,0.8)',
            border: `1px solid ${alertMuted ? '#666' : '#ff4444'}`,
            color: 'white', fontFamily: 'monospace', fontSize: '11px',
            padding: '6px 12px', cursor: 'pointer', letterSpacing: '0.2em',
          }}>
            {alertMuted ? '🔇 MUTED' : '🔇 MUTE ALARM'}
          </button>
        )}

        {/* ─── Main ─── */}
        <main className={`flex-1 overflow-y-auto overflow-x-hidden bg-[#000d1a] transition-all duration-300 ease-in-out ${sidebarOpen ? 'ml-[14vw]' : 'ml-[48px]'}`}>

          {/* ═══ HERO SPLIT ═══ */}
          <section className="flex flex-col" style={{ height: 'calc(100vh - 48px)' }}>
            {/* Title header */}
            <div className="shrink-0 border-b border-cyan-500/20 bg-[#000814]/90 px-6 py-4">
              <h1 className="text-[clamp(1rem,1.5vw,1.5rem)] font-bold tracking-[0.3em] text-cyan-400 mb-1">
                {displayedTitle}{!titleDone && <span style={{ animation: 'blink 0.8s infinite' }}>|</span>}
              </h1>
              <div className="text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-[0.2em] text-cyan-500/50">
                ALL SYSTEMS NOMINAL · LAST CHECK: 30S AGO
              </div>
            </div>

            {/* Two columns */}
            <div className="flex-1 flex min-h-0">

              {/* ── Left 40%: Controls + Data ── */}
              <div className="w-[40%] flex flex-col border-r border-cyan-500/10 overflow-y-auto" style={{ background: 'rgba(0,5,15,0.4)' }}>

                {/* Floor selector tabs */}
                <div className="shrink-0 p-4 pb-3 border-b border-cyan-500/10">
                  <div className="text-[clamp(0.65rem,0.75vw,0.8rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-3">── SELECT FLOOR · 选择楼层 ──</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['B1', 'B2', 'B3', 'B4'] as FloorId[]).map(f => {
                      const isActive = activeFloor === f;
                      return (
                        <button key={f} onClick={() => { setDataVisible(false); setTimeout(() => { setActiveFloor(f); setDataVisible(true); }, 150); }}
                          style={{
                            flex: 1, padding: '8px 4px', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.1em',
                            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center',
                            border: `1px solid ${isActive ? 'rgba(0,229,255,0.6)' : 'rgba(0,229,255,0.15)'}`,
                            background: isActive ? 'rgba(0,229,255,0.12)' : 'transparent',
                            color: isActive ? '#00e5ff' : 'rgba(0,229,255,0.35)',
                          }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>{f}</div>
                          <div style={{ fontSize: '8px', opacity: 0.7 }}>{FLOOR_NAMES[f]}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Zone selector cards */}
                <div className="shrink-0 p-4 pb-3 border-b border-cyan-500/10">
                  <div className="text-[clamp(0.65rem,0.75vw,0.8rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-3">── ZONE SELECT · 区域选择 ──</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentZones.map(z => {
                      const st = zoneStatuses[z.id] || z.status;
                      const isSel = selectedZone === z.id;
                      const isWarn = st === 'WARNING';
                      const isCrit = st === 'CRITICAL';
                      const borderColor = isCrit ? 'rgba(255,50,50,0.7)' : isWarn ? 'rgba(255,170,0,0.5)' : isSel ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.12)';
                      const bgColor = isSel ? 'rgba(0,229,255,0.06)' : 'rgba(0,0,0,0.2)';
                      return (
                        <button key={z.id} onClick={() => handleZoneSelect(z.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '12px 14px', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left',
                            border: `1px solid ${borderColor}`, background: bgColor,
                            animation: (isWarn || isCrit) ? 'warningPulse 2s ease-in-out infinite' : 'none',
                          }}>
                          <div>
                            <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold', color: isCrit ? '#ff4444' : isWarn ? '#ffaa00' : '#00e5ff', letterSpacing: '0.1em' }}>
                              {z.label}
                            </div>
                            <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(0,229,255,0.35)', letterSpacing: '0.15em', marginTop: '2px' }}>
                              {z.id} · {z.type}
                            </div>
                          </div>
                          <span style={{
                            fontFamily: 'monospace', fontSize: '8px', letterSpacing: '0.12em', padding: '3px 8px',
                            border: `1px solid ${isCrit ? 'rgba(255,50,50,0.5)' : isWarn ? 'rgba(255,170,0,0.4)' : 'rgba(0,229,255,0.2)'}`,
                            background: isCrit ? 'rgba(255,50,50,0.1)' : isWarn ? 'rgba(255,170,0,0.08)' : 'rgba(0,229,255,0.04)',
                            color: isCrit ? '#ff4444' : isWarn ? '#ffaa00' : '#00e5ff',
                          }}>
                            {isCrit ? '⚠ CRITICAL' : isWarn ? '⚠ WARNING' : '✓ NOMINAL'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Environmental data for selected zone */}
                <div className="flex-1 p-4 min-h-0 overflow-y-auto">
                  <div className="text-[clamp(0.65rem,0.75vw,0.8rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-3">── ENVIRONMENTAL DATA · 环境数据 ──</div>
                  <div style={{ opacity: dataVisible ? 1 : 0, transition: 'opacity 0.15s' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(0,229,255,0.5)', letterSpacing: '0.15em', marginBottom: '10px' }}>
                      {selectedZone} · {currentZones.find(z => z.id === selectedZone)?.label ?? FLOOR_ZONES[activeFloor][0].label}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-around', padding: '12px 0' }}>
                      <SemiGauge 
                        value={zoneEnv.oxygen} 
                        min={activeFloor === 'B4' ? 20 : 60} 
                        max={100} 
                        unit="%" 
                        label="O₂ OXYGEN" 
                        safeMin={activeFloor === 'B4' ? 35 : 78} 
                        safeMax={activeFloor === 'B4' ? 50 : 95} 
                        color="#00e5ff" 
                      />
                      <SemiGauge 
                        value={zoneEnv.radiation} 
                        min={0} 
                        max={activeFloor === 'B4' ? 120 : 50} 
                        unit="mSv" 
                        label="RADIATION" 
                        safeMin={0} 
                        safeMax={activeFloor === 'B4' ? 100 : 25} 
                        color="#00ff88" 
                      />
                      <SemiGauge 
                        value={zoneEnv.pressure} 
                        min={activeFloor === 'B4' ? 100 : 85} 
                        max={activeFloor === 'B4' ? 200 : 115} 
                        unit="kPa" 
                        label="PRESSURE" 
                        safeMin={activeFloor === 'B4' ? 130 : 95} 
                        safeMax={activeFloor === 'B4' ? 170 : 110} 
                        color="#ffaa00" 
                      />
                    </div>

                    {/* 24H trend mini chart */}
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(0,229,255,0.35)', letterSpacing: '0.15em', marginBottom: '6px' }}>
                        24H TREND · {selectedZone}
                      </div>
                      <div style={{ height: 140, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,229,255,0.08)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={zoneTrend} margin={{ top: 8, right: 8, left: -25, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                            <XAxis dataKey="hour" tick={{ fontSize: 7, fill: 'rgba(0,229,255,0.2)' }} tickLine={false} axisLine={false} />
                            <YAxis tick={false} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#000d1a', border: '1px solid rgba(0,229,255,0.2)', fontFamily: 'monospace', fontSize: 9 }} />
                            <Line type="monotone" dataKey="oxygen" stroke="#00e5ff" strokeWidth={1.2} dot={false} name="O₂" />
                            <Line type="monotone" dataKey="radiation" stroke="#00ff88" strokeWidth={1.2} dot={false} name="RAD" />
                            <Line type="monotone" dataKey="pressure" stroke="#ffaa00" strokeWidth={1.2} dot={false} name="PRS" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Right 60%: 3D Model Placeholder ── */}
              <div className="w-[60%] min-h-0">
                <div style={{
                  width: '100%', height: '100%', background: 'rgba(0,5,15,0.8)',
                  border: '1px solid rgba(0,229,255,0.15)', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
                }}>
                  {/* Hex grid background */}
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 104l30-17.32V17.32L30 0 0 17.32v69.36L30 104z' fill='none' stroke='%2300e5ff' stroke-width='1'/%3E%3C/svg%3E")`,
                    backgroundSize: '30px 52px',
                    zIndex: 0,
                  }} />

                  <Habitat3DViewer activeFloor={activeFloor} selectedZone={selectedZone} zoneStatuses={zoneStatuses} />

                  {/* Floor label */}
                  <div style={{ position: 'absolute', top: '24px', left: '24px', fontSize: 'clamp(1rem,1.5vw,1.5rem)', fontFamily: 'monospace', color: '#00e5ff', letterSpacing: '0.3em', zIndex: 10, pointerEvents: 'none', textShadow: '0 0 10px rgba(0,229,255,0.5)' }}>
                    {activeFloor} · {FLOOR_NAMES[activeFloor]}
                  </div>

                  {selectedZone && (
                    <div style={{ position: 'absolute', bottom: '24px', left: '24px', fontFamily: 'monospace', color: 'rgba(0,229,255,0.5)', fontSize: '11px', letterSpacing: '0.2em', zIndex: 10, pointerEvents: 'none', textShadow: '0 0 10px rgba(0,229,255,0.3)' }}>
                      VIEWING: {selectedZone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ═══ Below-fold sections ═══ */}
          <div className="p-[3vw] bg-[#000d1a] border-t border-cyan-500/10">

            {/* Emergency Evacuation Protocol — visible only during crisis */}
            {crisisActive && (
              <EmergencyEvacuation
                countdown={countdown}
                acknowledged={crisisAcknowledged}
                onAcknowledge={() => setCrisisAcknowledged(true)}
                onReset={triggerCrisis}
                selectedRoute={selectedRoute}
                onToggleRoute={from => setSelectedRoute(prev => prev === from ? null : from)}
                dispatchedRoutes={dispatchedRoutes}
                onDispatchRoute={(from, label, priority) => {
                  setDispatchedRoutes(prev => (prev.includes(from) ? prev : [...prev, from]));
                  setAlerts(prev => [
                    { time: 'NOW', icon: '🟢', text: `P${priority} evacuation team dispatched to ${label}`, color: 'text-green-400' },
                    ...prev,
                  ]);
                }}
              />
            )}

            {/* Alert Log + Crisis Trigger */}
            <div className="flex gap-6 mb-10">
              <div className="w-[60%] border border-cyan-500/10 bg-[rgba(0,0,0,0.2)] p-6">
                <div className="text-[clamp(0.7rem,0.85vw,0.9rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-4">── ALERT HISTORY · 警报记录 ──</div>
                <div className="space-y-1.5 overflow-y-auto" style={{ maxHeight: 240 }}>
                  {alerts.map((evt, i) => (
                    <div key={i} className="flex items-center gap-2 text-[clamp(0.55rem,0.65vw,0.7rem)] tracking-widest">
                      <span className="opacity-30 w-20 shrink-0">{evt.time}</span>
                      <span>{evt.icon}</span>
                      <span className={evt.color}>{evt.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="w-[40%] border border-cyan-500/10 bg-[rgba(0,0,0,0.2)] p-6 flex flex-col items-center justify-center">
                <div className="text-[clamp(0.7rem,0.85vw,0.9rem)] font-bold tracking-[0.2em] text-cyan-500/40 mb-6">── CRISIS CONTROL ──</div>
                <button onClick={triggerCrisis} style={{
                  padding: '18px 36px', fontSize: '14px', fontFamily: 'monospace', fontWeight: 'bold',
                  letterSpacing: '0.3em', cursor: 'pointer', transition: 'all 0.3s',
                  border: crisisActive ? '2px solid rgba(255,170,0,0.6)' : '2px solid rgba(255,0,0,0.6)',
                  background: crisisActive ? 'rgba(255,170,0,0.15)' : 'rgba(255,0,0,0.1)',
                  color: crisisActive ? '#ffaa00' : '#ff4444',
                  animation: crisisActive ? 'blink 1s infinite' : 'none',
                }}
                  onMouseEnter={e => { if (!crisisActive) e.currentTarget.style.background = 'rgba(255,0,0,0.25)'; }}
                  onMouseLeave={e => { if (!crisisActive) e.currentTarget.style.background = 'rgba(255,0,0,0.1)'; }}>
                  {crisisActive ? '⚠ CRISIS ACTIVE · RESET' : '⚠ TRIGGER CRISIS EVENT'}
                </button>
                <div className="mt-4 text-[clamp(0.5rem,0.6vw,0.65rem)] tracking-widest text-cyan-500/30 text-center">
                  {crisisActive ? 'AI ENGINE IS RESPONDING · CLICK TO RESET' : 'SETS B1-R2 TO CRITICAL · ADDS ALERT'}
                </div>
              </div>
            </div>

            {/* All zones overview table */}
            <div className="text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold tracking-[0.3em] text-cyan-400 mb-4">── ALL ZONES OVERVIEW · 全区域总览 ──</div>
            <div className="border border-cyan-500/10 bg-[rgba(0,0,0,0.2)] overflow-hidden">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'monospace', fontSize: 'clamp(0.6rem, 0.7vw, 0.75rem)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,229,255,0.15)' }}>
                    {['ZONE', 'LABEL', 'O₂', 'RADIATION', 'PRESSURE', 'STATUS'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', letterSpacing: '0.2em', color: 'rgba(0,229,255,0.4)', fontWeight: 'bold' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allZonesFlat.map(z => {
                    const st = zoneStatuses[z.id] || z.status;
                    const d = ZONE_DATA[z.id];
                    const isCrit = st === 'CRITICAL';
                    const isWarn = st === 'WARNING';
                    const rowBg = isCrit ? 'rgba(255,50,50,0.06)' : isWarn ? 'rgba(255,170,0,0.05)' : 'transparent';
                    const tc = isCrit ? '#ff4444' : isWarn ? '#ffaa00' : 'rgba(0,229,255,0.5)';
                    return (
                      <tr key={z.id} style={{ borderBottom: '1px solid rgba(0,229,255,0.05)', background: rowBg }}>
                        <td style={{ padding: '8px 14px', color: tc, fontWeight: 'bold', letterSpacing: '0.1em' }}>{z.id}</td>
                        <td style={{ padding: '8px 14px', color: tc }}>{z.label}</td>
                        <td style={{ padding: '8px 14px', color: tc }}>{d.oxygen.toFixed(1)}%</td>
                        <td style={{ padding: '8px 14px', color: tc }}>{d.radiation.toFixed(1)} mSv</td>
                        <td style={{ padding: '8px 14px', color: tc }}>{d.pressure.toFixed(1)} kPa</td>
                        <td style={{ padding: '8px 14px' }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', fontSize: '10px', letterSpacing: '0.15em', fontWeight: 'bold',
                            border: `1px solid ${isCrit ? 'rgba(255,50,50,0.5)' : isWarn ? 'rgba(255,170,0,0.4)' : 'rgba(0,229,255,0.2)'}`,
                            background: isCrit ? 'rgba(255,50,50,0.1)' : isWarn ? 'rgba(255,170,0,0.1)' : 'rgba(0,229,255,0.05)',
                            color: isCrit ? '#ff4444' : isWarn ? '#ffaa00' : '#00e5ff',
                          }}>{isCrit ? '⚠ CRITICAL' : isWarn ? '⚠ WARNING' : '✓ NOMINAL'}</span>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
              </table>
            </div>

            {/* Environment Heatmap */}
            <div className="mt-10">
              <div className="text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold tracking-[0.3em] text-cyan-400 mb-4">── ENVIRONMENT HEATMAP · 环境热力图 ──</div>
              <EnvironmentHeatmap selectedZone={selectedZone} onSelectZone={handleZoneSelect} />
            </div>

            {/* System Health Score */}
            <SystemHealthScore />

            {/* Predictive Analysis */}
            <PredictiveAnalysis
              selectedPrediction={selectedPrediction}
              onToggle={z => setSelectedPrediction(prev => prev === z ? null : z)}
              onViewZone={handleZoneSelect}
              onFlag={zoneId => setAlerts(prev => [
                { time: 'NOW', icon: '🟡', text: `${zoneId} flagged for review · 已标记审查`, color: 'text-amber-400' },
                ...prev,
              ])}
            />

            {/* Ventilation System */}
            <VentilationSystem
              ventData={ventData}
              selectedVent={selectedVent}
              onToggle={id => setSelectedVent(prev => prev === id ? null : id)}
              onBoost={id => {
                setVentData(prev => prev.map(v => {
                  if (v.id !== id) return v;
                  const flow = Math.round(v.flow * 1.2);
                  return { ...v, flow, status: flow >= v.target * 0.7 ? 'NORMAL' : 'LOW' };
                }));
                setAlerts(prev => [{ time: 'NOW', icon: '🟢', text: `${id} flow manually boosted +20%`, color: 'text-cyan-400' }, ...prev]);
              }}
              onMaintenance={id => {
                setAlerts(prev => [{ time: 'NOW', icon: '🔧', text: `${id} maintenance scheduled · 已安排维护`, color: 'text-cyan-400' }, ...prev]);
              }}
            />
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes warningPulse {
          0%, 100% { border-color: rgba(255,170,0,0.3); box-shadow: none; }
          50% { border-color: rgba(255,170,0,0.7); box-shadow: 0 0 12px rgba(255,170,0,0.15); }
        }
        @keyframes dash { from { stroke-dashoffset: 24; } to { stroke-dashoffset: 0; } }
        @keyframes evacuationFadeIn { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes redAlert {
          0%, 100% { background: rgba(255, 0, 0, 0); }
          50% { background: rgba(255, 0, 0, 0.12); }
        }
        @keyframes borderPulse {
          0%, 100% { border-color: rgba(255,50,50,0.4); box-shadow: inset 0 0 40px rgba(255,0,0,0.1); }
          50% { border-color: rgba(255,50,50,1); box-shadow: inset 0 0 80px rgba(255,0,0,0.3); }
        }
        @keyframes bannerPulse {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }
        .evac-route-card { transition: box-shadow 0.2s, filter 0.2s; }
        .evac-route-card:hover {
          box-shadow: 0 0 14px rgba(0, 229, 255, 0.18);
          filter: brightness(1.06);
        }
      ` }} />
    </div>
  );
}

function getSafeRanges(zoneId: string) {
  if (zoneId.startsWith('B4')) return { o2: [35, 50], rad: [0, 100], prs: [130, 170] };
  return { o2: [78, 95], rad: [0, 25], prs: [95, 110] };
}

// ─── System Health Score ─────────────────────────────────────────

function SystemHealthScore() {
  const allZones = Object.entries(ZONE_DATA);
  let totalO2 = 0, totalRad = 0, totalPrs = 0;
  let warningCount = 0;

  allZones.forEach(([zoneId, zone]) => {
    const { o2: oRange, rad: rRange, prs: pRange } = getSafeRanges(zoneId);

    const o2Score = zone.oxygen >= oRange[0] && zone.oxygen <= oRange[1] ? 100 : Math.max(0, 100 - Math.abs(zone.oxygen - (oRange[0]+oRange[1])/2) * 3);
    const radScore = zone.radiation <= rRange[1] ? 100 : Math.max(0, 100 - (zone.radiation - rRange[1]) * 4);
    const prsScore = zone.pressure >= pRange[0] && zone.pressure <= pRange[1] ? 100 : Math.max(0, 100 - Math.abs(zone.pressure - (pRange[0]+pRange[1])/2) * 2);
    
    totalO2 += o2Score; totalRad += radScore; totalPrs += prsScore;
    if (zone.oxygen < oRange[0] || zone.oxygen > oRange[1] || zone.radiation > rRange[1] || zone.pressure < pRange[0] || zone.pressure > pRange[1]) warningCount++;
  });

  const allZonesLen = allZones.length;
  const o2Avg = totalO2 / allZonesLen;
  const radAvg = totalRad / allZonesLen;
  const prsAvg = totalPrs / allZonesLen;
  const score = +((o2Avg + radAvg + prsAvg) / 3).toFixed(1);
  const scoreColor = score > 90 ? '#00ff88' : score > 75 ? '#ffaa00' : '#ff4444';
  const conditionLabel = score > 90 ? 'GOOD CONDITION' : score > 75 ? 'MODERATE RISK' : 'CRITICAL';

  const bars: { label: string; score: number; weight: string; color: string }[] = [
    { label: 'O₂ SCORE', score: +o2Avg.toFixed(1), weight: '40%', color: '#00e5ff' },
    { label: 'RAD SCORE', score: +radAvg.toFixed(1), weight: '35%', color: '#00ff88' },
    { label: 'PRS SCORE', score: +prsAvg.toFixed(1), weight: '25%', color: '#ffaa00' },
  ];

  return (
    <div className="mt-10">
      <div className="text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold tracking-[0.3em] text-cyan-400 mb-4">── SYSTEM HEALTH SCORE · 环境系统健康度 ──</div>
      <div style={{ display: 'flex', gap: '0', border: '1px solid rgba(0,229,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
        {/* Left: big score */}
        <div style={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', borderRight: '1px solid rgba(0,229,255,0.1)' }}>
          <div style={{ fontSize: 'clamp(3rem,5vw,5rem)', fontFamily: 'monospace', fontWeight: 'bold', color: scoreColor, lineHeight: 1 }}>
            {score}
          </div>
          <div style={{ fontSize: '14px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginTop: '4px' }}>
            / 100
          </div>
          <div style={{
            marginTop: '12px', padding: '4px 16px',
            border: `1px solid ${scoreColor}`, color: scoreColor,
            fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.3em',
          }}>
            {conditionLabel}
          </div>
          <div style={{ marginTop: '8px', fontSize: '9px', fontFamily: 'monospace', color: 'rgba(0,229,255,0.4)', letterSpacing: '0.15em', textAlign: 'center' }}>
            综合O₂ · 辐射 · 气压计算
          </div>
        </div>

        {/* Right: per-sensor breakdown */}
        <div style={{ width: '60%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 32px', gap: '16px' }}>
          {bars.map(b => (
            <div key={b.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: b.color, letterSpacing: '0.15em' }}>{b.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>weight {b.weight}</span>
              </div>
              <div style={{ position: 'relative', height: '16px', background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${b.score}%`,
                  background: `linear-gradient(90deg, ${b.color}33, ${b.color}66)`,
                  transition: 'width 0.6s ease',
                }} />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  paddingRight: '8px', fontFamily: 'monospace', fontSize: '9px', fontWeight: 'bold', color: b.color,
                }}>
                  {b.score}
                </div>
              </div>
            </div>
          ))}
          <div style={{
            marginTop: '4px', fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.15em',
            color: warningCount > 0 ? '#ffaa00' : 'rgba(0,229,255,0.5)',
          }}>
            {warningCount > 0 ? `⚠ ${warningCount} ZONE${warningCount > 1 ? 'S' : ''} REQUIRE ATTENTION` : '✓ ALL ZONES NOMINAL'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Predictive Analysis ─────────────────────────────────────────

const PREDICTIONS = [
  {
    zone: 'B1-R2', label: '居民区 B', sensor: 'O₂ OXYGEN',
    current: 71.3, predicted1h: 70.1, predicted: 68.5, timeToAlert: 1.5,
    trend: 'DECLINING' as const, severity: 'WARNING' as const,
    rate: '1.4%/hour', confidence: 87, threshold: 78,
    message: '氧气水平持续下降，预计 1.5 小时后降至警戒线以下',
    recommendation: 'Increase ventilation flow to VENT-A2\nby 40% to stabilize O₂ levels.\nEstimated correction time: 45 minutes.',
    history: [73.8, 73.2, 72.9, 72.5, 71.8, 71.3],
  },
  {
    zone: 'B3-E1', label: '能源区 A', sensor: 'RAD RADIATION',
    current: 22.3, predicted1h: 24.6, predicted: 26.8, timeToAlert: 3.2,
    trend: 'RISING' as const, severity: 'CAUTION' as const,
    rate: '2.3 mSv/hour', confidence: 72, threshold: 25,
    message: '辐射读数缓慢上升，建议 3.2 小时内进行检查',
    recommendation: 'Check radiation shielding integrity\nin B3-E1 sector.\nEstimated resolution: 2 hours.',
    history: [19.1, 19.8, 20.4, 21.0, 21.7, 22.3],
  },
  {
    zone: 'B4-C2', label: '核心区 B', sensor: 'PRS PRESSURE',
    current: 98.1, predicted1h: 96.2, predicted: 94.2, timeToAlert: 4.8,
    trend: 'DECLINING' as const, severity: 'CAUTION' as const,
    rate: '1.9 kPa/hour', confidence: 64, threshold: 95,
    message: '气压轻微下降趋势，在正常波动范围内',
    recommendation: 'Monitor pressure seals in B4-C2.\nCurrent decline within tolerance.\nSchedule inspection in next cycle.',
    history: [101.2, 100.5, 99.8, 99.3, 98.7, 98.1],
  },
];

function buildForecastData(p: typeof PREDICTIONS[0]) {
  const pts: { hour: string; value: number; type: string }[] = [];
  p.history.forEach((v, i) => pts.push({ hour: `${-6 + i}h`, value: v, type: 'actual' }));
  pts.push({ hour: '0h', value: p.current, type: 'actual' });
  pts.push({ hour: '+1h', value: p.predicted1h, type: 'predicted' });
  pts.push({ hour: '+2h', value: p.predicted, type: 'predicted' });
  return pts;
}

function PredictiveAnalysis({ selectedPrediction, onToggle, onViewZone, onFlag }: {
  selectedPrediction: string | null;
  onToggle: (zone: string) => void;
  onViewZone: (zone: string) => void;
  onFlag: (zone: string) => void;
}) {
  const severityColor = (s: 'WARNING' | 'CAUTION') =>
    s === 'WARNING' ? '#ffaa00' : 'rgba(255,200,80,0.6)';

  return (
    <div className="mt-10">
      <div className="text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold tracking-[0.3em] text-cyan-400 mb-1">── PREDICTIVE ANALYSIS · 预测分析 ──</div>
      <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(0,229,255,0.35)', letterSpacing: '0.15em', marginBottom: '16px' }}>
        基于过去24小时趋势推算未来2小时走向
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {PREDICTIONS.map(p => {
          const c = severityColor(p.severity);
          const arrow = p.trend === 'DECLINING' ? '↓' : '↑';
          const sparkY1 = p.trend === 'DECLINING' ? 8 : 32;
          const sparkY2 = p.trend === 'DECLINING' ? 32 : 8;
          const isExpanded = selectedPrediction === p.zone;
          const forecastData = isExpanded ? buildForecastData(p) : [];
          const belowThreshold = p.trend === 'DECLINING' ? p.predicted < p.threshold : p.predicted > p.threshold;
          return (
            <div key={p.zone} onClick={() => onToggle(p.zone)} style={{
              border: `1px solid ${isExpanded ? (p.severity === 'WARNING' ? 'rgba(255,170,0,0.7)' : 'rgba(255,200,80,0.5)') : (p.severity === 'WARNING' ? 'rgba(255,170,0,0.4)' : 'rgba(255,200,80,0.2)')}`,
              background: isExpanded ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.25)',
              padding: '16px', position: 'relative', overflow: 'hidden', cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
              animation: p.severity === 'WARNING' ? 'warningPulse 2s ease-in-out infinite' : 'none',
            }}>
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold', color: c, letterSpacing: '0.1em' }}>
                    {p.zone} {arrow}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(0,229,255,0.4)', letterSpacing: '0.12em', marginTop: '2px' }}>
                    {p.label} · {p.sensor}
                  </div>
                </div>
                <div style={{ padding: '2px 8px', fontSize: '8px', fontFamily: 'monospace', letterSpacing: '0.12em', border: `1px solid ${c}`, color: c }}>
                  {p.severity}
                </div>
              </div>

              {/* Values + sparkline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>CURRENT</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', color: c }}>{p.current}</div>
                </div>
                <svg width="60" height="40" viewBox="0 0 60 40" style={{ flexShrink: 0 }}>
                  <line x1="5" y1={sparkY1} x2="30" y2={20} stroke={c} strokeWidth="1.5" opacity="0.6" />
                  <line x1="30" y1={20} x2="55" y2={sparkY2} stroke={c} strokeWidth="1.5" strokeDasharray="4 2" opacity="0.4" />
                  <circle cx="5" cy={sparkY1} r="3" fill={c} opacity="0.8" />
                  <circle cx="55" cy={sparkY2} r="3" fill={c} opacity="0.4" stroke={c} strokeWidth="1" />
                </svg>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>PREDICTED</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', color: c, opacity: 0.6 }}>{p.predicted}</div>
                </div>
              </div>

              {/* ETA */}
              <div style={{
                fontFamily: 'monospace', fontSize: '10px', color: c, letterSpacing: '0.15em', marginBottom: '10px',
                padding: '4px 0', borderTop: `1px solid ${c}33`, borderBottom: `1px solid ${c}33`,
              }}>
                ETA: {p.timeToAlert}H TO ALERT THRESHOLD
              </div>

              {/* Message */}
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.5', letterSpacing: '0.05em' }}>
                {p.message}
              </div>

              {/* ── Expanded detail ── */}
              <div style={{
                maxHeight: isExpanded ? '500px' : '0px', overflow: 'hidden',
                transition: 'max-height 0.35s ease-in-out, opacity 0.25s ease',
                opacity: isExpanded ? 1 : 0,
              }}>
                <div style={{ borderTop: `1px solid ${c}33`, marginTop: '12px', paddingTop: '12px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: c, letterSpacing: '0.2em', marginBottom: '10px' }}>
                    ── DETAILED FORECAST ──
                  </div>

                  {/* Forecast values */}
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', lineHeight: '1.8', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    <div>Current value:{'   '}<span style={{ color: c }}>{p.current}</span></div>
                    <div>Predicted (1h):{'  '}<span style={{ color: c, opacity: 0.8 }}>{p.predicted1h}</span></div>
                    <div>Predicted (2h):{'  '}<span style={{ color: belowThreshold ? '#ff4444' : c }}>{p.predicted}{belowThreshold ? '  ⚠ BELOW THRESHOLD' : ''}</span></div>
                    <div style={{ marginTop: '4px' }}>TREND: {arrow} {p.trend} at {p.rate}</div>
                    <div>CONFIDENCE: {p.confidence}%</div>
                  </div>

                  {/* Forecast chart */}
                  <div style={{ height: 120, background: 'rgba(0,0,0,0.3)', border: `1px solid ${c}22`, marginBottom: '10px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecastData} margin={{ top: 8, right: 8, left: -25, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                        <XAxis dataKey="hour" tick={{ fontSize: 7, fill: 'rgba(0,229,255,0.25)' }} tickLine={false} axisLine={false} />
                        <YAxis tick={false} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#000d1a', border: `1px solid ${c}44`, fontFamily: 'monospace', fontSize: 9 }} />
                        <ReferenceLine y={p.threshold} stroke="#ff4444" strokeDasharray="6 3" strokeWidth={1} />
                        <Line type="monotone" dataKey="value" stroke={c} strokeWidth={1.5} dot={{ r: 2, fill: c }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Recommendation */}
                  <div style={{
                    fontFamily: 'monospace', fontSize: '9px', color: 'rgba(0,229,255,0.5)', letterSpacing: '0.08em',
                    lineHeight: '1.6', padding: '8px 10px', border: '1px solid rgba(0,229,255,0.1)', background: 'rgba(0,229,255,0.03)', marginBottom: '12px',
                    whiteSpace: 'pre-line',
                  }}>
                    <span style={{ color: c, letterSpacing: '0.15em' }}>AI RECOMMENDATION:</span>{'\n'}{p.recommendation}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => onViewZone(p.zone)} style={{
                      flex: 1, padding: '6px 10px', fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.12em',
                      cursor: 'pointer', transition: 'all 0.2s',
                      border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.06)', color: '#00e5ff',
                    }}>→ VIEW ZONE DATA</button>
                    <button onClick={() => onFlag(p.zone)} style={{
                      flex: 1, padding: '6px 10px', fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.12em',
                      cursor: 'pointer', transition: 'all 0.2s',
                      border: '1px solid rgba(255,170,0,0.3)', background: 'rgba(255,170,0,0.06)', color: '#ffaa00',
                    }}>⚠ FLAG FOR REVIEW</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom note */}
      <div style={{ marginTop: '16px', padding: '12px 16px', border: '1px solid rgba(255,170,0,0.15)', background: 'rgba(255,170,0,0.03)' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,170,0,0.5)', letterSpacing: '0.15em', lineHeight: '1.6' }}>
          ⚠ PREDICTIONS BASED ON LINEAR TREND ANALYSIS · ACTUAL CONDITIONS MAY VARY
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,170,0,0.4)', letterSpacing: '0.15em', lineHeight: '1.6' }}>
          AI RECOMMENDATION: MONITOR B1-R2 OXYGEN LEVELS · CONSIDER EARLY INTERVENTION
        </div>
      </div>
    </div>
  );
}

// ─── Ventilation System ──────────────────────────────────────────

const VENT_EXTRA: Record<string, { filterPct: number; lastMaint: string; nextMaint: string; faults: string[] }> = {
  'VENT-A1': { filterPct: 82, lastMaint: '5 DAYS AGO', nextMaint: 'IN 25 DAYS', faults: [] },
  'VENT-A2': { filterPct: 67, lastMaint: '12 DAYS AGO', nextMaint: 'IN 18 DAYS', faults: ['Possible filter blockage detected', 'Flow 40.6% below target threshold'] },
  'VENT-B1': { filterPct: 91, lastMaint: '3 DAYS AGO', nextMaint: 'IN 27 DAYS', faults: [] },
  'VENT-B2': { filterPct: 88, lastMaint: '7 DAYS AGO', nextMaint: 'IN 23 DAYS', faults: [] },
  'VENT-C1': { filterPct: 75, lastMaint: '10 DAYS AGO', nextMaint: 'IN 20 DAYS', faults: [] },
  'VENT-C2': { filterPct: 79, lastMaint: '8 DAYS AGO', nextMaint: 'IN 22 DAYS', faults: [] },
  'VENT-D1': { filterPct: 70, lastMaint: '14 DAYS AGO', nextMaint: 'IN 16 DAYS', faults: [] },
  'VENT-D2': { filterPct: 55, lastMaint: '18 DAYS AGO', nextMaint: 'IN 12 DAYS', faults: ['Flow intermittently below target', 'Filter replacement recommended'] },
};

function buildFlowHistory(current: number) {
  return Array.from({ length: 6 }, (_, i) => ({
    hour: `${-5 + i}h`,
    flow: +(current + Math.sin(i * 1.2) * 15 + Math.cos(i * 0.7) * 8).toFixed(0),
  })).concat([{ hour: 'NOW', flow: current }]);
}

function VentilationSystem({ ventData, selectedVent, onToggle, onBoost, onMaintenance }: {
  ventData: { id: string; zone: string; flow: number; target: number; status: string }[];
  selectedVent: string | null;
  onToggle: (id: string) => void;
  onBoost: (id: string) => void;
  onMaintenance: (id: string) => void;
}) {
  const totalFlow = ventData.reduce((s, v) => s + v.flow, 0);
  const totalTarget = ventData.reduce((s, v) => s + v.target, 0);
  const efficiency = ((totalFlow / totalTarget) * 100).toFixed(1);
  const lowCount = ventData.filter(v => v.status === 'LOW').length;

  return (
    <div className="mt-10">
      <div className="text-[clamp(0.9rem,1.1vw,1.2rem)] font-bold tracking-[0.3em] text-cyan-400 mb-4">── VENTILATION SYSTEM · 通风系统 ──</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {ventData.map(v => {
          const pct = Math.min(100, (v.flow / v.target) * 100);
          const isLow = v.status === 'LOW';
          const barColor = isLow ? '#ffaa00' : '#00e5ff';
          const isSel = selectedVent === v.id;
          const extra = VENT_EXTRA[v.id];
          const flowHistory = isSel ? buildFlowHistory(v.flow) : [];
          return (
            <div key={v.id} onClick={() => onToggle(v.id)} style={{
              border: `1px solid ${isSel ? (isLow ? 'rgba(255,170,0,0.7)' : 'rgba(0,229,255,0.5)') : (isLow ? 'rgba(255,170,0,0.3)' : 'rgba(0,229,255,0.1)')}`,
              background: isSel ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.25)',
              padding: '14px', cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
              animation: isLow ? 'warningPulse 2s ease-in-out infinite' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', color: barColor, letterSpacing: '0.1em' }}>{v.id}</div>
                <span style={{
                  padding: '1px 6px', fontSize: '8px', fontFamily: 'monospace', letterSpacing: '0.12em',
                  border: `1px solid ${isLow ? 'rgba(255,170,0,0.4)' : 'rgba(0,229,255,0.2)'}`,
                  background: isLow ? 'rgba(255,170,0,0.08)' : 'rgba(0,229,255,0.04)',
                  color: barColor,
                }}>{v.status}</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(0,229,255,0.35)', letterSpacing: '0.1em', marginBottom: '10px' }}>{v.zone}</div>
              <div style={{ position: 'relative', height: '14px', background: 'rgba(0,229,255,0.04)', border: '1px solid rgba(0,229,255,0.08)', overflow: 'hidden', marginBottom: '8px' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`,
                  background: `linear-gradient(90deg, ${barColor}33, ${barColor}66)`,
                  transition: 'width 0.6s ease',
                }} />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'monospace', fontSize: '8px', color: barColor, opacity: 0.7,
                }}>{pct.toFixed(0)}%</div>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
                <span style={{ color: barColor, fontWeight: 'bold' }}>{v.flow}</span> m³/h / target {v.target} m³/h
              </div>

              {/* ── Expanded detail ── */}
              <div style={{
                maxHeight: isSel ? '420px' : '0px', overflow: 'hidden',
                transition: 'max-height 0.35s ease-in-out, opacity 0.25s ease',
                opacity: isSel ? 1 : 0,
              }}>
                <div style={{ borderTop: `1px solid ${barColor}33`, marginTop: '12px', paddingTop: '12px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: barColor, letterSpacing: '0.2em', marginBottom: '10px' }}>
                    ── {v.id} DETAIL ──
                  </div>

                  <div style={{ fontFamily: 'monospace', fontSize: '9px', lineHeight: '1.8', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: '10px' }}>
                    <div>ZONE: <span style={{ color: barColor }}>{v.zone}</span></div>
                    <div>CURRENT FLOW: <span style={{ color: barColor }}>{v.flow} m³/h</span></div>
                    <div>TARGET FLOW: {v.target} m³/h</div>
                    <div>EFFICIENCY: <span style={{ color: isLow ? '#ffaa00' : '#00ff88' }}>{pct.toFixed(1)}%{isLow ? ' ⚠ LOW' : ''}</span></div>
                    <div style={{ marginTop: '4px' }}>FILTER STATUS: {extra?.filterPct}% capacity remaining</div>
                    <div>LAST MAINTENANCE: {extra?.lastMaint}</div>
                    <div>NEXT SCHEDULED: {extra?.nextMaint}</div>
                  </div>

                  {/* Flow history chart */}
                  <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'rgba(0,229,255,0.3)', letterSpacing: '0.12em', marginBottom: '4px' }}>
                    FLOW HISTORY (last 6 hours)
                  </div>
                  <div style={{ height: 80, background: 'rgba(0,0,0,0.3)', border: `1px solid ${barColor}22`, marginBottom: '10px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={flowHistory} margin={{ top: 6, right: 6, left: -25, bottom: 2 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,229,255,0.05)" />
                        <XAxis dataKey="hour" tick={{ fontSize: 7, fill: 'rgba(0,229,255,0.25)' }} tickLine={false} axisLine={false} />
                        <YAxis tick={false} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#000d1a', border: `1px solid ${barColor}44`, fontFamily: 'monospace', fontSize: 9 }} />
                        <ReferenceLine y={v.target} stroke="rgba(0,229,255,0.3)" strokeDasharray="6 3" strokeWidth={1} />
                        <Line type="monotone" dataKey="flow" stroke={barColor} strokeWidth={1.5} dot={{ r: 2, fill: barColor }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Faults */}
                  {extra && extra.faults.length > 0 && (
                    <div style={{ marginBottom: '10px', padding: '6px 8px', border: '1px solid rgba(255,170,0,0.2)', background: 'rgba(255,170,0,0.04)' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#ffaa00', letterSpacing: '0.15em', marginBottom: '4px' }}>FAULT DIAGNOSIS:</div>
                      {extra.faults.map((f, i) => (
                        <div key={i} style={{ fontFamily: 'monospace', fontSize: '8px', color: 'rgba(255,170,0,0.6)', lineHeight: '1.6' }}>⚠ {f}</div>
                      ))}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => onBoost(v.id)} style={{
                      flex: 1, padding: '5px 6px', fontFamily: 'monospace', fontSize: '8px', letterSpacing: '0.1em',
                      cursor: 'pointer', transition: 'all 0.2s',
                      border: '1px solid rgba(0,255,136,0.3)', background: 'rgba(0,255,136,0.06)', color: '#00ff88',
                    }}>↑ BOOST +20%</button>
                    <button onClick={() => onMaintenance(v.id)} style={{
                      flex: 1, padding: '5px 6px', fontFamily: 'monospace', fontSize: '8px', letterSpacing: '0.1em',
                      cursor: 'pointer', transition: 'all 0.2s',
                      border: '1px solid rgba(0,229,255,0.3)', background: 'rgba(0,229,255,0.06)', color: '#00e5ff',
                    }}>🔧 MAINTENANCE</button>
                    <button onClick={() => onToggle(v.id)} style={{
                      padding: '5px 10px', fontFamily: 'monospace', fontSize: '8px', letterSpacing: '0.1em',
                      cursor: 'pointer', transition: 'all 0.2s',
                      border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)',
                    }}>✕ CLOSE</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: '12px', padding: '10px 16px', display: 'flex', gap: '24px', flexWrap: 'wrap',
        border: '1px solid rgba(0,229,255,0.1)', background: 'rgba(0,0,0,0.15)',
        fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.15em',
      }}>
        <span style={{ color: '#00e5ff' }}>TOTAL FLOW: {totalFlow} m³/h</span>
        <span style={{ color: 'rgba(0,229,255,0.4)' }}>TARGET: {totalTarget} m³/h</span>
        <span style={{ color: +efficiency >= 90 ? '#00ff88' : '#ffaa00' }}>EFFICIENCY: {efficiency}%</span>
        <span style={{ color: lowCount > 0 ? '#ffaa00' : '#00ff88' }}>{lowCount > 0 ? `⚠ LOW VENTS: ${lowCount}` : '✓ ALL VENTS NOMINAL'}</span>
      </div>
      <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '9px', color: 'rgba(0,229,255,0.3)', letterSpacing: '0.1em' }}>
        通风系统为地下城提供氧气循环 · VENTILATION MAINTAINS O₂ CIRCULATION IN UNDERGROUND CITY
      </div>
    </div>
  );
}

// ─── Emergency Evacuation Protocol ──────────────────────────────

const EVACUATION_ROUTES: {
  from: string; label: string; priority: number; route: string; time: string; capacity: number;
  mapPath: string; dimStroke: string;
}[] = [
  { from: 'B1-R2', label: '居民区 B', priority: 1, route: 'B1-R2 → 主通道A → 紧急出口E2', time: '4 MIN', capacity: 2400, mapPath: 'M 445 60 L 560 35', dimStroke: 'rgba(0,255,136,0.45)' },
  { from: 'B1-R1', label: '居民区 A', priority: 2, route: 'B1-R1 → 主通道B → 紧急出口E1', time: '6 MIN', capacity: 2400, mapPath: 'M 155 60 L 40 35', dimStroke: 'rgba(0,229,255,0.45)' },
  { from: 'B2-I1', label: '工业区 A', priority: 3, route: 'B2-I1 → 工业通道 → 紧急出口E3', time: '8 MIN', capacity: 1200, mapPath: 'M 140 188 L 38 182', dimStroke: 'rgba(0,229,255,0.35)' },
  { from: 'B2-I2', label: '工业区 B', priority: 4, route: 'B2-I2 → 工业通道 → 紧急出口E4', time: '8 MIN', capacity: 1200, mapPath: 'M 460 188 L 562 182', dimStroke: 'rgba(0,229,255,0.35)' },
];

function EmergencyEvacuation({ countdown, acknowledged, onAcknowledge, onReset, selectedRoute, onToggleRoute, dispatchedRoutes, onDispatchRoute }: {
  countdown: number; acknowledged: boolean; onAcknowledge: () => void; onReset: () => void;
  selectedRoute: string | null; onToggleRoute: (from: string) => void;
  dispatchedRoutes: string[]; onDispatchRoute: (from: string, label: string, priority: number) => void;
}) {
  const mm = String(Math.floor(countdown / 3600)).padStart(2, '0');
  const ss = String(Math.floor((countdown % 3600) / 60)).padStart(2, '0');
  const ms = String(countdown % 60).padStart(2, '0');
  const nDisp = dispatchedRoutes.length;
  const allDeployed = nDisp >= 4;

  return (
    <div className="mb-10" style={{
      border: '2px solid rgba(255,0,0,0.5)', background: 'rgba(20,0,0,0.6)',
      padding: '24px', boxShadow: '0 0 30px rgba(255,0,0,0.3)',
      animation: 'evacuationFadeIn 0.6s ease-out',
    }}>
      <div style={{
        fontFamily: 'monospace', fontSize: 'clamp(0.9rem,1.1vw,1.2rem)', fontWeight: 'bold',
        letterSpacing: '0.3em', color: '#ff4444', textAlign: 'center', marginBottom: '16px',
        animation: 'blink 1s infinite',
      }}>
        🚨 EMERGENCY EVACUATION PROTOCOL · 紧急疏散预案 🚨
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px',
        padding: '10px 16px', marginBottom: '16px',
        border: '1px solid rgba(255,50,50,0.3)', background: 'rgba(255,0,0,0.08)',
        fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.12em', color: '#ff6666',
      }}>
        <span>⚠ CRISIS DETECTED IN B1-R2 · OXYGEN CRITICAL · INITIATING EVACUATION PROTOCOL</span>
        <span>ESTIMATED AFFECTED POPULATION: 2,400</span>
        <span style={{ color: '#ff4444', fontWeight: 'bold' }}>TIME TO CRITICAL FAILURE: {mm}:{ss}:{ms}</span>
      </div>

      {/* SVG evacuation map */}
      <div style={{ marginBottom: '16px', border: '1px solid rgba(255,50,50,0.2)', background: 'rgba(0,0,0,0.3)', padding: '8px' }}>
        <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: '6px' }}>
          B1 / B2 EVACUATION MAP
        </div>
        <svg width="100%" height="220" viewBox="0 0 600 220">
          <rect x="10" y="10" width="580" height="140" fill="rgba(0,5,15,0.8)" stroke="rgba(0,229,255,0.3)" strokeWidth="1" />
          <rect x="15" y="15" width="280" height="130" fill="rgba(0,229,255,0.05)" stroke="rgba(0,229,255,0.3)" strokeWidth="1" />
          <text x="155" y="85" textAnchor="middle" fill="rgba(0,229,255,0.6)" fontSize="12" fontFamily="monospace">B1-R1 居民区A</text>
          <rect x="305" y="15" width="280" height="130" fill="rgba(255,0,0,0.15)" stroke="rgba(255,50,50,0.6)" strokeWidth="2">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="1s" repeatCount="indefinite" />
          </rect>
          <text x="445" y="75" textAnchor="middle" fill="#ff4444" fontSize="12" fontFamily="monospace">B1-R2 居民区B</text>
          <text x="445" y="95" textAnchor="middle" fill="#ff4444" fontSize="10" fontFamily="monospace">⚠ O₂ CRITICAL</text>
          <rect x="10" y="10" width="60" height="25" fill="rgba(0,255,136,0.3)" stroke="#00ff88" strokeWidth="1.5" />
          <text x="40" y="27" textAnchor="middle" fill="#00ff88" fontSize="10" fontFamily="monospace">EXIT E1</text>
          <rect x="530" y="10" width="60" height="25" fill="rgba(0,255,136,0.3)" stroke="#00ff88" strokeWidth="1.5" />
          <text x="560" y="27" textAnchor="middle" fill="#00ff88" fontSize="10" fontFamily="monospace">EXIT E2</text>

          {EVACUATION_ROUTES.map(r => {
            const dispatched = dispatchedRoutes.includes(r.from);
            const stroke = dispatched ? '#00ff88' : r.dimStroke;
            return (
              <g key={r.from}>
                <path
                  d={r.mapPath}
                  fill="none"
                  stroke={stroke}
                  strokeWidth="2"
                  {...(!dispatched ? { strokeDasharray: '8 4' } : {})}
                  style={dispatched ? undefined : { animation: 'dash 1s linear infinite' }}
                />
                {!dispatched && (
                  <>
                    {r.from === 'B1-R2' && <polygon points="560,35 550,40 555,28" fill="#00ff88" opacity="0.6" />}
                    {r.from === 'B1-R1' && <polygon points="40,35 50,40 45,28" fill="rgba(0,229,255,0.6)" />}
                    {r.from === 'B2-I1' && <polygon points="38,182 48,178 43,186" fill="rgba(0,229,255,0.5)" />}
                    {r.from === 'B2-I2' && <polygon points="562,182 552,178 557,186" fill="rgba(0,229,255,0.5)" />}
                  </>
                )}
                {dispatched && (
                  <>
                    {r.from === 'B1-R2' && <polygon points="560,35 550,40 555,28" fill="#00ff88" />}
                    {r.from === 'B1-R1' && <polygon points="40,35 50,40 45,28" fill="#00ff88" />}
                    {r.from === 'B2-I1' && <polygon points="38,182 48,178 43,186" fill="#00ff88" />}
                    {r.from === 'B2-I2' && <polygon points="562,182 552,178 557,186" fill="#00ff88" />}
                    <circle r="4" fill="#00ff88">
                      <animateMotion dur="3s" repeatCount="indefinite" path={r.mapPath} />
                    </circle>
                  </>
                )}
              </g>
            );
          })}

          <rect x="10" y="158" width="580" height="52" fill="rgba(0,5,15,0.6)" stroke="rgba(0,229,255,0.2)" strokeWidth="1" />
          <text x="300" y="175" textAnchor="middle" fill="rgba(0,229,255,0.35)" fontSize="9" fontFamily="monospace">B2 工业层 · INDUSTRIAL</text>
          <rect x="20" y="182" width="200" height="22" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.2)" strokeWidth="1" />
          <text x="120" y="196" textAnchor="middle" fill="rgba(0,229,255,0.45)" fontSize="9" fontFamily="monospace">B2-I1</text>
          <rect x="380" y="182" width="200" height="22" fill="rgba(0,229,255,0.04)" stroke="rgba(0,229,255,0.2)" strokeWidth="1" />
          <text x="480" y="196" textAnchor="middle" fill="rgba(0,229,255,0.45)" fontSize="9" fontFamily="monospace">B2-I2</text>
          <text x="25" y="208" fill="rgba(0,255,136,0.5)" fontSize="8" fontFamily="monospace">E3</text>
          <text x="575" y="208" textAnchor="end" fill="rgba(0,255,136,0.5)" fontSize="8" fontFamily="monospace">E4</text>
        </svg>
      </div>

      {/* Dispatch status summary */}
      <div style={{
        marginBottom: '14px', padding: '10px 14px',
        border: `1px solid ${allDeployed ? 'rgba(0,255,136,0.35)' : 'rgba(255,50,50,0.25)'}`,
        background: allDeployed ? 'rgba(0,255,136,0.06)' : 'rgba(0,0,0,0.25)',
        fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.15em',
      }}>
        <div style={{ color: allDeployed ? '#00ff88' : '#ff6666', marginBottom: '6px' }}>
          {allDeployed
            ? 'ALL TEAMS DEPLOYED · EVACUATION IN PROGRESS'
            : `DISPATCH STATUS: ${nDisp} / 4 TEAMS ACTIVE`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ fontFamily: 'monospace', letterSpacing: '0.2em', fontSize: '11px', color: '#00ff88' }}>
            {'█'.repeat(nDisp)}{'░'.repeat(4 - nDisp)}
          </span>
        </div>
      </div>

      {/* Route cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {EVACUATION_ROUTES.map(r => {
          const dispatched = dispatchedRoutes.includes(r.from);
          const expanded = selectedRoute === r.from;
          const isP1 = r.priority === 1;
          return (
            <div
              key={r.from}
              className="evac-route-card"
              onClick={() => onToggleRoute(r.from)}
              style={{
                cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
                border: expanded
                  ? `1px solid ${isP1 ? 'rgba(255,80,80,0.85)' : 'rgba(0,229,255,0.55)'}`
                  : `1px solid ${isP1 ? 'rgba(255,50,50,0.5)' : 'rgba(0,229,255,0.15)'}`,
                borderLeft: dispatched ? '3px solid #00ff88' : undefined,
                background: expanded
                  ? (isP1 ? 'rgba(255,0,0,0.1)' : 'rgba(0,229,255,0.08)')
                  : (dispatched ? 'rgba(0,255,136,0.04)' : (isP1 ? 'rgba(255,0,0,0.06)' : 'rgba(0,0,0,0.2)')),
                boxShadow: dispatched ? '0 0 12px rgba(0,255,136,0.12)' : 'none',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${isP1 ? '#ff4444' : '#00e5ff'}`,
                    color: isP1 ? '#ff4444' : '#00e5ff',
                    fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold',
                  }}>P{r.priority}</span>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', color: isP1 ? '#ff4444' : '#00e5ff', letterSpacing: '0.1em' }}>
                      {r.from} · {r.label}
                    </div>
                  </div>
                </div>
                <span style={{
                  padding: '2px 8px', fontSize: '8px', fontFamily: 'monospace', letterSpacing: '0.12em',
                  border: `1px solid ${dispatched ? 'rgba(0,255,136,0.5)' : 'rgba(255,255,255,0.15)'}`,
                  background: dispatched ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.04)',
                  color: dispatched ? '#00ff88' : 'rgba(255,255,255,0.35)',
                }}>
                  {dispatched ? 'ACTIVE · TEAM EN ROUTE' : '● STANDBY'}
                </span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: '6px' }}>
                {r.route}
              </div>
              <div style={{ display: 'flex', gap: '16px', fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.1em' }}>
                <span style={{ color: '#00ff88' }}>EST: {r.time}</span>
                <span style={{ color: 'rgba(0,229,255,0.5)' }}>CAPACITY: {r.capacity.toLocaleString()}</span>
              </div>

              <div style={{
                maxHeight: expanded ? '380px' : '0px', overflow: 'hidden',
                transition: 'max-height 0.35s ease-in-out, opacity 0.25s ease',
                opacity: expanded ? 1 : 0,
              }}>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '10px', paddingTop: '10px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#00e5ff', letterSpacing: '0.2em', marginBottom: '8px' }}>
                    ── ROUTE DETAIL: P{r.priority} ──
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', lineHeight: '1.85', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em', marginBottom: '8px' }}>
                    <div>FROM:{'     '}{r.from} {r.label}</div>
                    <div>ROUTE:{'    '}{r.route}</div>
                    <div>ETA:{'      '}{r.time}</div>
                    <div>CAPACITY: {r.capacity.toLocaleString()} persons/hour</div>
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '9px', color: dispatched ? '#00ff88' : 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
                    CURRENT STATUS:
                    <br />
                    {dispatched ? '● ACTIVE · TEAM EN ROUTE' : '● STANDBY — Awaiting dispatch order'}
                  </div>
                  <div style={{ fontFamily: 'monospace', fontSize: '8px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7', marginBottom: '10px' }}>
                    PERSONNEL REQUIRED:
                    <br />· 2 Emergency Coordinators
                    <br />· 4 Safety Officers
                    <br />· 1 Medical Team
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      disabled={dispatched}
                      onClick={() => !dispatched && onDispatchRoute(r.from, r.label, r.priority)}
                      style={{
                        padding: '6px 12px', fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.12em',
                        cursor: dispatched ? 'not-allowed' : 'pointer', opacity: dispatched ? 0.5 : 1,
                        border: `1px solid ${dispatched ? 'rgba(0,255,136,0.4)' : 'rgba(0,255,136,0.45)'}`,
                        background: dispatched ? 'rgba(0,255,136,0.08)' : 'rgba(0,255,136,0.1)', color: '#00ff88',
                      }}
                    >
                      {dispatched ? '✓ DISPATCHED' : '▶ DISPATCH TEAM'}
                    </button>
                    <button
                      onClick={() => onToggleRoute(r.from)}
                      style={{
                        padding: '6px 12px', fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.12em', cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)',
                      }}
                    >
                      ✕ CLOSE
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <button onClick={onAcknowledge} style={{
          padding: '12px 28px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold',
          letterSpacing: '0.2em', cursor: 'pointer', transition: 'all 0.3s',
          border: acknowledged ? '2px solid rgba(0,255,136,0.5)' : '2px solid rgba(0,229,255,0.5)',
          background: acknowledged ? 'rgba(0,255,136,0.1)' : 'rgba(0,229,255,0.08)',
          color: acknowledged ? '#00ff88' : '#00e5ff',
        }}>
          {acknowledged ? '✓ ACKNOWLEDGED · RESPONSE TEAM DISPATCHED' : '✓ ACKNOWLEDGE CRISIS'}
        </button>
        <button onClick={onReset} style={{
          padding: '12px 28px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 'bold',
          letterSpacing: '0.2em', cursor: 'pointer', transition: 'all 0.3s',
          border: '2px solid rgba(255,170,0,0.5)', background: 'rgba(255,170,0,0.08)', color: '#ffaa00',
        }}>
          ↺ RESET TO NORMAL
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────

function SidebarItem({ to, icon, label, active = false, badge, collapsed = false }: {
  to: string; icon: React.ReactNode; label: string; active?: boolean; badge?: number; collapsed?: boolean;
}) {
  return (
    <li className="relative group/item list-none">
      <Link to={to}
        className={`flex items-center py-2 text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-widest transition-all hover:bg-cyan-500/10 ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} ${active ? 'bg-cyan-500/20 text-cyan-400 border-l-2 border-cyan-400' : 'text-cyan-500/60'}`}>
        <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>{icon}{!collapsed && <span>{label}</span>}</div>
        {!collapsed && badge && <span className="bg-red-500 text-white text-[clamp(0.5rem,0.55vw,0.6875rem)] px-1.5 py-0.5 rounded-full animate-pulse">{badge}</span>}
        {collapsed && badge && <span className="absolute top-0 right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
      </Link>
      {collapsed && (
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-[#000d1a] border border-cyan-500/30 text-[clamp(0.5rem,0.55vw,0.6875rem)] text-cyan-400 tracking-widest whitespace-nowrap opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none z-50">{label}</div>
      )}
    </li>
  );
}
