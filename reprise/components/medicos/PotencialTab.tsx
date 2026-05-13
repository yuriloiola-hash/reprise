'use client';

import { useState, useEffect } from 'react';
import { Plus, Save, TrendingUp, TrendingDown, Minus, AlertTriangle, Target, BarChart2, Hash, Percent } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PotencialTabProps {
  medico: any;
}

// Lista mestre de marcas Sirius por especialidade
const SIRIUS_BRANDS_BY_SPECIALTY: Record<string, string[]> = {
  Neurologia: ['Patz SL', 'Patz Gts', 'Lyberdia Gts', 'Lyberdia Caps', 'Konduz', 'Cymbi'],
  Psiquiatria: ['Patz SL', 'Patz Gts', 'Lyberdia Gts', 'Lyberdia Caps', 'Konduz', 'Cymbi'],
  Cardiologia: ['Brasart', 'Brasart HCT', 'Brasart BCC', 'Vynaxa 20', 'Vynaxa 2,5', 'Patz SL', 'Somalgin Cardio'],
  Reumatologia: ['Condres Longbio', 'Condres Ultra', 'Konduz', 'Cymbi'],
  Ortopedia: ['Condres Longbio', 'Condres Ultra', 'Konduz', 'Cymbi'],
  'Clínico Geral': ['Brasart', 'Patz SL', 'Vynaxa', 'Konduz', 'Cymbi']
};

const TRIMESTRES_PADRAO = ['1T25', '2T25', '3T25', '4T25', '1T26']; // Ordem cronológica

export function PotencialTab({ medico }: PotencialTabProps) {
  const [trimestre, setTrimestre] = useState('1T26');
  const [viewMode, setViewMode] = useState<'N' | '%'>('N');
  
  // Marcas dinâmicas baseadas na especialidade do médico
  const marcasEspecialidade = SIRIUS_BRANDS_BY_SPECIALTY[medico.especialidade] || SIRIUS_BRANDS_BY_SPECIALTY['Neurologia'];

  // Dados de todas as prescrições do médico
  const [todasPrescricoes, setTodasPrescricoes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Estados para o formulário de inserção (um para cada marca da linha)
  const [formStates, setFormStates] = useState<Record<string, { minha: number | '', total: number | '', concorrentes: {nome: string, quantidade: number}[] }>>({});

  useEffect(() => {
    loadPrescricoes();
  }, [medico.id]);

  useEffect(() => {
    // Inicializar formStates com os dados do trimestre selecionado
    const initialStates: Record<string, any> = {};
    marcasEspecialidade.forEach(marca => {
      const p = todasPrescricoes.find(d => d.trimestre === trimestre && d.marca_sirius === marca);
      initialStates[marca] = {
        minha: p?.quantidade_minha_marca ?? '',
        total: p?.quantidade_total ?? '',
        concorrentes: p?.concorrentes ?? []
      };
    });
    setFormStates(initialStates);
  }, [trimestre, todasPrescricoes, marcasEspecialidade]);

  async function loadPrescricoes() {
    const { data } = await supabase
      .from('prescricoes')
      .select('*')
      .eq('medico_id', medico.id)
      .order('trimestre', { ascending: true });

    if (data) setTodasPrescricoes(data);
  }

  const handleInputChange = (marca: string, field: 'minha' | 'total', value: string) => {
    setFormStates(prev => ({
      ...prev,
      [marca]: { ...prev[marca], [field]: value === '' ? '' : Number(value) }
    }));
  };

  const handleConcChange = (marca: string, index: number, field: 'nome' | 'quantidade', value: string) => {
    setFormStates(prev => {
      const newConc = [...prev[marca].concorrentes];
      newConc[index] = { ...newConc[index], [field]: field === 'quantidade' ? (value === '' ? 0 : Number(value)) : value };
      return { ...prev, [marca]: { ...prev[marca], concorrentes: newConc } };
    });
  };

  const addConc = (marca: string) => {
    setFormStates(prev => ({
      ...prev,
      [marca]: { ...prev[marca], concorrentes: [...prev[marca].concorrentes, { nome: '', quantidade: 0 }] }
    }));
  };

  const removeConc = (marca: string, index: number) => {
    setFormStates(prev => ({
      ...prev,
      [marca]: { ...prev[marca], concorrentes: prev[marca].concorrentes.filter((_, i) => i !== index) }
    }));
  };

  const handleSaveBulk = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const repId = user ? user.id : null;

    const payloads = Object.entries(formStates).map(([marca, state]) => ({
      ...(repId ? { rep_id: repId } : {}),
      medico_id: medico.id,
      trimestre,
      marca_sirius: marca,
      quantidade_total: Number(state.total) || 0,
      quantidade_minha_marca: Number(state.minha) || 0,
      concorrentes: state.concorrentes.filter(c => c.nome && c.quantidade > 0)
    }));

    const { error } = await supabase
      .from('prescricoes')
      .upsert(payloads, { onConflict: 'medico_id, trimestre, marca_sirius' });

    if (!error) {
      alert('Dados salvos com sucesso para todas as marcas!');
      await loadPrescricoes();
    } else {
      alert('Erro ao salvar: ' + error.message);
    }
    setSaving(false);
  };

  // --- Processamento BI ---
  
  // Gráfico: 3 Linhas (Total, Sirius, Concorrentes)
  const chartData = TRIMESTRES_PADRAO.map(t => {
    const pData = todasPrescricoes.filter(p => p.trimestre === t);
    let totalMercado = 0;
    let siriusTotal = 0;
    let concTotal = 0;

    pData.forEach(p => {
      totalMercado += p.quantidade_total;
      siriusTotal += p.quantidade_minha_marca;
      p.concorrentes?.forEach((c: any) => { concTotal += c.quantidade; });
    });

    return { name: t, Total: totalMercado, Sirius: siriusTotal, Concorrentes: concTotal };
  });

  // Decomposição Sequencial (1T26 vs 4T25)
  const lastQ = '1T26';
  const prevQ = '4T25';

  const decompositionData = marcasEspecialidade.map(marca => {
    const lastP = todasPrescricoes.find(p => p.trimestre === lastQ && p.marca_sirius === marca);
    const prevP = todasPrescricoes.find(p => p.trimestre === prevQ && p.marca_sirius === marca);

    const lMinha = lastP?.quantidade_minha_marca ?? 0;
    const lTotal = lastP?.quantidade_total ?? 0;
    const lShare = lTotal > 0 ? (lMinha / lTotal) * 100 : 0;

    const pMinha = prevP?.quantidade_minha_marca ?? 0;
    const pTotal = prevP?.quantidade_total ?? 0;
    const pShare = pTotal > 0 ? (pMinha / pTotal) * 100 : 0;

    // Variação Delta (Δ%) do Share
    const deltaShare = lShare - pShare;
    // Variação Percentual do Volume Sirius
    const deltaVolume = pMinha > 0 ? ((lMinha - pMinha) / pMinha) * 100 : (lMinha > 0 ? 100 : 0);

    return { marca, lMinha, lTotal, lShare, deltaShare, deltaVolume };
  });

  return (
    <div className="space-y-8 pt-4 animate-in fade-in duration-300 pb-20">
      
      {/* Header com Toggle N/% */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-[16px] border border-brand-border shadow-sm">
        <h2 className="font-display font-bold text-xl text-brand-text flex items-center gap-2">
          <TrendingUp className="text-brand-primary" size={24} />
          Inteligência de Mercado Sirius
        </h2>
        
        <div className="flex bg-brand-bg rounded-lg p-1">
          <button 
            onClick={() => setViewMode('N')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-sans font-bold transition-all ${
              viewMode === 'N' ? 'bg-white text-brand-primary shadow-sm' : 'bg-transparent text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <Hash size={14} /> N Bruto
          </button>
          <button 
            onClick={() => setViewMode('%')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-sans font-bold transition-all ${
              viewMode === '%' ? 'bg-white text-brand-primary shadow-sm' : 'bg-transparent text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <Percent size={14} /> Share %
          </button>
        </div>
      </div>

      {/* Gráfico de Tendência (5 Trimestres) */}
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-brand-border">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-display font-semibold text-lg text-brand-text">Tendência de Mercado</h3>
            <p className="text-xs text-brand-text-muted font-sans uppercase tracking-wider mt-1">Consolidado Linha {medico.especialidade}</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-primary" />
              <span className="text-[10px] font-bold text-brand-text-muted uppercase">Sirius</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-[10px] font-bold text-brand-text-muted uppercase">Conc.</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-slate-300 border-t border-dashed border-slate-500" />
              <span className="text-[10px] font-bold text-brand-text-muted uppercase">Total</span>
            </div>
          </div>
        </div>
        
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSirius" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0047CC" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0047CC" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 600 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #D6E3F0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 700, padding: '2px 0' }}
              />
              
              <Area type="monotone" dataKey="Total" stroke="#94A3B8" strokeWidth={1} strokeDasharray="5 5" fill="none" />
              <Area type="monotone" dataKey="Concorrentes" stroke="#64748B" strokeWidth={2} fill="#F1F5F9" fillOpacity={0.5} />
              <Area type="monotone" dataKey="Sirius" stroke="#0047CC" strokeWidth={3} fill="url(#colorSirius)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Decomposição por Marca com Comparação Sequencial */}
      <div className="bg-white p-6 rounded-[24px] shadow-sm border border-brand-border">
        <h3 className="font-display font-semibold text-lg text-brand-text mb-6 flex justify-between items-center">
          Decomposição do Portfólio ({lastQ})
          <span className="text-xs font-sans font-medium text-brand-text-muted">vs Trimestre Anterior ({prevQ})</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decompositionData.map(item => (
            <div key={item.marca} className="p-4 rounded-2xl bg-brand-bg/50 border border-brand-border hover:border-brand-primary/30 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-display font-bold text-brand-text group-hover:text-brand-primary transition-colors">{item.marca}</h4>
                  <p className="text-[10px] text-brand-text-muted font-sans uppercase font-bold">Sirius {medico.especialidade}</p>
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${
                  item.deltaShare > 0.1 ? 'bg-green-100 text-green-700' : 
                  item.deltaShare < -0.1 ? 'bg-red-100 text-red-700' : 
                  'bg-slate-100 text-slate-500'
                }`}>
                  {item.deltaShare > 0.1 ? <TrendingUp size={12} /> : item.deltaShare < -0.1 ? <TrendingDown size={12} /> : <Minus size={12} />}
                  {Math.abs(item.deltaShare).toFixed(1)}pp
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div className="text-2xl font-mono font-bold text-brand-text">
                    {viewMode === 'N' ? item.lMinha : `${item.lShare.toFixed(1)}%`}
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold text-brand-text-muted uppercase">N Categoria</p>
                    <p className="text-sm font-mono font-bold text-brand-text">{item.lTotal}</p>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-brand-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-primary transition-all duration-700" 
                    style={{ width: `${item.lShare}%` }} 
                  />
                </div>
                
                <div className="flex justify-between items-center text-[10px] font-sans font-bold uppercase tracking-tight">
                  <span className="text-brand-text-muted">Crescimento Vol:</span>
                  <span className={item.deltaVolume > 0.1 ? 'text-green-600' : item.deltaVolume < -0.1 ? 'text-red-600' : 'text-slate-400'}>
                    {item.deltaVolume > 0.1 ? '+' : ''}{item.deltaVolume.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulário de Inserção Completo */}
      <div className="bg-brand-sidebar p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h3 className="font-display font-bold text-2xl">Inserção de Dados Trimestrais</h3>
              <p className="text-slate-400 font-sans text-sm mt-1 italic">Preencha o desempenho de todas as marcas da linha {medico.especialidade}.</p>
            </div>
            
            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
              <span className="text-xs font-bold text-slate-400 uppercase ml-2">Trimestre:</span>
              <select 
                value={trimestre} 
                onChange={(e) => setTrimestre(e.target.value)}
                className="bg-transparent border-none text-white font-display font-bold outline-none cursor-pointer"
              >
                {[...TRIMESTRES_PADRAO].reverse().map(t => <option key={t} value={t} className="text-black">{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {marcasEspecialidade.map(marca => (
              <div key={marca} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                  <div className="lg:col-span-1">
                    <h4 className="font-display font-bold text-lg text-brand-secondary">{marca}</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Input de BI Sirius</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 lg:col-span-1">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Minha Marca (N)</label>
                      <input 
                        type="number" value={formStates[marca]?.minha ?? ''} 
                        onChange={(e) => handleInputChange(marca, 'minha', e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white font-mono font-bold outline-none focus:border-brand-primary transition-all"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">N Total Cat.</label>
                      <input 
                        type="number" value={formStates[marca]?.total ?? ''} 
                        onChange={(e) => handleInputChange(marca, 'total', e.target.value)}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white font-mono font-bold outline-none focus:border-brand-primary transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Concorrentes Nominais</label>
                      <button onClick={() => addConc(marca)} className="text-[10px] font-bold text-brand-secondary flex items-center gap-1 hover:underline">
                        <Plus size={12} /> Adicionar
                      </button>
                    </div>
                    
                    <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar pr-2">
                      {formStates[marca]?.concorrentes.map((conc, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input 
                            type="text" value={conc.nome} 
                            onChange={(e) => handleConcChange(marca, idx, 'nome', e.target.value)}
                            className="flex-1 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-brand-secondary"
                            placeholder="Marca Concorrente..."
                          />
                          <input 
                            type="number" value={conc.quantidade || ''} 
                            onChange={(e) => handleConcChange(marca, idx, 'quantidade', e.target.value)}
                            className="w-20 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-brand-secondary"
                            placeholder="N"
                          />
                          <button onClick={() => removeConc(marca, idx)} className="text-red-400 hover:text-red-300 px-1">×</button>
                        </div>
                      ))}
                      {(!formStates[marca]?.concorrentes || formStates[marca]?.concorrentes.length === 0) && (
                        <p className="text-[11px] text-slate-600 italic">Nenhum concorrente listado.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col md:flex-row gap-4 items-center justify-between border-t border-white/10 pt-8">
            <div className="text-slate-400 font-sans text-xs flex items-center gap-2">
              <AlertTriangle size={14} className="text-brand-secondary" />
              Os dados salvos serão sincronizados com o Market Share global de Sobral.
            </div>
            <button 
              onClick={handleSaveBulk}
              disabled={saving}
              className="w-full md:w-auto px-10 py-4 bg-brand-primary hover:bg-blue-600 text-white font-sans font-bold rounded-2xl shadow-xl shadow-blue-900/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Save size={20} />
              {saving ? 'Sincronizando...' : 'Sincronizar Inteligência Sirius'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
