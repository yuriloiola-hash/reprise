'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export type Disponibilidade = {
  tipo: 'turno' | 'horario_fixo';
  grade?: Record<string, string[]>;
  horarios?: Record<string, string>;
};

export type MedicoRow = {
  _id: string; // Local ID for React keys
  crm: string; // Unique, immutable identifier
  nome: string;
  categoria: string;
  especialidade: string;
  cidade: string;
  clinica: string;
  dias_visita: string[];
  disponibilidade: Disponibilidade;
  rotas: string[];
  flags: {
    multiRota: boolean;
    semHorarioFixo: boolean;
  };
  status: 'ok' | 'incompleto' | 'erro';
  dbError?: string;
};

export const CIDADES_ROTAS: Record<string, string[]> = {
  'Sobral': ['Sobral'],
  'Ibiapaba': ['Viçosa', 'Tianguá', 'Ibiapina', 'Guaraciaba do Norte', 'São Benedito'],
  'Acaraú': ['Itapipoca', 'Acaraú', 'Cruz', 'Bela Cruz', 'Marco', 'Camocim', 'Jijoca'],
  'Crateús': ['Santa Quitéria', 'Crateús', 'Tauá', 'Ipu', 'Ipueiras']
};

export const TODAS_CIDADES = Object.values(CIDADES_ROTAS).flat().sort();

export function calcularRotasEFlags(cidadesStr: string) {
  const cidadesDetectadas = cidadesStr.split(/[,\/]/).map(c => c.trim()).filter(Boolean);
  const rotasSet = new Set<string>();
  
  cidadesDetectadas.forEach(cid => {
    for (const [rota, cidadesList] of Object.entries(CIDADES_ROTAS)) {
      if (cidadesList.some(c => c.toLowerCase() === cid.toLowerCase())) {
        rotasSet.add(rota);
      }
    }
  });

  const rotas = Array.from(rotasSet);
  return {
    rotas,
    multiRota: rotas.length > 1
  };
}

export function validateRow(row: Partial<MedicoRow>): 'ok' | 'incompleto' | 'erro' {
  // CRM missing or not numeric → fatal error (cannot import)
  if (!row.crm || !/^\d+$/.test(row.crm.trim())) return 'erro';
  // Name missing → fatal error
  if (!row.nome || row.nome.trim() === '') return 'erro';
  // Missing important but non-fatal fields → incomplete
  if (!row.categoria || !row.cidade || !row.especialidade) return 'incompleto';
  return 'ok';
}

export function useImport() {
  const [rows, setRows] = useState<MedicoRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const supabase = createClient();

  const handlePaste = (text: string) => {
    // Detect separator
    const isTab = text.indexOf('\t') !== -1;
    const separator = isTab ? '\t' : ',';
    
    const lines = text.split('\n').filter(line => line.trim() !== '');
    if (lines.length < 2) return; // Need at least header + 1 row

    const headers = lines[0].split(separator).map(h => h.toLowerCase().trim());
    
    // Fuzzy matching headers
    const map = {
      crm:          headers.findIndex(h => h.includes('crm')),
      nome:         headers.findIndex(h => h.includes('nome')),
      categoria:    headers.findIndex(h => h.includes('cat')),
      especialidade:headers.findIndex(h => h.includes('esp')),
      cidade:       headers.findIndex(h => h.includes('cidade')),
      clinica:      headers.findIndex(h => h.includes('clinica') || h.includes('clínica')),
      dias:         headers.findIndex(h => h.includes('dias')),
      horario:      headers.findIndex(h => h.includes('horário') || h.includes('horario') || h.includes('turno'))
    };

    const newRows: MedicoRow[] = lines.slice(1).map((line, index) => {
      const cols = line.split(separator).map(c => c.trim());
      const crm = map.crm >= 0 ? cols[map.crm].replace(/\D/g, '') : ''; // Strip non-digits
      const nome = map.nome >= 0 ? cols[map.nome] : '';
      let categoria = map.categoria >= 0 ? cols[map.categoria].toUpperCase() : '';
      if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(categoria)) categoria = '';
      
      const cidade = map.cidade >= 0 ? cols[map.cidade] : '';
      const { rotas, multiRota } = calcularRotasEFlags(cidade);
      
      const diasStr = map.dias >= 0 ? cols[map.dias] : '';
      const dias_visita = diasStr ? diasStr.split(/[,\/]/).map(d => d.trim()) : [];
      
      const obj: Partial<MedicoRow> = {
        _id: `row-${Date.now()}-${index}`,
        crm,
        nome,
        categoria,
        especialidade: map.especialidade >= 0 ? cols[map.especialidade] : '',
        cidade,
        clinica: map.clinica >= 0 ? cols[map.clinica] : '',
        dias_visita,
        rotas,
        disponibilidade: { tipo: 'turno', grade: {} }, // Default
        flags: { multiRota, semHorarioFixo: true } // Default
      };
      obj.status = validateRow(obj);
      return obj as MedicoRow;
    });

    setRows(newRows);
  };

  const updateRow = (id: string, updates: Partial<MedicoRow>) => {
    setRows(prev => prev.map(r => {
      if (r._id === id) {
        const updated = { ...r, ...updates };
        if (updates.cidade) {
          const { rotas, multiRota } = calcularRotasEFlags(updates.cidade);
          updated.rotas = rotas;
          updated.flags = { ...updated.flags, multiRota };
        }
        updated.status = validateRow(updated);
        return updated;
      }
      return r;
    }));
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r._id !== id));
  };

  const loadExample = () => {
    const exemplos = [
      "CRM\tNome do Médico\tCategoria\tEspecialidade\tCidade\tClínica\tDias\tTurno",
      "12345\tDr. Carlos Silva\tQ1\tCardiologia\tSobral\tClínica Coração\tSegunda, Quarta\tManhã",
      "23456\tDra. Maria Souza\tQ2\tPediatria\tTianguá\tClínica Kids\tTerça\tTarde",
      "34567\tDr. João Mendes\tQ3\tDermatologia\tAcaraú\tPele Bela\tQuinta\tManhã",
      "45678\tDra. Ana Costa\tQ1\tNeurologia\tCrateús\tNeuro Centro\tSexta\tTarde",
      "56789\tDr. Pedro Alves\tQ4\tOrtopedia\tSobral\tOrto Vida\tQuarta\tManhã"
    ].join('\n');
    handlePaste(exemplos);
  };

  const importRows = async (ignoreErrors: boolean) => {
    setIsImporting(true);
    setProgress(0);
    
    let toImport = [...rows];
    if (ignoreErrors) {
      toImport = toImport.filter(r => r.status === 'ok');
    }

    let successCount = 0;
    
    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      if (row.status === 'erro' && !ignoreErrors) continue; // Skip fatal errors even if not ignoring incomplete

      const { _id, dbError, status, ...dbData } = row;
      
      const { error } = await supabase
        .from('medicos')
        .upsert(dbData, { onConflict: 'crm' }); // CRM is the immutable unique key

      if (error) {
        setRows(prev => prev.map(r => r._id === _id ? { ...r, status: 'erro', dbError: error.message } : r));
      } else {
        setRows(prev => prev.map(r => r._id === _id ? { ...r, status: 'ok', dbError: undefined } : r));
        successCount++;
      }
      
      setProgress(Math.round(((i + 1) / toImport.length) * 100));
    }
    
    setIsImporting(false);
    return successCount;
  };

  return {
    rows,
    handlePaste,
    updateRow,
    removeRow,
    loadExample,
    importRows,
    isImporting,
    progress,
    setRows
  };
}
