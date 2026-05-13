'use client';

import { X, MapPin, Clock, FileText, CheckCircle, Search, Calendar, User } from 'lucide-react';
import Link from 'next/link';

interface VisitDrawerProps {
  visita: any;
  statusInfo: any;
  onClose: () => void;
}

export function VisitDrawer({ visita, statusInfo, onClose }: VisitDrawerProps) {
  if (!visita) return null;

  const dataFormatada = new Date(visita.data_planejada + 'T00:00:00').toLocaleDateString('pt-BR', { 
    weekday: 'long', day: 'numeric', month: 'long' 
  });

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Overlay escuro */}
      <div 
        className="absolute inset-0 bg-brand-sidebar/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-bg/30">
          <h2 className="font-display font-semibold text-lg text-brand-text">Detalhes da Visita</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-brand-bg text-brand-text-muted transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
          {/* Header do Médico */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-semibold text-[22px] text-brand-text">
                  {visita.medicos?.nome}
                </h3>
                <span className="text-brand-text-muted text-sm font-medium">·</span>
                <p className="font-sans text-sm text-brand-text-muted">
                  {visita.medicos?.especialidade}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-indigo-100 text-indigo-700">
                  {visita.medicos?.categoria_cat || 'CAT3'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${statusInfo?.pillBg || 'bg-brand-bg'} ${statusInfo?.pillText || 'text-brand-text-muted'}`}>
                  {statusInfo?.label}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-border space-y-3">
              <div className="flex items-start gap-3 font-sans text-sm text-brand-text-muted">
                <MapPin size={16} className="text-brand-primary mt-0.5 shrink-0" />
                <span>
                  {visita.medicos?.clinica} · {visita.medicos?.local_complexo}
                  {visita.medicos?.sala_andar && ` · Sala ${visita.medicos.sala_andar}`}
                </span>
              </div>
              <div className="flex items-center gap-3 font-sans text-sm text-brand-text-muted">
                <Clock size={16} className="text-brand-primary shrink-0" />
                <span className="capitalize">{dataFormatada} às {visita.hora_planejada?.substring(0, 5)}</span>
              </div>
            </div>
          </div>

          <hr className="border-brand-border" />

          {/* Ações Principais */}
          <div className="space-y-3">
            {!visita.pre_visita_feita ? (
              <Link 
                href={`/visitas/${visita.id}/pre-visita`}
                className="flex items-center justify-center gap-2 w-full py-4 bg-brand-primary text-white rounded-[12px] font-sans font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
              >
                <FileText size={18} />
                📋 Iniciar Pré-Visita
              </Link>
            ) : !visita.pos_visita_feita ? (
              <Link 
                href={`/visitas/${visita.id}/pos-visita`}
                className="flex items-center justify-center gap-2 w-full py-4 bg-green-600 text-white rounded-[12px] font-sans font-medium hover:bg-green-700 transition-all shadow-sm hover:shadow-md"
              >
                <CheckCircle size={18} />
                ✅ Registrar Pós-Visita
              </Link>
            ) : (
              <button className="flex items-center justify-center gap-2 w-full py-4 bg-gray-100 text-gray-500 rounded-[12px] font-sans font-medium hover:bg-gray-200 transition-colors">
                <Search size={18} />
                🔍 Ver Resumo da Visita
              </button>
            )}

            <Link 
              href={`/medicos/${visita.medico_id}`} 
              className="flex items-center justify-center gap-2 w-full py-4 bg-white border border-brand-border text-brand-text rounded-[12px] font-sans font-medium hover:bg-brand-bg transition-colors shadow-sm"
            >
              <User size={18} />
              Ver Perfil Médico
            </Link>
            
            {!visita.pos_visita_feita && (
              <button className="flex items-center justify-center gap-2 w-full py-4 bg-transparent text-brand-text-muted hover:text-brand-text transition-colors font-sans font-medium">
                <Calendar size={18} />
                Reagendar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
