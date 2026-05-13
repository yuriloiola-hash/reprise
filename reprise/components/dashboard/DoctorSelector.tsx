'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X, User } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Doctor {
  id: string;
  nome: string;
  especialidade: string;
  clinica: string | null;
}

interface DoctorSelectorProps {
  onSelect: (doctorId: string) => void;
  onClose: () => void;
}

export function DoctorSelector({ onSelect, onClose }: DoctorSelectorProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDoctors() {
      const { data } = await supabase
        .from('medicos')
        .select('id, nome, especialidade, clinica')
        .order('nome');
      
      if (data) setDoctors(data);
      setLoading(false);
    }
    loadDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doc => 
    doc.nome.toLowerCase().includes(search.toLowerCase()) || 
    doc.especialidade.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-brand-sidebar/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[20px] shadow-[0_20px_40px_rgba(10,22,40,0.1)] overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
          <div>
            <h3 className="font-display font-semibold text-lg text-brand-text">Selecionar Médico</h3>
            <p className="font-sans text-sm text-brand-text-muted">Agende uma nova visita</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-brand-bg rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              autoFocus
              type="text"
              placeholder="Buscar por nome ou especialidade..."
              className="w-full pl-11 pr-4 py-3 bg-brand-bg border border-transparent rounded-[12px] font-sans text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {loading ? (
              <div className="text-center py-10 text-brand-text-muted font-sans text-sm animate-pulse">Carregando médicos...</div>
            ) : filteredDoctors.length > 0 ? (
              filteredDoctors.map(doc => (
                <button
                  key={doc.id}
                  onClick={() => onSelect(doc.id)}
                  className="w-full flex items-center gap-4 p-3 rounded-[12px] hover:bg-brand-bg group transition-colors text-left border border-transparent hover:border-brand-border"
                >
                  <div className="w-10 h-10 bg-white border border-brand-border rounded-[8px] flex items-center justify-center text-brand-text-muted group-hover:text-brand-primary transition-colors">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="font-display font-medium text-brand-text group-hover:text-brand-primary transition-colors">{doc.nome}</p>
                    <p className="font-sans text-[11px] text-brand-text-muted uppercase tracking-wide">{doc.especialidade} • {doc.clinica || 'Sem Clínica'}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="font-sans text-sm text-brand-text-muted">Nenhum médico encontrado</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-brand-bg border-t border-brand-border">
          <Link 
            href="/medicos/novo"
            className="flex items-center justify-center gap-2 w-full py-3 bg-brand-primary text-white rounded-[8px] font-sans font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            CADASTRAR NOVO MÉDICO
          </Link>
        </div>
      </div>
    </div>
  );
}
