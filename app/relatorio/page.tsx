'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Plus, Trash2, Send, Printer, 
  CheckCircle, XCircle, AlertCircle, ChevronDown, 
  ChevronUp, X, Save, Loader2, Check, RefreshCcw
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Movimentacao {
  id: string;
  tipo: 'adicao' | 'exclusao';
  data_movimentacao: string;
  nome_medico: string;
  especialidade: string;
  cidade: string;
  motivo: string;
  status_gd: 'aprovado' | 'negado' | 'pendente';
  obs_gd: string;
  isLocal?: boolean; // Se é uma linha ainda não salva no banco
  isDirty?: boolean; // Se foi editada e precisa sincronizar
}

const ESPECIALIDADES = [
  'Cardiologia',
  'Psiquiatria',
  'Endocrinologia',
  'Ginecologia',
  'Neurologia',
  'Clínica Médica',
  'Dermatologia',
  'Ortopedia',
  'Outra',
];

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const MOTIVOS_ADICAO = [
  'Novo médico na praça',
  'Mudança de especialidade',
  'Potencial identificado em campo',
  'Indicação da gestão',
  'Retorno após inatividade',
  'Outro',
];

const MOTIVOS_EXCLUSAO = [
  'Médico não atende representantes',
  'Aposentadoria / Saída da área',
  'Baixo potencial de prescrição',
  'Mudança de cidade',
  'Decisão da gestão',
  'Outro',
];

export default function RelatorioMovimentacaoPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Modal "Outro motivo"
  const [outroModal, setOutroModal] = useState<{ id: string; textoAtual: string } | null>(null);
  const [outroTexto, setOutroTexto] = useState('');

  const mesAtual = hoje.getMonth() === mes && hoje.getFullYear() === ano;
  const mesLabel = `${MESES[mes]} / ${ano}`;

  const adicoes = movimentacoes.filter(m => m.tipo === 'adicao');
  const exclusoes = movimentacoes.filter(m => m.tipo === 'exclusao');

  // 1. Carregar dados do Supabase
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        let query = supabase
          .from('movimentacoes_painel')
          .select('*')
          .eq('mes', mes)
          .eq('ano', ano);
        
        if (user) {
          query = query.eq('rep_id', user.id);
        } else {
          query = query.is('rep_id', null);
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) throw error;
        setMovimentacoes(data || []);
      } catch (err: any) {
        console.error('Erro ao carregar:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [mes, ano]);

  // 2. Salvar/Confirmar uma linha específica
  const saveRow = async (row: Movimentacao) => {
    setProcessingId(row.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const repId = user ? user.id : null;

      const payload: any = {
        rep_id: repId,
        tipo: row.tipo,
        nome_medico: row.nome_medico,
        especialidade: row.especialidade,
        cidade: row.cidade,
        motivo: row.motivo,
        status_gd: row.status_gd,
        obs_gd: row.obs_gd,
        mes,
        ano,
        data_movimentacao: row.data_movimentacao,
        updated_at: new Date().toISOString(),
      };

      if (row.isLocal) {
        const { data, error } = await supabase
          .from('movimentacoes_painel')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setMovimentacoes(prev => prev.map(m => m.id === row.id ? { ...data, isLocal: false, isDirty: false } : m));
      } else {
        const { error } = await supabase
          .from('movimentacoes_painel')
          .update(payload)
          .eq('id', row.id);

        if (error) throw error;
        setMovimentacoes(prev => prev.map(m => m.id === row.id ? { ...m, isDirty: false } : m));
      }
    } catch (err: any) {
      alert('Erro ao salvar linha: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const addMovimentacao = (tipo: 'adicao' | 'exclusao') => {
    if (!mesAtual) return;
    const tempId = `temp-${Date.now()}`;
    const novo: Movimentacao = {
      id: tempId,
      tipo,
      data_movimentacao: new Date().toISOString().split('T')[0],
      nome_medico: '',
      especialidade: ESPECIALIDADES[0],
      cidade: 'Sobral',
      motivo: tipo === 'adicao' ? MOTIVOS_ADICAO[0] : MOTIVOS_EXCLUSAO[0],
      status_gd: 'pendente',
      obs_gd: '',
      isLocal: true,
      isDirty: true
    };
    setMovimentacoes(prev => [...prev, novo]);
  };

  const updateMov = (id: string, field: string, value: any) => {
    if (field === 'motivo' && value === 'Outro') {
      const atual = movimentacoes.find(m => m.id === id);
      const textoAtual = isCustomMotivo(atual?.motivo || '') ? (atual?.motivo || '') : '';
      setOutroTexto(textoAtual);
      setOutroModal({ id, textoAtual });
      return;
    }
    setMovimentacoes(prev => prev.map(m => m.id === id ? { ...m, [field]: value, isDirty: true } : m));
  };

  const confirmOutro = () => {
    if (!outroModal || !outroTexto.trim()) return;
    setMovimentacoes(prev => prev.map(m =>
      m.id === outroModal.id ? { ...m, motivo: outroTexto.trim(), isDirty: true } : m
    ));
    setOutroModal(null);
    setOutroTexto('');
  };

  const removeMov = async (id: string, isLocal?: boolean) => {
    if (!mesAtual) return;
    if (!confirm('Deseja excluir esta movimentação?')) return;

    if (isLocal) {
      setMovimentacoes(prev => prev.filter(m => m.id !== id));
      return;
    }

    setProcessingId(id);
    try {
      const { error } = await supabase.from('movimentacoes_painel').delete().eq('id', id);
      if (error) throw error;
      setMovimentacoes(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handlePrint = () => window.print();

  const handleWhatsApp = () => {
    const aprovadas = movimentacoes.filter(m => m.status_gd === 'aprovado').length;
    const msg = encodeURIComponent(
      `📋 *Movimentação de Painel — REPrise*\n` +
      `📅 Período: ${mesLabel}\n` +
      `➕ Adições: ${adicoes.length} | ➖ Exclusões: ${exclusoes.length}\n` +
      `✅ Aprovadas: ${aprovadas}`
    );
    window.open(`https://wa.me/5588999999999?text=${msg}`, '_blank');
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-area, #print-area * { visibility: visible !important; }
          #print-area { position: fixed; top: 0; left: 0; width: 100%; padding: 20px; background: white; }
          .no-print { display: none !important; }
        }
      `}</style>

      {outroModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-brand font-bold text-brand-text">Especifique o Motivo</h3>
              <button onClick={() => setOutroModal(null)} className="text-slate-400"><X size={18} /></button>
            </div>
            <textarea
              autoFocus
              value={outroTexto}
              onChange={e => setOutroTexto(e.target.value)}
              placeholder="Descreva o motivo..."
              rows={3}
              className="w-full px-4 py-3 text-sm border border-brand-border rounded-xl outline-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setOutroModal(null)} className="flex-1 px-4 py-2 border rounded-xl text-sm font-bold text-brand-text-muted">Cancelar</button>
              <button onClick={confirmOutro} disabled={!outroTexto.trim()} className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-bold">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-brand-bg min-h-screen pb-32">
        <div className="max-w-6xl mx-auto p-4 md:p-10">

          <header className="mb-8 no-print flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-brand-primary text-[10px] font-brand font-bold uppercase tracking-widest mb-1">
                <FileText size={12} /> Relatório de Movimentação
              </div>
              <h1 className="text-2xl font-brand font-extrabold text-brand-text tracking-tight">Painel Sirius EMS</h1>
            </div>

            <div className="flex items-center gap-2 bg-white border border-brand-border rounded-xl px-4 py-2 shadow-sm">
              <button onClick={() => { const d = new Date(ano, mes - 1); setMes(d.getMonth()); setAno(d.getFullYear()); }} className="p-1 hover:bg-brand-bg rounded-full transition-colors"><ChevronDown size={18} /></button>
              <span className="text-sm font-brand font-bold text-brand-text min-w-[120px] text-center">{mesLabel}</span>
              <button onClick={() => { const d = new Date(ano, mes + 1); setMes(d.getMonth()); setAno(d.getFullYear()); }} className="p-1 hover:bg-brand-bg rounded-full transition-colors"><ChevronUp size={18} /></button>
            </div>
          </header>

          <div id="print-area">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-brand-border">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin mb-2" />
                <p className="text-xs text-brand-text-muted">Sincronizando dados...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* ADIÇÕES */}
                <section>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-xs font-brand font-extrabold uppercase tracking-widest text-emerald-700 flex items-center gap-2">
                      <Plus size={14} className="bg-emerald-100 p-0.5 rounded" /> Adições ({adicoes.length})
                    </h2>
                    {mesAtual && (
                      <button onClick={() => addMovimentacao('adicao')} className="no-print text-[10px] font-brand font-bold text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 transition-all flex items-center gap-1">
                        <Plus size={12} /> Adicionar Médico
                      </button>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-emerald-50/50 text-[10px] uppercase font-brand font-extrabold text-emerald-700 tracking-widest border-b border-brand-border">
                          <th className="px-4 py-3 w-20">Data</th>
                          <th className="px-4 py-3">Nome do Médico</th>
                          <th className="px-4 py-3 w-32">Especialidade</th>
                          <th className="px-4 py-3 w-28">Cidade</th>
                          <th className="px-4 py-3">Motivo da Alteração</th>
                          <th className="px-4 py-3 w-32">Status GD</th>
                          <th className="px-4 py-3 w-16 no-print text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {adicoes.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-brand-text-muted italic">Nenhuma adição registrada.</td></tr>
                        ) : (
                          adicoes.map(m => renderRow(m, MOTIVOS_ADICAO, !mesAtual, updateMov, saveRow, removeMov, processingId))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* EXCLUSÕES */}
                <section>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-xs font-brand font-extrabold uppercase tracking-widest text-red-600 flex items-center gap-2">
                      <X size={14} className="bg-red-100 p-0.5 rounded" /> Exclusões ({exclusoes.length})
                    </h2>
                    {mesAtual && (
                      <button onClick={() => addMovimentacao('exclusao')} className="no-print text-[10px] font-brand font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-all flex items-center gap-1">
                        <Plus size={12} /> Adicionar Médico
                      </button>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-red-50/50 text-[10px] uppercase font-brand font-extrabold text-red-600 tracking-widest border-b border-brand-border">
                          <th className="px-4 py-3 w-20">Data</th>
                          <th className="px-4 py-3">Nome do Médico</th>
                          <th className="px-4 py-3 w-32">Especialidade</th>
                          <th className="px-4 py-3 w-28">Cidade</th>
                          <th className="px-4 py-3">Motivo da Alteração</th>
                          <th className="px-4 py-3 w-32">Status GD</th>
                          <th className="px-4 py-3 w-16 no-print text-center">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-border">
                        {exclusoes.length === 0 ? (
                          <tr><td colSpan={7} className="px-4 py-10 text-center text-xs text-brand-text-muted italic">Nenhuma exclusão registrada.</td></tr>
                        ) : (
                          exclusoes.map(m => renderRow(m, MOTIVOS_EXCLUSAO, !mesAtual, updateMov, saveRow, removeMov, processingId))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}
          </div>

          {/* Action Bar */}
          {!loading && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 no-print">
              <div className="flex items-center gap-3 bg-brand-sidebar px-6 py-3.5 rounded-2xl shadow-2xl border border-white/10">
                <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-brand font-bold rounded-xl transition-all"><Printer size={14} /> PDF</button>
                <button onClick={handleWhatsApp} className="flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20be5b] text-white text-xs font-brand font-bold rounded-xl transition-all shadow-lg"><Send size={14} /> WhatsApp</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function isCustomMotivo(motivo: string): boolean {
  const todos = [...MOTIVOS_ADICAO, ...MOTIVOS_EXCLUSAO];
  return motivo !== '' && !todos.includes(motivo);
}

function renderRow(
  m: Movimentacao, 
  motivos: string[], 
  readOnly: boolean,
  update: (id: string, field: string, val: any) => void,
  save: (m: Movimentacao) => void,
  remove: (id: string, isLocal?: boolean) => void,
  processingId: string | null
) {
  const isCustom = isCustomMotivo(m.motivo);
  const isProcessing = processingId === m.id;

  return (
    <tr key={m.id} className={`group hover:bg-brand-bg/20 transition-colors ${m.isDirty ? 'bg-amber-50/30' : ''}`}>
      <td className="px-4 py-3">
        <span className="text-[11px] font-mono text-brand-text-muted">
          {m.data_movimentacao ? `${m.data_movimentacao.split('-')[2]}/${m.data_movimentacao.split('-')[1]}` : '—'}
        </span>
      </td>
      <td className="px-4 py-3">
        <input 
          disabled={readOnly || isProcessing}
          type="text" value={m.nome_medico} 
          onChange={e => update(m.id, 'nome_medico', e.target.value)}
          placeholder="Dr. Nome..."
          className="w-full text-xs font-sans font-semibold bg-transparent outline-none focus:text-brand-primary placeholder:text-slate-300 text-brand-text"
        />
      </td>
      <td className="px-4 py-3">
        <select 
          disabled={readOnly || isProcessing}
          value={m.especialidade} 
          onChange={e => update(m.id, 'especialidade', e.target.value)}
          className="text-xs font-sans font-semibold bg-transparent outline-none cursor-pointer text-brand-text w-full"
        >
          {ESPECIALIDADES.map(esp => <option key={esp} value={esp}>{esp}</option>)}
        </select>
      </td>
      <td className="px-4 py-3">
        <input 
          disabled={readOnly || isProcessing}
          type="text" value={m.cidade} 
          onChange={e => update(m.id, 'cidade', e.target.value)}
          className="w-full text-[11px] font-sans bg-transparent outline-none text-brand-text-muted"
        />
      </td>
      <td className="px-4 py-3">
        {isCustom ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans italic text-brand-text">{m.motivo}</span>
            <button onClick={() => update(m.id, 'motivo', 'Outro')} className="text-[9px] text-brand-primary underline no-print">editar</button>
          </div>
        ) : (
          <select 
            disabled={readOnly || isProcessing}
            value={m.motivo} 
            onChange={e => update(m.id, 'motivo', e.target.value)}
            className="text-[11px] font-sans bg-transparent outline-none cursor-pointer text-brand-text w-full"
          >
            {motivos.map(mo => <option key={mo} value={mo}>{mo}</option>)}
          </select>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex gap-1">
          <button 
            disabled={readOnly || isProcessing}
            onClick={() => update(m.id, 'status_gd', m.status_gd === 'aprovado' ? 'pendente' : 'aprovado')}
            className={`px-1.5 py-0.5 rounded text-[9px] font-brand font-extrabold border transition-all ${
              m.status_gd === 'aprovado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}
          >
            SIM
          </button>
          <button 
            disabled={readOnly || isProcessing}
            onClick={() => update(m.id, 'status_gd', m.status_gd === 'negado' ? 'pendente' : 'negado')}
            className={`px-1.5 py-0.5 rounded text-[9px] font-brand font-extrabold border transition-all ${
              m.status_gd === 'negado' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}
          >
            NÃO
          </button>
        </div>
      </td>
      <td className="px-4 py-3 no-print text-center">
        <div className="flex items-center justify-center gap-2">
          {!readOnly && (m.isLocal || m.isDirty) && (
            <button 
              onClick={() => save(m)}
              disabled={isProcessing}
              className={`p-1.5 rounded-lg shadow-sm transition-all ${
                m.isLocal ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-brand-primary text-white hover:bg-blue-700'
              }`}
              title={m.isLocal ? "Confirmar Entrada" : "Sincronizar Alterações"}
            >
              {isProcessing ? <Loader2 size={12} className="animate-spin" /> : m.isLocal ? <Check size={12} /> : <RefreshCcw size={12} />}
            </button>
          )}
          {!readOnly && (
            <button 
              onClick={() => remove(m.id, m.isLocal)} 
              disabled={isProcessing}
              className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
