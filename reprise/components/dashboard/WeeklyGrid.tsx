'use client';

import { calcularStatusVisita } from '@/lib/visitStatus';
import { Plus } from 'lucide-react';

interface WeeklyGridProps {
  visitas: any[];
  diasDaSemana: Date[];
  onCellClick: (date: string, time: string) => void;
}

export function WeeklyGrid({ visitas, diasDaSemana, onCellClick }: WeeklyGridProps) {
  const slots = [];
  for (let hour = 7; hour <= 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const hojeStr = new Date().toISOString().split('T')[0];

  return (
    <div className="overflow-x-auto custom-scrollbar">
      <div className="min-w-[800px]">
        {/* Cabeçalho de Dias */}
        <div className="grid grid-cols-[80px_repeat(5,1fr)] mb-4">
          <div /> {/* Espaço para coluna de tempo */}
          {diasDaSemana.map((dia) => {
            const isHoje = dia.toISOString().split('T')[0] === hojeStr;
            return (
              <div key={dia.toISOString()} className="flex flex-col items-center justify-center pb-2">
                <span className="font-display font-medium text-[11px] uppercase tracking-widest text-brand-text-muted mb-1">
                  {dia.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                </span>
                <div className={`w-10 h-10 flex items-center justify-center rounded-full ${isHoje ? 'bg-[#EEF3FC]' : ''}`}>
                  <span className={`font-display font-bold text-[28px] ${isHoje ? 'text-brand-primary' : 'text-brand-text'}`}>
                    {dia.getDate()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grade de Horários */}
        <div className="grid grid-cols-[80px_repeat(5,1fr)]">
          {slots.map((slot) => (
            <div key={slot} className="contents group">
              {/* Rótulo de Tempo */}
              <div className="h-[48px] flex items-start justify-end pr-[12px] pt-[14px]">
                <span className="font-mono text-[12px] text-brand-text-muted">
                  {slot}
                </span>
              </div>

              {/* Células por Dia */}
              {diasDaSemana.map((dia) => {
                const dataStr = dia.toISOString().split('T')[0];
                const visitaNoSlot = visitas.find(v => 
                  v.data_planejada === dataStr && 
                  v.hora_planejada?.startsWith(slot)
                );

                const isFuturo = dataStr > hojeStr;
                const statusInfo = visitaNoSlot ? calcularStatusVisita({
                  dataPlanejada: visitaNoSlot.data_planejada,
                  preVisitaFeita: visitaNoSlot.pre_visita_feita,
                  posVisitaFeita: visitaNoSlot.pos_visita_feita,
                }) : null;

                return (
                  <div 
                    key={`${dataStr}-${slot}`} 
                    onClick={() => {
                      if (visitaNoSlot) onCellClick(dataStr, slot, visitaNoSlot);
                      else onCellClick(dataStr, slot);
                    }}
                    className={`h-[48px] border-t border-dashed border-[#E8EFF8] border-l border-l-[#F0F4FA] relative transition-colors group/cell ${
                      !visitaNoSlot ? 'hover:bg-[#F7FAFF] cursor-pointer' : 'cursor-pointer'
                    }`}
                  >
                    {visitaNoSlot ? (
                      <div className={`absolute inset-[2px] rounded-[8px] p-[6px_10px] shadow-sm border-l-[3px] overflow-hidden flex flex-col justify-center ${
                        isFuturo 
                          ? 'bg-slate-100 border-slate-400 text-slate-500' 
                          : `${statusInfo?.pillBg} ${statusInfo?.borderColor} text-brand-text`
                      }`}>
                        <p className="font-display font-semibold text-[11px] truncate leading-tight">
                          {visitaNoSlot.medicos?.nome}
                        </p>
                        <p className="font-sans text-[9px] text-brand-text-muted truncate">
                          {visitaNoSlot.medicos?.clinica || 'Cons.'}
                        </p>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity">
                        <Plus size={14} className="text-brand-secondary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
