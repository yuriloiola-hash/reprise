'use client';

import React, { useState } from 'react';
import { Disponibilidade } from '../../hooks/useImport';

interface DisponibilidadeModalProps {
  initialValue: Disponibilidade;
  onSave: (val: Disponibilidade) => void;
  onClose: () => void;
}

const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const TURNOS = ['Manhã', 'Tarde'];

export default function DisponibilidadeModal({ initialValue, onSave, onClose }: DisponibilidadeModalProps) {
  const [tipo, setTipo] = useState<'turno' | 'horario_fixo'>(initialValue.tipo || 'turno');
  const [grade, setGrade] = useState<Record<string, string[]>>(initialValue.grade || {});
  const [horarios, setHorarios] = useState<Record<string, string>>(initialValue.horarios || {});

  const toggleTurno = (dia: string, turno: string) => {
    setGrade(prev => {
      const diaArr = prev[dia] || [];
      if (diaArr.includes(turno)) {
        return { ...prev, [dia]: diaArr.filter(t => t !== turno) };
      } else {
        return { ...prev, [dia]: [...diaArr, turno] };
      }
    });
  };

  const handleHorarioChange = (dia: string, val: string) => {
    // Only allow numbers
    const numStr = val.replace(/\D/g, '');
    let formatted = '';
    
    if (numStr) {
      let num = parseInt(numStr, 10);
      if (num > 23) num = 23;
      formatted = `${num.toString().padStart(2, '0')}:00`;
    }

    setHorarios(prev => ({
      ...prev,
      [dia]: formatted
    }));
  };

  const handleSave = () => {
    onSave({ tipo, grade: tipo === 'turno' ? grade : undefined, horarios: tipo === 'horario_fixo' ? horarios : undefined });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-brand-border">
        <div className="px-6 py-4 border-b border-brand-border bg-slate-50 flex justify-between items-center">
          <h2 className="font-brand font-bold text-brand-text text-lg">Disponibilidade</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">&times;</button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex gap-4">
            <button
              onClick={() => setTipo('turno')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors border ${tipo === 'turno' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              Turno (Manhã/Tarde)
            </button>
            <button
              onClick={() => setTipo('horario_fixo')}
              className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors border ${tipo === 'horario_fixo' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              Horário Fixo
            </button>
          </div>

          {tipo === 'turno' && (
            <div className="space-y-3">
              {DIAS.map(dia => (
                <div key={dia} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-semibold text-slate-700">{dia}</div>
                  <div className="flex flex-1 gap-2">
                    <button
                      onClick={() => toggleTurno(dia, 'Manhã')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all border ${
                        (grade[dia] || []).includes('Manhã') 
                          ? 'bg-amber-100 border-amber-400 text-amber-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-amber-50 hover:border-amber-200'
                      }`}
                    >
                      Manhã
                    </button>
                    <button
                      onClick={() => toggleTurno(dia, 'Tarde')}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all border ${
                        (grade[dia] || []).includes('Tarde') 
                          ? 'bg-indigo-100 border-indigo-400 text-indigo-800' 
                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-indigo-50 hover:border-indigo-200'
                      }`}
                    >
                      Tarde
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tipo === 'horario_fixo' && (
            <div className="space-y-3">
              {DIAS.map(dia => (
                <div key={dia} className="flex items-center gap-4">
                  <div className="w-24 text-sm font-semibold text-slate-700">{dia}</div>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="—"
                      value={horarios[dia] || ''}
                      onChange={(e) => handleHorarioChange(dia, e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-500 pt-2">Digite as horas (ex: 7 para 07:00, 14 para 14:00).</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-brand-border bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">Cancelar</button>
          <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700">Salvar Disponibilidade</button>
        </div>
      </div>
    </div>
  );
}
