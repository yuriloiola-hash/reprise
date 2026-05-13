'use client';

import { calcularStatusVisita } from '@/lib/visitStatus';
import { GpsButton } from '@/components/GpsButton';
import { MapPin, Clock, Plus } from 'lucide-react';

interface TimeGridProps {
  visitas: any[];
  hoje: string;
  onCellClick: (date: string, time: string, visita?: any) => void;
}

export function TimeGrid({ visitas, hoje, onCellClick }: TimeGridProps) {
  const slots = [];
  for (let hour = 7; hour <= 18; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
    slots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const getCatBadge = (cat: string | null) => {
    switch (cat) {
      case 'CAT1': return 'bg-[#FEF3C7] text-[#92400E]';
      case 'CAT2': return 'bg-[#DBEAFE] text-[#1E40AF]';
      case 'CAT3': return 'bg-[#E0E7FF] text-[#3730A3]';
      case 'CAT4': return 'bg-[#F1F5F9] text-[#475569]';
      default: return 'bg-brand-bg text-brand-text-muted';
    }
  };

  return (
    <div className="relative">
      {slots.map((slot) => {
        const visitaNoSlot = visitas.find(v => v.hora_planejada?.startsWith(slot));
        const statusInfo = visitaNoSlot ? calcularStatusVisita({
          dataPlanejada: visitaNoSlot.data_planejada,
          preVisitaFeita: visitaNoSlot.pre_visita_feita,
          posVisitaFeita: visitaNoSlot.pos_visita_feita,
        }) : null;

        return (
          <div key={slot} className="group relative flex min-h-[48px] border-t border-dashed border-[#E8EFF8]">
            {/* Marcador de Tempo Lateral */}
            <div className="w-[60px] flex-shrink-0 flex items-start justify-end pr-4 pt-3">
              <span className="font-mono text-[12px] text-brand-text-muted">
                {slot}
              </span>
            </div>

            {/* Célula / Card */}
            <div className="flex-1 py-1 pr-1 relative">
              {visitaNoSlot ? (
                <div 
                  onClick={() => onCellClick(hoje, slot, visitaNoSlot)}
                  className={`h-full w-full rounded-[8px] p-[10px_16px] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 transition-all duration-200 shadow-[0_1px_4px_rgba(13,27,42,0.06)] hover:shadow-[0_4px_16px_rgba(0,71,204,0.10)] hover:-translate-y-[1px] border border-brand-border border-l-[4px] cursor-pointer ${statusInfo?.borderColor} ${statusInfo?.pillBg}`}>
                  
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-display font-semibold text-[15px] text-brand-text">
                        {visitaNoSlot.medicos?.nome}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getCatBadge(visitaNoSlot.medicos?.categoria_cat)}`}>
                        {visitaNoSlot.medicos?.categoria_cat || 'S/C'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <p className="font-sans text-[13px] text-brand-text-muted">
                        {visitaNoSlot.medicos?.especialidade}
                      </p>
                      
                      {/* Pill de Status */}
                      <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase ${statusInfo?.pillBg} ${statusInfo?.pillText}`}>
                        <div className={`w-2 h-2 rounded-full ${statusInfo?.dotColor} ${statusInfo?.id === 'ATRASADO' ? 'animate-pulse' : ''}`} />
                        {statusInfo?.label}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1 font-sans text-[12px] text-brand-text-muted">
                        <MapPin size={12} className="text-brand-primary" />
                        {visitaNoSlot.medicos?.local_complexo || 'Endereço não informado'}
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto mt-2 md:mt-0">
                    <GpsButton medico={visitaNoSlot.medicos} />
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => onCellClick(hoje, slot)}
                  className="absolute inset-y-1 inset-x-0 ml-1 mr-1 flex items-center pl-4 rounded-[8px] cursor-pointer hover:bg-brand-bg transition-colors group/empty opacity-0 hover:opacity-100"
                >
                  <div className="flex items-center gap-2">
                    <Plus size={16} className="text-brand-secondary" />
                    <span className="text-[12px] font-sans font-medium text-brand-secondary">
                      Adicionar visita
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
