'use client';

import { useState, useEffect } from 'react';
import { TimeGrid } from '@/components/dashboard/TimeGrid';
import { WeeklyGrid } from '@/components/dashboard/WeeklyGrid';
import { DoctorSelector } from '@/components/dashboard/DoctorSelector';
import { VisitDrawer } from '@/components/dashboard/VisitDrawer';
import { calcularStatusVisita } from '@/lib/visitStatus';
import { 
  ChevronLeft, ChevronRight, Loader2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DashboardContainerProps {
  initialVisitas: any[];
  hoje: string;
}

export function DashboardContainer({ initialVisitas, hoje }: DashboardContainerProps) {
  const [view, setView] = useState<'hoje' | 'semana'>('hoje');
  const [weekOffset, setWeekOffset] = useState(0);
  const [visitas, setVisitas] = useState(initialVisitas);
  const [loading, setLoading] = useState(false);
  
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);

  const getDiasDaSemana = (offset: number) => {
    const agora = new Date();
    const diaDaSemana = agora.getDay();
    const diffParaSegunda = agora.getDate() - diaDaSemana + (diaDaSemana === 0 ? -6 : 1) + (offset * 7);
    const segunda = new Date(agora);
    segunda.setDate(diffParaSegunda);
    segunda.setHours(0, 0, 0, 0);

    const dias = [];
    for (let i = 0; i < 5; i++) {
      const dia = new Date(segunda);
      dia.setDate(segunda.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  const diasAtuais = getDiasDaSemana(weekOffset);
  const visitasHoje = visitas.filter(v => v.data_planejada === hoje);

  useEffect(() => {
    async function fetchVisitas() {
      setLoading(true);
      const start = diasAtuais[0].toISOString().split('T')[0];
      const end = diasAtuais[4].toISOString().split('T')[0];

      const { data } = await supabase
        .from('visitas')
        .select('*, medicos (*)')
        .gte('data_planejada', start)
        .lte('data_planejada', end)
        .order('hora_planejada');

      if (data) setVisitas(data);
      setLoading(false);
    }
    fetchVisitas();
  }, [weekOffset]);

  const handleCellClick = (date: string, time: string, visita: any = null) => {
    if (visita) {
      setSelectedVisit(visita);
    } else {
      setSelectedSlot({ date, time });
      setIsSelectorOpen(true);
    }
  };

  const handleDoctorSelect = async (doctorId: string) => {
    if (!selectedSlot) return;

    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = '/login';
        return;
      }

      const { error } = await supabase
        .from('visitas')
        .insert({
          rep_id: user.id,
          medico_id: doctorId,
          data_planejada: selectedSlot.date,
          hora_planejada: selectedSlot.time,
          status: 'PLANEJADO',
          pre_visita_feita: false,
          pos_visita_feita: false
        });

      if (error) {
        alert('Erro ao agendar: ' + error.message);
      } else {
        // Refresh visits
        setWeekOffset(prev => prev); 
        setIsSelectorOpen(false);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedVisitStatus = selectedVisit ? calcularStatusVisita({
    dataPlanejada: selectedVisit.data_planejada,
    preVisitaFeita: selectedVisit.pre_visita_feita,
    posVisitaFeita: selectedVisit.pos_visita_feita,
  }) : null;

  return (
    <div className="bg-brand-bg min-h-screen">
      {/* Topbar */}
      <header className="sticky top-0 z-40 h-[64px] bg-white/80 backdrop-blur-xl border-b border-brand-border px-6 flex items-center justify-between shadow-sm">
        <h1 className="font-display font-semibold text-[22px] text-brand-text">
          {view === 'hoje' ? 'Roteiro Diário' : 'Planejamento Semanal'}
        </h1>
        
        <div className="flex items-center gap-4">
          {view === 'semana' && (
             <div className="flex items-center bg-brand-primary/10 rounded-full px-1 py-1 text-brand-primary font-mono text-[13px] border border-brand-primary/20">
               <button onClick={() => setWeekOffset(v => v - 1)} className="px-2 hover:text-brand-primary/70 transition-colors">
                 <ChevronLeft size={16} />
               </button>
               <span className="px-2 font-medium tracking-tight">
                 {diasAtuais[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '')} – {diasAtuais[4].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase().replace('.', '')}
               </span>
               <button onClick={() => setWeekOffset(v => v + 1)} className="px-2 hover:text-brand-primary/70 transition-colors">
                 <ChevronRight size={16} />
               </button>
               {loading && <Loader2 size={14} className="animate-spin ml-2" />}
             </div>
          )}

          <div className="flex bg-white rounded-lg border border-brand-border p-1">
            <button 
              onClick={() => setView('hoje')}
              className={`px-4 py-1.5 rounded-md text-sm font-sans font-medium transition-all ${
                view === 'hoje' ? 'bg-brand-primary text-white shadow-sm' : 'bg-transparent text-brand-text-muted hover:bg-brand-bg'
              }`}
            >
              DIA
            </button>
            <button 
              onClick={() => setView('semana')}
              className={`px-4 py-1.5 rounded-md text-sm font-sans font-medium transition-all ${
                view === 'semana' ? 'bg-brand-primary text-white shadow-sm' : 'bg-transparent text-brand-text-muted hover:bg-brand-bg'
              }`}
            >
              SEMANA
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="p-6 md:p-8 max-w-[1200px] mx-auto">
        {isSelectorOpen && (
          <DoctorSelector 
            onSelect={handleDoctorSelect} 
            onClose={() => setIsSelectorOpen(false)} 
          />
        )}
        
        {selectedVisit && (
          <VisitDrawer 
            visita={selectedVisit}
            statusInfo={selectedVisitStatus}
            onClose={() => setSelectedVisit(null)}
          />
        )}

        {view === 'hoje' ? (
          <div className="bg-white rounded-xl shadow-sm border border-brand-border p-6 min-h-[700px]">
            <TimeGrid visitas={visitasHoje} hoje={hoje} onCellClick={handleCellClick} />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-brand-border p-6 overflow-hidden min-h-[700px]">
            <WeeklyGrid 
              visitas={visitas} 
              diasDaSemana={diasAtuais} 
              onCellClick={handleCellClick}
            />
          </div>
        )}
      </div>
    </div>
  );
}
