/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Shield, Cpu, Activity, Lock, User, ChevronRight, FastForward, Volume2, VolumeX } from 'lucide-react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import PodsPage from './pages/PodsPage';
import HabitatPage from './pages/HabitatPage';
import PlaceholderPage from './pages/PlaceholderPage';
import AIEnginePage from './pages/AIEnginePage';

const USERS = [
  { id: 'ADMIN_01', password: 'earth2500', role: 'ADMINISTRATOR', name: 'Administrator' },
  { id: 'OPERATOR_01', password: 'wandering847', role: 'OPERATOR', name: 'Operator' },
  { id: 'ENGINEER_01', password: 'engine2058', role: 'ENGINEER', name: 'Engineer' },
  { id: 'GUEST', password: 'guest123', role: 'OBSERVER', name: 'Observer' },
];

function LoginView() {
  const navigate = useNavigate();
  const [introPhase, setIntroPhase] = useState<'start' | 'ignite' | 'flyby' | 'online' | 'ready' | null>('start');
  const [isMuted, setIsMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const hasAnimated = useRef(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [statusLine, setStatusLine] = useState('SYSTEM ONLINE · 127 PODS ACTIVE · EARTH ENGINE STATUS: NOMINAL');

  // Skip intro handler
  const skipIntro = () => setIntroPhase('ready');

  const initAudio = () => {
    if (audioCtxRef.current) return;
    
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.value = isMuted ? 0 : 1;
    
    audioCtxRef.current = ctx;
    masterGainRef.current = masterGain;
  };

  const playSound = (type: 'ignite' | 'flyby' | 'beep' | 'chime') => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master || isMuted) return;

    if (type === 'ignite') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(40, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 1);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1);
      
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    }

    if (type === 'flyby') {
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      // Doppler effect
      osc.frequency.linearRampToValueAtTime(70, ctx.currentTime + 4);
      osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 8);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 7);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 9);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + 9);
    }

    if (type === 'beep') {
      [880, 1100].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.01);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.1 + 0.08);
        osc.connect(gain);
        gain.connect(master);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.08);
      });
    }

    if (type === 'chime') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  };

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(isMuted ? 0 : 1, audioCtxRef.current?.currentTime || 0, 0.1);
    }
  }, [isMuted]);

  // Intro Sequence Timeline
  useEffect(() => {
    if (introPhase === 'start') return;

    if (introPhase === 'ignite') {
      playSound('ignite');
      const timer = setTimeout(() => setIntroPhase('flyby'), 1200);
      return () => clearTimeout(timer);
    }
    if (introPhase === 'flyby') {
      playSound('flyby');
      // Beeps after 1.5 seconds when text appears
      const beepTimer = setTimeout(() => playSound('beep'), 1500);
      const timer = setTimeout(() => setIntroPhase('online'), 3500);
      return () => {
        clearTimeout(timer);
        clearTimeout(beepTimer);
      };
    }
    if (introPhase === 'online') {
      const timer = setTimeout(() => {
        setIntroPhase('ready');
        playSound('chime');
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [introPhase]);

  // Typing Effect Component
  const TypingText = ({ text, speed = 80 }: { text: string, speed?: number }) => {
    const [displayedText, setDisplayedText] = useState('');
    useEffect(() => {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(timer);
      }, speed);
      return () => clearInterval(timer);
    }, [text, speed]);
    return <span>{displayedText}</span>;
  };

  // Dynamic status updates for the login screen
  useEffect(() => {
    if (introPhase !== 'ready') return;
    const interval = setInterval(() => {
      const statuses = [
        'SYSTEM ONLINE · 127 PODS ACTIVE · EARTH ENGINE STATUS: NOMINAL',
        'SYSTEM ONLINE · 127 PODS ACTIVE · ENGINE OUTPUT: 98.4%',
        'SYSTEM ONLINE · 127 PODS ACTIVE · NAVIGATION: ON COURSE',
        'SYSTEM ONLINE · 127 PODS ACTIVE · HULL INTEGRITY: 100%'
      ];
      setStatusLine(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 5000);
    return () => clearInterval(interval);
  }, [introPhase]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);
    setIsAuthenticating(true);
    setTimeout(() => {
      const user = USERS.find(u => u.id === username && u.password === password);
      if (user) {
        localStorage.setItem('aeonguard_auth', 'true');
        localStorage.setItem('aeonguard_user', JSON.stringify({ id: user.id, role: user.role, name: user.name }));
        setIsAuthenticating(false);
        navigate('/dashboard');
      } else {
        setIsAuthenticating(false);
        setLoginError(true);
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
      }
    }, 2000);
  };

  // Planetary Engine SVG Component (Advanced Version)
  const EarthEngineVisual = ({ size = 400 }: { size?: number }) => (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Base Glow */}
      <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-[80px]" />
      
      <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-[0_0_20px_rgba(6,182,212,0.3)]">
        <defs>
          <radialGradient id="plasmaCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="20%" stopColor="#22d3ee" />
            <stop offset="60%" stopColor="#0891b2" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="plasmaBeam" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(34, 211, 238, 0.9)" />
            <stop offset="40%" stopColor="rgba(34, 211, 238, 0.4)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Engine Structure - Perspective View */}
        <g transform="translate(250, 350)">
          {/* Ground Base / Foundation */}
          <ellipse cx="0" cy="20" rx="180" ry="60" fill="#020617" stroke="#06b6d4" strokeWidth="1" opacity="0.4" />
          
          {/* Support Girders (The 7-8 massive legs) */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <g key={angle} transform={`rotate(${angle})`}>
              {/* Main Leg Structure */}
              <path 
                d="M-15,0 L-40,120 L40,120 L15,0 Z" 
                fill="#0f172a" 
                stroke="#1e293b" 
                strokeWidth="2"
              />
              {/* Mechanical Details on Legs */}
              <path d="M-10,20 L-30,100 M10,20 L30,100" stroke="#06b6d4" strokeWidth="0.5" opacity="0.3" />
              <rect x="-12" y="40" width="24" height="4" fill="#1e293b" />
              <rect x="-18" y="70" width="36" height="4" fill="#1e293b" />
              
              {/* Warning Lights on Legs */}
              <circle cx="-35" cy="110" r="1.5" fill="#ef4444" className="animate-pulse" />
              <circle cx="35" cy="110" r="1.5" fill="#ef4444" className="animate-pulse" />
            </g>
          ))}

          {/* Central Cylinder / Nozzle Housing */}
          <g transform="translate(0, -20)">
            <ellipse cx="0" cy="40" rx="70" ry="25" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
            <rect x="-70" y="-10" width="140" height="50" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
            <ellipse cx="0" cy="-10" rx="70" ry="25" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
            
            {/* Inner Nozzle Ring */}
            <ellipse cx="0" cy="-15" rx="50" ry="18" fill="#020617" stroke="#22d3ee" strokeWidth="3" filter="url(#glow)" />
            
            {/* Plasma Core Glow */}
            <ellipse cx="0" cy="-15" rx="40" ry="14" fill="url(#plasmaCore)" className="animate-pulse" />
          </g>

          {/* Massive Plasma Beam */}
          <g className="animate-[exhaust-pulse_0.15s_ease-in-out_infinite]">
            {/* Main Beam */}
            <path 
              d="M-45,-45 L-60,-800 L60,-800 L45,-45 Z" 
              fill="url(#plasmaBeam)" 
              filter="blur(15px)" 
              opacity="0.8"
            />
            {/* Inner Hot Core */}
            <path 
              d="M-15,-45 L-20,-850 L20,-850 L15,-45 Z" 
              fill="#fff" 
              filter="blur(5px)" 
              opacity="0.6"
            />
            {/* Particle Sparks */}
            {[...Array(10)].map((_, i) => (
              <motion.circle
                key={i}
                r={1 + Math.random() * 2}
                fill="#fff"
                initial={{ x: -20 + Math.random() * 40, y: -50, opacity: 1 }}
                animate={{ y: -400 - Math.random() * 400, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5, ease: "easeOut" }}
              />
            ))}
          </g>
          
          {/* Atmospheric Steam / Smoke at Base */}
          <g opacity="0.3">
            {[...Array(6)].map((_, i) => (
              <motion.ellipse
                key={i}
                rx={40 + Math.random() * 40}
                ry={10 + Math.random() * 10}
                fill="#fff"
                filter="blur(20px)"
                initial={{ x: -100 + Math.random() * 200, y: 0, opacity: 0 }}
                animate={{ y: -50 - Math.random() * 50, opacity: [0, 0.5, 0] }}
                transition={{ repeat: Infinity, duration: 3 + Math.random() * 2, delay: i * 0.5 }}
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );

  // Realistic Earth SVG Component
  const EarthVisual = ({ variant = 'stationary', size = 600 }: { variant?: 'stationary' | 'flyby', size?: number }) => (
    <div className={`relative ${variant === 'flyby' ? 'w-[400px] h-[400px] blur-[2px]' : `w-[${size}px] h-[${size}px]`} transition-all duration-500`} style={{ width: size, height: size }}>
      {/* Atmosphere Glow */}
      <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-[40px]" />
      
      {/* Earth Sphere */}
      <div className="earth-sphere relative h-full w-full overflow-hidden rounded-full border border-cyan-500/30 bg-[#020408]">
        {/* Deep Space Shadow */}
        <div className="absolute inset-0 z-20 bg-gradient-to-tr from-black via-transparent to-transparent opacity-80" />
        
        {/* Continent Map (SVG) */}
        <div className="earth-map absolute inset-0 z-10 opacity-60">
          <svg viewBox="0 0 1000 500" className="h-full w-[200%] animate-[earth-rotate_60s_linear_infinite]">
            <path 
              d="M150,100 Q180,80 220,110 T300,140 T380,100 T450,180 T550,140 T650,100 T750,180 T850,140 T950,100 M100,300 Q150,280 200,320 T350,350 T550,320 T750,280 T950,320 M50,400 Q150,450 250,400 T450,350 T650,400 T850,450 T1000,400" 
              fill="none" 
              stroke="#06b6d4" 
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <path d="M200,150 L220,170 L250,160 L240,140 Z" fill="#06b6d4" opacity="0.4" />
            <path d="M400,250 L430,280 L460,260 L440,230 Z" fill="#06b6d4" opacity="0.3" />
            <g transform="translate(500, 0)">
              <path 
                d="M150,100 Q180,80 220,110 T300,140 T380,100 T450,180 T550,140 T650,100 T750,180 T850,140 T950,100 M100,300 Q150,280 200,320 T350,350 T550,320 T750,280 T950,320 M50,400 Q150,450 250,400 T450,350 T650,400 T850,450 T1000,400" 
                fill="none" 
                stroke="#06b6d4" 
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-[#020408] text-cyan-400 font-mono overflow-hidden selection:bg-cyan-500/30">
      {/* Mute Button */}
      <button 
        onClick={() => setIsMuted(!isMuted)}
        className="fixed top-6 right-6 z-[110] p-2 bg-black/40 border border-cyan-500/20 rounded-full text-cyan-500 hover:bg-cyan-500/10 transition-colors"
      >
        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes star-warp {
          from { transform: translateX(0); }
          to { transform: translateX(-1000px); }
        }
        @keyframes star-drift-up {
          from { transform: translateY(0); }
          to { transform: translateY(-100vh); }
        }
        @keyframes earth-rotate {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes exhaust-pulse {
          0%, 100% { opacity: 0.7; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.3); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
          70% { opacity: 0.8; }
        }
        @keyframes ignite-glow {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.8; transform: scale(1); }
        }
        @keyframes scan-line {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes ticker {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes radar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes data-scroll {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        @keyframes bar-pulse {
          0%, 100% { height: 70%; }
          50% { height: 95%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-4px); }
          30%, 70% { transform: translateX(4px); }
        }

        .starfield-warp {
          position: absolute;
          inset: 0;
          width: 200%;
          background-image: linear-gradient(to right, #fff 1px, transparent 1px);
          background-size: 100px 1px;
          background-repeat: repeat;
          animation: star-warp 0.5s linear infinite;
          opacity: 0.3;
        }

        .star-drift-container {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .star-particle {
          position: absolute;
          width: 2px;
          height: 2px;
          background: #fff;
          border-radius: 50%;
          animation: star-drift-up linear infinite;
        }

        .hex-grid {
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 104l30-17.32V17.32L30 0 0 17.32v69.36L30 104zM30 101.15L2.5 85.27V18.73L30 2.85l27.5 15.88v66.54l-27.5 15.88z' fill='%2306b6d4' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
          opacity: 1; /* Total opacity controlled by fill-opacity in SVG or here */
        }

        .engine-exhaust {
          background: linear-gradient(to bottom, var(--thrust-color), transparent);
          clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);
          animation: exhaust-pulse 0.1s ease-in-out infinite;
          filter: blur(6px);
        }

        .thrust-cyan { --thrust-color: rgba(6, 182, 212, 0.9); }
        .thrust-amber { --thrust-color: rgba(245, 158, 11, 0.9); }

        .engine-core {
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 8px;
          background: #fff;
          border-radius: 50%;
          filter: blur(2px) drop-shadow(0 0 10px #fff);
        }

        @keyframes orbit {
          from { transform: rotate(0deg) translateX(40px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
        }
        @keyframes gauge-fill {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: var(--fill); }
        }

        @keyframes star-warp-cinematic {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes exhaust-flicker {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        @keyframes thrust-flicker {
          0%, 100% { transform: scaleY(1); opacity: 0.8; }
          50% { transform: scaleY(1.1); opacity: 1; }
        }

        .starfield-warp-cinematic {
          position: absolute;
          inset: 0;
          width: 200%;
          background-image: 
            radial-gradient(1px 1px at 10% 10%, #fff, transparent),
            radial-gradient(1px 1px at 20% 50%, #fff, transparent),
            radial-gradient(2px 2px at 40% 80%, #fff, transparent),
            radial-gradient(1px 1px at 60% 20%, #fff, transparent),
            radial-gradient(2px 2px at 80% 40%, #fff, transparent),
            radial-gradient(1px 1px at 90% 70%, #fff, transparent);
          background-size: 50% 100%;
          animation: star-warp-cinematic 0.2s linear infinite;
          opacity: 0.5;
        }

        .exhaust-wake {
          position: absolute;
          left: -400px; /* Positioned to the left of Earth */
          top: 50%;
          transform: translateY(-50%);
          width: 600px;
          height: 300px;
          background: radial-gradient(ellipse at left, rgba(6, 182, 212, 0.3), transparent 80%);
          clip-path: polygon(0% 30%, 0% 70%, 100% 100%, 100% 0%);
          filter: blur(30px);
          animation: exhaust-flicker 0.1s infinite;
          pointer-events: none;
        }

        .thrust-column {
          position: absolute;
          background: linear-gradient(to left, rgba(6, 182, 212, 0.8), transparent);
          width: 200px;
          height: 1px;
          transform-origin: right;
          animation: thrust-flicker 0.05s infinite;
        }

        .terminal-card {
          background: rgba(0, 8, 20, 0.88);
          border: 1px solid rgba(6, 182, 212, 0.4);
          box-shadow: 0 0 60px rgba(6, 182, 212, 0.25);
          backdrop-filter: blur(15px);
        }

        .scan-line {
          position: absolute;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(to right, transparent, rgba(6, 182, 212, 0.5), transparent);
          animation: scan-line 4s linear infinite;
          pointer-events: none;
          z-index: 5;
        }

        .nebula-glow {
          background: radial-gradient(circle at center, rgba(30, 58, 138, 0.2) 0%, transparent 70%);
        }

        .side-panel {
          background: rgba(6, 182, 212, 0.03);
          border-right: 1px solid rgba(6, 182, 212, 0.1);
          backdrop-filter: blur(5px);
        }

        .radar-sweep {
          background: conic-gradient(from 0deg, rgba(6, 182, 212, 0.4), transparent 90deg);
          animation: radar-sweep 4s linear infinite;
        }

        .data-line-container {
          mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
        }
      ` }} />

      {/* Skip Button */}
      {introPhase !== 'ready' && introPhase !== null && (
        <button
          onClick={skipIntro}
          className="absolute right-8 top-8 z-50 flex items-center gap-2 rounded-sm border border-cyan-500/30 bg-black/50 px-4 py-2 text-[clamp(0.625rem,0.7vw,0.875rem)] uppercase tracking-widest text-cyan-500 hover:bg-cyan-500/10 transition-colors"
        >
          <FastForward size={14} />
          SKIP INTRO / 跳过
        </button>
      )}

      <AnimatePresence mode="wait">
        {introPhase === 'start' && (
          <motion.div
            key="start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-pointer"
            onClick={() => {
              initAudio();
              setIntroPhase('ignite');
            }}
          >
            <div className="text-center">
              <div className="text-cyan-500 animate-pulse flex flex-col items-center gap-6">
                <div className="text-[4rem] leading-none">
                  <Terminal size={80} className="mx-auto" />
                </div>
                <div className="text-[clamp(2rem,3.5vw,3.5rem)] tracking-[0.5em] font-bold">CLICK TO BEGIN</div>
                <div className="text-[clamp(0.9rem,1.2vw,1.2rem)] tracking-[0.3em] opacity-50">点击启动系统</div>
              </div>
            </div>
          </motion.div>
        )}

        {introPhase === 'ignite' && (
          <motion.div
            key="ignite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-screen items-center justify-start bg-black"
          >
            <div className="ml-[-100px] h-screen w-[300px] bg-gradient-to-r from-cyan-500/40 to-transparent blur-[100px] animate-[ignite-glow_1s_ease-out_infinite]" />
          </motion.div>
        )}

        {introPhase === 'flyby' && (
          <motion.div
            key="flyby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex h-screen w-full items-center overflow-hidden bg-black"
          >
            {/* Cinematic Starfield Warp */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              className="starfield-warp-cinematic"
            />
            
            {/* Cinematic Earth Flyby */}
            <motion.div
              initial={{ x: '-60vw', scale: 0.8 }}
              animate={{ x: '160vw', scale: 1.1 }}
              transition={{ 
                duration: 3.5, // Slower animation
                ease: [0.2, 0, 0.8, 1], // cubic-bezier(0.2, 0, 0.8, 1)
                times: [0, 1]
              }}
              className="absolute flex items-center justify-center"
            >
              <div className="relative">
                {/* Exhaust Wake (Pushing from the left) */}
                <div className="exhaust-wake" />
                
                {/* Earth Sphere */}
                <EarthVisual variant="flyby" size={320} />
                
                {/* Thrust Columns (Planetary Engines on the left side) */}
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(20)].map((_, i) => {
                    // Position engines on the left hemisphere (from 90deg to 270deg)
                    const angle = (Math.PI / 2) + (i / 20) * Math.PI; 
                    const x = Math.cos(angle) * 150;
                    const y = Math.sin(angle) * 150;
                    return (
                      <div 
                        key={i}
                        className="thrust-column"
                        style={{
                          left: `calc(50% + ${x} - 200px)`,
                          top: `calc(50% + ${y}px)`,
                          width: `${100 + Math.random() * 150}px`,
                          opacity: 0.3 + Math.random() * 0.5,
                          animationDelay: `${Math.random() * 0.1}s`
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* HUD Overlay during flyby */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 1, 1, 0] }}
                transition={{ 
                  times: [0, 0.3, 0.5, 0.7, 1],
                  duration: 8 
                }}
                className="text-center space-y-4"
              >
                <div className="text-[clamp(1.5rem,2vw,2rem)] font-bold tracking-[0.5em] text-cyan-400 [text-shadow:0_0_15px_rgba(6,182,212,0.8)]">
                  ENGINE OUTPUT: 150%
                </div>
                <div className="text-[clamp(1.125rem,1.4vw,1.5rem)] tracking-[0.3em] text-cyan-500/80">
                  VELOCITY: +0.3% c
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {introPhase === 'online' && (
          <motion.div
            key="online"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, delay: 0.5 } }}
            transition={{ duration: 0.6 }}
            className="flex h-screen items-center justify-center bg-black"
          >
            <div className="text-[clamp(1.5rem,2vw,2rem)] tracking-[0.5em] font-bold">
              <TypingText text="永卫系统 · ONLINE" speed={50} />
            </div>
          </motion.div>
        )}

        {introPhase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative flex min-h-screen flex-col items-center justify-center p-4"
          >
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="hex-grid" />
              
              {/* Nebula Gradients */}
              <div className="absolute bottom-0 right-0 w-[800px] h-[800px] nebula-glow translate-x-1/4 translate-y-1/4" />
              <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-radial-gradient from-purple-900/10 to-transparent -translate-x-1/4 -translate-y-1/4" />

              {/* Upward Drifting Stars */}
              <div className="star-drift-container">
                {[...Array(50)].map((_, i) => (
                  <div 
                    key={i} 
                    className="star-particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      opacity: Math.random(),
                      animationDuration: `${5 + Math.random() * 10}s`,
                      animationDelay: `${-Math.random() * 10}s`
                    }}
                  />
                ))}
              </div>

              {/* Orbital Arcs */}
              <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
                <circle cx="100%" cy="100%" r="60%" fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="10 20" />
                <circle cx="100%" cy="100%" r="80%" fill="none" stroke="#06b6d4" strokeWidth="0.5" strokeDasharray="5 15" />
              </svg>

              {/* Background Earth (Bottom Right) */}
              <div className="absolute bottom-[-200px] right-[-200px] pointer-events-none opacity-60">
                <EarthVisual size={800} />
              </div>

              {/* Planetary Engine (Bottom Left) */}
              <div className="absolute bottom-[50px] left-[-180px] pointer-events-none opacity-50 rotate-[-10deg]">
                <EarthEngineVisual size={800} />
              </div>

              {/* Left Side Panel (Secondary HUD) */}
              <div className="side-panel absolute left-4 top-4 bottom-4 w-[18vw] z-10 p-6 flex flex-col gap-8 hidden xl:flex border border-cyan-500/10 rounded-sm">
                {/* Radar Sweep */}
                <div className="flex flex-col items-center">
                  <div className="relative w-[60%] aspect-square border border-cyan-500/20 rounded-full overflow-hidden">
                    <div className="absolute inset-0 radar-sweep" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-[1px] bg-cyan-500/20" />
                      <div className="h-full w-[1px] bg-cyan-500/20 absolute" />
                      <div className="w-1/2 h-1/2 border border-cyan-500/10 rounded-full absolute" />
                    </div>
                  </div>
                  <div className="mt-2 text-[clamp(0.5rem,0.55vw,0.6875rem)] opacity-40 uppercase tracking-tighter text-center w-full">Radar: Active</div>
                </div>

                {/* Engine Output Bars */}
                <div className="space-y-4">
                  <div className="text-[clamp(0.625rem,0.7vw,0.875rem)] uppercase tracking-widest opacity-50 mb-2">Engine Output</div>
                  <div className="flex justify-between items-end h-40 px-2 bg-cyan-500/5 border border-cyan-500/10 py-2">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="flex flex-col items-center gap-2 h-full justify-end">
                        <div className="w-4 bg-cyan-500/10 border border-cyan-500/20 relative h-full overflow-hidden">
                          <motion.div 
                            animate={{ height: ['60%', '90%', '75%', '95%', '65%'] }}
                            transition={{ repeat: Infinity, duration: 2 + n * 0.5, ease: "easeInOut" }}
                            className="absolute bottom-0 left-0 w-full bg-cyan-500/40"
                          />
                        </div>
                        <span className="text-[clamp(0.5rem,0.55vw,0.6875rem)] opacity-40">E{n}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scrolling Data Lines */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="text-[clamp(0.625rem,0.7vw,0.875rem)] uppercase tracking-widest opacity-50 mb-2">System Diagnostics</div>
                  <div className="flex-1 data-line-container overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full animate-[data-scroll_20s_linear_infinite] flex flex-col gap-2">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="text-[clamp(0.5rem,0.55vw,0.6875rem)] opacity-30 whitespace-nowrap">
                          {`> UNIT_${1000 + i} : TEMP ${30 + Math.floor(Math.random() * 10)}C : STATUS OK`}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Panel (Navigation & Crew HUD) */}
              <div className="side-panel absolute right-4 top-4 bottom-4 w-[18vw] z-10 p-6 flex flex-col gap-8 hidden xl:flex border border-cyan-500/10 rounded-sm overflow-hidden">
                {/* Navigation Status */}
                <div className="space-y-3">
                  <div className="text-[clamp(0.625rem,0.7vw,0.875rem)] uppercase tracking-widest opacity-50 mb-2 whitespace-nowrap">Navigation Status / 导航状态</div>
                  <div className="relative aspect-video border border-cyan-500/20 bg-black/40 flex items-center justify-center overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 60">
                      <ellipse cx="50" cy="30" rx="40" ry="20" fill="none" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="0.5" strokeDasharray="2 2" />
                      <circle cx="50" cy="30" r="3" fill="#eab308" /> {/* Sun icon */}
                      <circle cx="50" cy="30" r="2" fill="#06b6d4" className="animate-[orbit_10s_linear_infinite]" />
                    </svg>
                  </div>
                </div>

                {/* Crew Roster */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="text-[clamp(0.625rem,0.7vw,0.875rem)] uppercase tracking-widest opacity-50 mb-2 whitespace-nowrap">Crew Roster / 机组名单</div>
                  <div className="flex-1 data-line-container overflow-hidden relative bg-cyan-500/5 p-2">
                    <div className="absolute top-0 left-0 w-full animate-[data-scroll_15s_linear_infinite] flex flex-col gap-2">
                      {[
                        { name: 'CHEN_WEI', pod: '04', status: 'VITAL NOMINAL' },
                        { name: 'ZHANG_LI', pod: '11', status: 'VITAL NOMINAL' },
                        { name: 'YANOV_K', pod: '23', status: 'DORMANT' },
                        { name: 'SMITH_J', pod: '09', status: 'VITAL NOMINAL' },
                        { name: 'TANAKA_H', pod: '15', status: 'VITAL NOMINAL' },
                        { name: 'GARCIA_M', pod: '31', status: 'DORMANT' }
                      ].map((crew, i) => (
                        <div key={i} className="text-[clamp(0.5rem,0.55vw,0.6875rem)] opacity-40 whitespace-nowrap">
                          {`> ${crew.name} : POD_${crew.pod} : ${crew.status}`}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Circular Gauges */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { label: 'OXYGEN', val: 85, color: '#06b6d4' },
                      { label: 'PRESSURE', val: 92, color: '#06b6d4' },
                      { label: 'RADIATION', val: 12, color: '#eab308' }
                    ].map((gauge, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="relative w-[55px] h-[55px]">
                          <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path
                              className="opacity-20"
                              stroke={gauge.color}
                              strokeWidth="2"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              stroke={gauge.color}
                              strokeWidth="2"
                              strokeDasharray={`${gauge.val}, 100`}
                              strokeLinecap="round"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-[clamp(0.5625rem,0.625vw,0.8125rem)] font-bold" style={{ color: gauge.color }}>
                            {gauge.val}%
                          </div>
                        </div>
                        <span className="text-[clamp(0.375rem,0.45vw,0.5rem)] opacity-50 text-center uppercase">{gauge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Login Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              className="w-full max-w-lg z-10"
            >
              <div className="terminal-card relative overflow-hidden rounded-sm p-8 md:p-12">
                <div className="scan-line" />
                
                {/* HUD Corners */}
                <div className="pointer-events-none absolute inset-0 z-20">
                  <div className="absolute left-4 top-4 h-8 w-8 border-l border-t border-cyan-500/40" />
                  <div className="absolute right-4 top-4 h-8 w-8 border-r border-t border-cyan-500/40" />
                  <div className="absolute bottom-4 left-4 h-8 w-8 border-l border-b border-cyan-500/40" />
                  <div className="absolute bottom-4 right-4 h-8 w-8 border-r border-b border-cyan-500/40" />
                </div>

                {/* Header Section */}
                <div className="mb-10 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6 flex justify-center gap-4"
                  >
                    <div className="flex flex-col items-center gap-1 rounded-sm border border-cyan-500/20 bg-cyan-500/5 px-3 py-1">
                      <span className="text-[clamp(0.5rem,0.55vw,0.6875rem)] uppercase tracking-tighter opacity-50">Pods</span>
                      <span className="text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold text-cyan-400">127 ACTIVE</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 rounded-sm border border-cyan-500/20 bg-cyan-500/5 px-3 py-1">
                      <span className="text-[clamp(0.5rem,0.55vw,0.6875rem)] uppercase tracking-tighter opacity-50">Engine</span>
                      <span className="text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold text-cyan-400">NOMINAL</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 rounded-sm border border-cyan-500/20 bg-cyan-500/5 px-3 py-1">
                      <span className="text-[clamp(0.5rem,0.55vw,0.6875rem)] uppercase tracking-tighter opacity-50">Year</span>
                      <span className="text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold text-cyan-400">847</span>
                    </div>
                  </motion.div>

                  <h1 className="text-[clamp(2.25rem,3vw,3rem)] font-bold tracking-[0.3em] text-cyan-400 [text-shadow:0_0_15px_rgba(6,182,212,0.6)]">
                    AEONGUARD
                  </h1>
                  <div className="mb-2 text-[clamp(0.625rem,0.8vw,0.8125rem)] font-medium tracking-[0.5em] text-cyan-500/80">
                    永卫系统
                  </div>
                  <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent mb-4" />
                  <p className="text-[clamp(0.625rem,0.7vw,0.875rem)] uppercase tracking-[0.2em] text-cyan-500/50">
                    Decision Control Centre — Year 847 of the Wandering Earth Project
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6" style={shaking ? { animation: 'shake 0.6s ease-in-out' } : undefined}>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[clamp(0.625rem,0.7vw,0.875rem)] uppercase tracking-widest text-cyan-500/70">
                      <User size={12} />
                      Operator ID / 操作员编号
                    </label>
                    <div className="group relative">
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full rounded-sm border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 text-[clamp(0.75rem,0.9vw,0.9375rem)] tracking-widest text-cyan-100 outline-none transition-all focus:border-cyan-500/60 focus:bg-cyan-500/10"
                        placeholder="ENTER ID..."
                      />
                      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-400 transition-all group-focus-within:w-full" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[clamp(0.625rem,0.7vw,0.875rem)] uppercase tracking-widest text-cyan-500/70">
                      <Lock size={12} />
                      Access Code / 访问密钥
                    </label>
                    <div className="group relative">
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-sm border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 text-[clamp(0.75rem,0.9vw,0.9375rem)] tracking-widest text-cyan-100 outline-none transition-all focus:border-cyan-500/60 focus:bg-cyan-500/10"
                        placeholder="••••••••"
                      />
                      <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-cyan-400 transition-all group-focus-within:w-full" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="relative w-full overflow-hidden rounded-sm border border-cyan-500/40 bg-cyan-500/10 py-4 text-[clamp(0.625rem,0.8vw,0.8125rem)] font-bold uppercase tracking-[0.3em] text-cyan-400 transition-all hover:bg-cyan-500/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isAuthenticating ? (
                        <>
                          <Activity className="animate-pulse" size={14} />
                          AUTHENTICATING...
                        </>
                      ) : (
                        <>
                          AUTHENTICATE / 身份验证
                          <ChevronRight size={14} />
                        </>
                      )}
                    </span>
                    {isAuthenticating && (
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"
                      />
                    )}
                  </button>

                  {loginError && (
                    <div className="text-center text-[clamp(0.625rem,0.7vw,0.875rem)] font-bold tracking-widest text-red-400">
                      ⚠ ACCESS DENIED · INVALID CREDENTIALS · 身份验证失败
                    </div>
                  )}
                </form>

                {/* Footer Info */}
                <div className="mt-10 border-t border-cyan-500/10 pt-6">
                  <div className="mb-4 text-center text-[clamp(0.5625rem,0.625vw,0.8125rem)] font-bold tracking-widest text-amber-500/80">
                    CLEARANCE LEVEL REQUIRED: ADMINISTRATOR
                  </div>
                  <div className="flex items-center justify-between text-[clamp(0.5625rem,0.625vw,0.8125rem)] uppercase tracking-widest text-cyan-500/40">
                    <div className="flex items-center gap-2">
                      <Activity size={10} />
                      {statusLine}
                    </div>
                  </div>
                  
                  {/* Ticker */}
                  <div className="mt-4 overflow-hidden border-t border-cyan-500/5 bg-black/40 py-1">
                    <div className="animate-[ticker_30s_linear_infinite] whitespace-nowrap text-[clamp(0.5rem,0.55vw,0.6875rem)] text-cyan-500/30">
                      {`> Hull integrity: 99.7% · > Fusion reactor output stable · > Navigation system locked · > Oxygen levels: 21.0% · > External temp: -84C · > Pod 42-A status: Stable · > Engine 3 thrust: Nominal · > Communication link: Active`}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD Corners */}
      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="absolute left-8 top-8 h-12 w-12 border-l-2 border-t-2 border-cyan-500/20" />
        <div className="absolute right-8 top-8 h-12 w-12 border-r-2 border-t-2 border-cyan-500/20" />
        <div className="absolute bottom-8 left-8 h-12 w-12 border-l-2 border-b-2 border-cyan-500/20" />
        <div className="absolute bottom-8 right-8 h-12 w-12 border-r-2 border-b-2 border-cyan-500/20" />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginView />} />
        <Route path="/dashboard" element={<HomePage />} />
        <Route path="/dashboard/pods" element={<PodsPage />} />
        <Route path="/dashboard/habitat" element={<HabitatPage />} />
        <Route path="/dashboard/ai" element={<AIEnginePage />} />
        <Route path="/dashboard/override" element={<PlaceholderPage title="人工决策 OVERRIDE" />} />
        <Route path="/dashboard/mission" element={<PlaceholderPage title="任务档案 MISSION LOG" />} />
        <Route path="/dashboard/crew" element={<PlaceholderPage title="机组名单 CREW ROSTER" />} />
        <Route path="/dashboard/syslog" element={<PlaceholderPage title="系统日志 SYSTEM LOG" />} />
        <Route path="/dashboard/settings" element={<PlaceholderPage title="设置 SETTINGS" />} />
      </Routes>
    </BrowserRouter>
  );
}
