'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, MapPin, Stethoscope, ChevronRight, Star, Plus, LayoutGrid, Table2, ArrowUpDown, TrendingUp, TrendingDown, Minus, Target, ShieldAlert, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Sparkline } from '@/components/medicos/Sparkline';

interface Medico {
  id: string;
  nome: string;
  especialidade: string;
  clinica: string;
  local_complexo: string; // Bairro
  marcas_chave: string[];
  prescricoes?: any[]; // For table view
}

const ESPECIALIDADES = ['Todas', 'Neurologia', 'Cardiologia', 'Psiquiatria', 'Reumatologia', 'Ortopedia', 'Clínico Geral'];
const MARCAS_NEURO = ['Todas as Marcas', 'Patz SL', 'Patz Gts', 'Lyberdia Gts', 'Lyberdia Caps', 'Konduz', 'Cymbi'];
const TRIMESTRES_PADRAO = ['1T26', '4T25', '3T25', '2T25', '1T25'];

const SIRIUS_BRANDS_BY_SPECIALTY: Record<string, string[]> = {
  Neurologia: ['Patz SL', 'Patz Gts', 'Lyberdia Gts', 'Lyberdia Caps', 'Konduz', 'Cymbi'],
  Psiquiatria: ['Patz SL', 'Patz Gts', 'Lyberdia Gts', 'Lyberdia Caps', 'Konduz', 'Cymbi'],
  Cardiologia: ['Brasart', 'Brasart HCT', 'Brasart BCC', 'Vynaxa 20', 'Vynaxa 2,5', 'Patz SL', 'Somalgin Cardio'],
  Reumatologia: ['Condres Longbio', 'Condres Ultra', 'Konduz', 'Cymbi'],
  Ortopedia: ['Condres Longbio', 'Condres Ultra', 'Konduz', 'Cymbi'],
  'Clínico Geral': ['Brasart', 'Patz SL', 'Vynaxa', 'Konduz', 'Cymbi']
};

export default function MedicosPage() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Global Filters
  const [search, setSearch] = useState('');
  const [filterEspecialidade, setFilterEspecialidade] = useState('Todas');
  const [filterBairro, setFilterBairro] = useState('');
  
  // BI Options
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [trimestre, setTrimestre] = useState('1T26');
  const [filterMarca, setFilterMarca] = useState('Todas as Marcas');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    async function fetchMedicos() {
      const { data } = await supabase
        .from('medicos')
        .select('*, prescricoes(*)')
        .order('nome');
      
      if (data) setMedicos(data);
      setLoading(false);
    }
    fetchMedicos();
  }, []);

  const filteredMedicos = medicos.filter(m => {
    const matchesSearch = m.nome.toLowerCase().includes(search.toLowerCase());
    const matchesEsp = filterEspecialidade === 'Todas' || m.especialidade === filterEspecialidade;
    const matchesBairro = !filterBairro || (m.local_complexo && m.local_complexo.toLowerCase().includes(filterBairro.toLowerCase()));
    return matchesSearch && matchesEsp && matchesBairro;
  });

  // BI Data processing for the Global Table
  const processTableData = () => {
    let rows: any[] = [];
    const prevTrimestre = '4T25';

    filteredMedicos.forEach(m => {
      const fullBrandList = SIRIUS_BRANDS_BY_SPECIALTY[m.especialidade] || [];

      if (filterMarca === 'Todas as Marcas') {
        // --- VISÃO CONSOLIDADA (UM MÉDICO POR LINHA) ---
        let totalN = 0;
        let totalSirius = 0;
        let prevTotalN = 0;
        let prevTotalSirius = 0;
        let brandStats: { marca: string, minha: number }[] = [];

        fullBrandList.forEach(marca => {
          const pData = (m.prescricoes || []).find(p => p.trimestre === trimestre && p.marca_sirius === marca);
          const prevPData = (m.prescricoes || []).find(p => p.trimestre === prevTrimestre && p.marca_sirius === marca);
          
          if (pData) {
            totalN += pData.quantidade_total;
            totalSirius += pData.quantidade_minha_marca;
            brandStats.push({ marca, minha: pData.quantidade_minha_marca });
          }
          if (prevPData) {
            prevTotalN += prevPData.quantidade_total;
            prevTotalSirius += prevPData.quantidade_minha_marca;
          }
        });

        const marketShare = totalN > 0 ? (totalSirius / totalN) * 100 : 0;
        const prevMarketShare = prevTotalN > 0 ? (prevTotalSirius / prevTotalN) * 100 : 0;
        const deltaShare = marketShare - prevMarketShare;

        // Top 3 marcas mais prescritas
        const top3 = brandStats
          .sort((a, b) => b.minha - a.minha)
          .slice(0, 3)
          .map(s => s.marca);

        // Sparkline consolidado (Soma de toda a linha)
        const sparklineData = [...TRIMESTRES_PADRAO].reverse().map(t => {
          let tSirius = 0, tTotal = 0, tConc = 0;
          fullBrandList.forEach(marca => {
            const pt = (m.prescricoes || []).find(p => p.trimestre === t && p.marca_sirius === marca);
            if (pt) {
              tSirius += pt.quantidade_minha_marca;
              tTotal += pt.quantidade_total;
              tConc += (pt.concorrentes || []).reduce((acc: number, cur: any) => acc + cur.quantidade, 0);
            }
          });
          return { t, sirius: tSirius, conc: tConc, total: tTotal };
        });

        rows.push({
          id: m.id,
          medico_id: m.id,
          nome: m.nome,
          especialidade: m.especialidade,
          marca: top3.length > 0 ? top3 : ['Nenhuma'], // Exibe top 3 marcas
          isAggregated: true,
          nTotal: totalN,
          minhaMarca: totalSirius,
          marketShare,
          deltaShare,
          sparklineData,
          tags: [] // Sem tags na visão consolidada
        });

      } else {
        // --- VISÃO DETALHADA (FILTRO POR MARCA ATIVO) ---
        const marca = filterMarca;
        const pData = (m.prescricoes || []).find(p => p.trimestre === trimestre && p.marca_sirius === marca);
        const prevPData = (m.prescricoes || []).find(p => p.trimestre === prevTrimestre && p.marca_sirius === marca);
        
        const nTotal = pData?.quantidade_total ?? 0;
        const minhaMarca = pData?.quantidade_minha_marca ?? 0;
        const marketShare = nTotal > 0 ? (minhaMarca / nTotal) * 100 : 0;

        const prevNTotal = prevPData?.quantidade_total ?? 0;
        const prevMinhaMarca = prevPData?.quantidade_minha_marca ?? 0;
        const prevMarketShare = prevNTotal > 0 ? (prevMinhaMarca / prevNTotal) * 100 : 0;
        const deltaShare = marketShare - prevMarketShare;
        
        const topConcorrentes = (pData?.concorrentes || [])
          .sort((a: any, b: any) => b.quantidade - a.quantidade)
          .slice(0, 2);

        const sparklineData = [...TRIMESTRES_PADRAO].reverse().map(t => {
          const pt = (m.prescricoes || []).find(p => p.trimestre === t && p.marca_sirius === marca);
          return { 
            t, sirius: pt?.quantidade_minha_marca ?? 0, 
            conc: (pt?.concorrentes || []).reduce((acc: number, cur: any) => acc + cur.quantidade, 0), 
            total: pt?.quantidade_total ?? 0 
          };
        });

        // Smart Tags Logic
        const tags = [];
        if (marketShare < 30 && nTotal >= 10) tags.push({ label: 'Potencial de Crescimento', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: <Target size={10} /> });
        if (marketShare >= 60) tags.push({ label: 'Defender Posição', color: 'bg-blue-50 text-brand-primary border-blue-100', icon: <ShieldAlert size={10} /> });
        if (nTotal >= 10 && minhaMarca === 0) tags.push({ label: 'Alerta: Rejeição', color: 'bg-red-50 text-red-600 border-red-100', icon: <AlertCircle size={10} /> });
        if (deltaShare > 0.1) tags.push({ label: 'Ganho de Tração', color: 'bg-green-100 text-green-800 border-green-200', icon: <TrendingUp size={10} /> });
        if (deltaShare < -0.1) tags.push({ label: 'Perda de Share', color: 'bg-orange-50 text-orange-700 border-orange-100', icon: <TrendingDown size={10} /> });

        rows.push({
          id: `${m.id}-${marca}`,
          medico_id: m.id,
          nome: m.nome,
          especialidade: m.especialidade,
          marca: [marca],
          nTotal,
          minhaMarca,
          topConcorrentes,
          marketShare,
          deltaShare,
          sparklineData,
          tags
        });
      }
    });

    if (sortConfig !== null) {
      rows.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (sortConfig.key === 'nome') return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return rows;
  };

  const tableData = processTableData();

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="p-8 md:p-12 max-w-[1550px] mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-primary font-brand font-bold text-xs uppercase tracking-[0.2em]">
              <Stethoscope size={16} />
              Painel Médico
            </div>
            <h1 className="text-4xl font-brand font-bold text-brand-text tracking-tighter">Médicos</h1>
            <p className="text-lg text-brand-text-muted font-sans font-medium">Gestão de contatos e inteligência competitiva Sirius.</p>
          </div>

          <Link 
            href="/medicos/novo"
            className="flex items-center gap-2 px-6 py-3.5 bg-brand-primary text-white rounded-[14px] font-brand font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={16} />
            NOVO MÉDICO
          </Link>
        </header>

        {/* Global Controls */}
        <div className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm mb-8 space-y-6">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center">
            
            <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-border">
              <button 
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-brand font-bold transition-all ${
                  viewMode === 'cards' ? 'bg-white text-brand-primary shadow-sm' : 'bg-transparent text-brand-text-muted hover:text-brand-text'
                }`}
              >
                <LayoutGrid size={14} /> Relacionamento
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-brand font-bold transition-all ${
                  viewMode === 'table' ? 'bg-brand-primary text-white shadow-md' : 'bg-transparent text-brand-text-muted hover:text-brand-text'
                }`}
              >
                <Table2 size={14} /> BI (Potencial)
              </button>
            </div>

            <div className="flex-1 w-full flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar por nome..." 
                  className="w-full pl-11 pr-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl text-xs font-sans outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <select 
                  className="w-full px-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl text-xs font-sans font-bold outline-none focus:ring-2 focus:ring-brand-primary/20 appearance-none"
                  value={filterEspecialidade}
                  onChange={(e) => setFilterEspecialidade(e.target.value)}
                >
                  {ESPECIALIDADES.map(esp => <option key={esp} value={esp}>{esp}</option>)}
                </select>
              </div>
            </div>

            {viewMode === 'table' && (
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-brand-border">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-brand-border shadow-sm">
                  <span className="text-[10px] font-bold text-brand-text-muted uppercase tracking-wider">Marca:</span>
                  <select 
                    className="bg-transparent border-none text-xs font-bold text-brand-text outline-none cursor-pointer"
                    value={filterMarca}
                    onChange={(e) => setFilterMarca(e.target.value)}
                  >
                    {MARCAS_NEURO.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/5 rounded-lg border border-brand-primary/10">
                  <span className="text-[10px] font-bold text-brand-primary uppercase tracking-wider">Trimestre:</span>
                  <select 
                    className="bg-transparent border-none text-xs font-bold text-brand-primary outline-none cursor-pointer"
                    value={trimestre}
                    onChange={(e) => setTrimestre(e.target.value)}
                  >
                    {TRIMESTRES_PADRAO.slice(0, 4).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List Content */}
        {loading ? (
          <div className="text-center py-24 font-brand font-bold text-brand-text-muted animate-pulse uppercase tracking-[0.3em] text-sm">
            Processando Inteligência Sirius...
          </div>
        ) : tableData.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[32px] border border-dashed border-brand-border">
            <p className="text-brand-text-muted font-sans font-medium">Nenhum dado analítico encontrado para este filtro.</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredMedicos.map(medico => (
              <Link 
                key={medico.id}
                href={`/medicos/${medico.id}`}
                className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] hover:-translate-y-1 transition-all group flex flex-col md:flex-row md:items-center gap-6"
              >
                <div className="w-14 h-14 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-text-muted group-hover:bg-brand-primary group-hover:text-white transition-all">
                  <Stethoscope size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-brand font-bold text-brand-text group-hover:text-brand-primary transition-colors">{medico.nome}</h3>
                  <p className="text-xs text-brand-text-muted font-sans font-bold uppercase tracking-wider mt-0.5">{medico.especialidade} • {medico.clinica || 'Sem Clínica'}</p>
                </div>
                <ChevronRight size={20} className="text-brand-border group-hover:text-brand-primary" />
              </Link>
            ))}
          </div>
        ) : (
          /* BIG PRESCRIPTION TABLE (BI) */
          <div className="bg-white rounded-[24px] border border-brand-border shadow-md overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1300px]">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-brand-border text-[10px] uppercase font-brand font-bold text-brand-text-muted tracking-widest">
                    <th className="p-6 cursor-pointer hover:bg-white transition-colors" onClick={() => handleSort('nome')}>
                      <div className="flex items-center gap-2">Médico <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="p-6 cursor-pointer hover:bg-white transition-colors" onClick={() => handleSort('marca')}>
                      <div className="flex items-center gap-2">{filterMarca === 'Todas as Marcas' ? 'Produtos (Top 3)' : 'Produto'} <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="p-6 cursor-pointer hover:bg-white transition-colors w-24" onClick={() => handleSort('nTotal')}>
                      <div className="flex items-center gap-2">N Total <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="p-6 cursor-pointer hover:bg-white transition-colors w-24" onClick={() => handleSort('minhaMarca')}>
                      <div className="flex items-center gap-2 text-brand-primary">Sirius <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="p-6">Concorrentes (Top 2)</th>
                    <th className="p-6 cursor-pointer hover:bg-white transition-colors w-40" onClick={() => handleSort('marketShare')}>
                      <div className="flex items-center gap-2">Share % <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="p-6 cursor-pointer hover:bg-white transition-colors w-24" onClick={() => handleSort('deltaShare')}>
                      <div className="flex items-center gap-2">Δ (vs 4T25) <ArrowUpDown size={12} /></div>
                    </th>
                    <th className="p-6 w-32 text-center">Evolução (5T)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {tableData.map((row) => (
                    <tr key={row.id} className="hover:bg-brand-bg/30 transition-colors group">
                      <td className="p-6">
                        <Link href={`/medicos/${row.medico_id}`} className="block group">
                          <p className="font-brand font-bold text-brand-text group-hover:text-brand-primary transition-colors">{row.nome}</p>
                          <p className="text-[10px] text-brand-text-muted mt-0.5 uppercase font-bold">{row.especialidade}</p>
                          
                          {/* Smart Tags Rendering (Detalhamento por Marca) */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {row.tags.map((tag: any, idx: number) => (
                              <span key={idx} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-brand font-bold border transition-all ${tag.color}`}>
                                {tag.icon}
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        </Link>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-wrap gap-1.5">
                          {row.marca.map((m: string, idx: number) => (
                            <span key={idx} className={`px-2.5 py-1 rounded-lg text-[10px] font-brand font-bold border transition-all ${
                              row.isAggregated ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-brand-primary/5 text-brand-primary border-brand-primary/20'
                            }`}>
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="font-mono text-sm font-bold text-brand-text">{row.nTotal || '---'}</span>
                      </td>
                      <td className="p-6">
                        <span className="font-mono text-sm font-bold text-brand-primary">{row.minhaMarca || '---'}</span>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-wrap gap-2">
                          {(row.topConcorrentes || []).length > 0 ? (
                            row.topConcorrentes.map((c: any, i: number) => (
                              <span key={i} className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200">
                                {c.nome}: <span className="text-brand-text">{c.quantidade}</span>
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Sem registros</span>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold text-brand-text w-12">
                            {row.marketShare.toFixed(1)}%
                          </span>
                          <div className="flex-1 max-w-[80px] h-2 bg-brand-bg rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${row.marketShare > 30 ? 'bg-green-500' : 'bg-brand-primary'} transition-all duration-1000`}
                              style={{ width: `${row.marketShare}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className={`flex items-center gap-1 font-mono text-xs font-bold ${
                          row.deltaShare > 0.1 ? 'text-green-600' : 
                          row.deltaShare < -0.1 ? 'text-red-600' : 
                          'text-slate-400'
                        }`}>
                          {row.deltaShare > 0.1 ? <TrendingUp size={14} /> : row.deltaShare < -0.1 ? <TrendingDown size={14} /> : <Minus size={14} />}
                          {Math.abs(row.deltaShare).toFixed(1)}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center">
                          <div className="bg-white p-1 rounded-lg border border-brand-border shadow-sm">
                            <Sparkline data={row.sparklineData} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-5 bg-brand-sidebar text-[10px] text-slate-400 font-brand font-bold flex justify-between items-center border-t border-white/5">
              <span className="flex items-center gap-2 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-brand-primary shadow-[0_0_8px_#0047CC]" />
                Visão {filterMarca === 'Todas as Marcas' ? 'Consolidada (Top 3)' : 'Detalhada'} • Trimestre {trimestre}
              </span>
              <span className="uppercase tracking-widest">{tableData.length} registros processados</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
