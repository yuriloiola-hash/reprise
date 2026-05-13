'use client';

import { Navigation } from 'lucide-react';
import { buildGpsLinks } from '@/lib/gpsLinks';
import { Database } from '@/lib/database.types';

type Medico = Database['public']['Tables']['medicos']['Row'];

interface GpsButtonProps {
  medico: Medico | null;
}

export function GpsButton({ medico }: GpsButtonProps) {
  if (!medico) return null;

  const handleGpsClick = () => {
    const { googleMaps, appleMaps } = buildGpsLinks(medico);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    window.open(isIOS ? appleMaps : googleMaps, '_blank');
  };

  return (
    <button
      onClick={handleGpsClick}
      className="group relative flex items-center justify-center gap-3 px-6 h-[52px] w-full md:w-auto bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:shadow-2xl hover:shadow-blue-500/30 transition-all active:scale-95"
    >
      <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-white/20 transition-colors">
        <Navigation size={14} className="text-white" />
      </div>
      <span>Abrir GPS</span>
      
      {/* Efeito de brilho no hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </button>
  );
}
