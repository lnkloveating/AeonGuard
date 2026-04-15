import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#020814] font-mono text-cyan-400">
      <div className="border border-cyan-500/30 bg-cyan-500/5 p-[3vw] text-center space-y-6">
        <h1 className="text-[clamp(1.25rem,1.6vw,1.625rem)] font-bold tracking-[0.3em]">{title}</h1>
        <p className="text-[clamp(0.625rem,0.8vw,0.8125rem)] opacity-50 tracking-widest uppercase">System module under maintenance or restricted access.</p>
        <div className="pt-8">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-[clamp(0.625rem,0.7vw,0.875rem)] tracking-[0.3em] text-cyan-400/60 hover:text-cyan-400 transition-colors mx-auto w-fit"
          >
            <ChevronLeft size={14} /> BACK TO COMMAND CENTRE
          </Link>
        </div>
      </div>
    </div>
  );
}
