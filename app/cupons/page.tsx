'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Ticket, Plus, Search, Filter, 
  CheckCircle2, Clock, Smartphone, 
  Handshake, Download, Loader2,
  Check, X, FileText, ClipboardList
} from 'lucide-react';
import { Database } from '@/lib/database.types';

type Cupom = Database['public']['Tables']['cupons']['Row'] & {
  medicos: { nome: string } | null;
};

export default function CuponsPage() {
  const router = useRouter();
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'prometido' | 'entregue'>('todos');
  const [tipoFilter, setTipoFilter] = useState<'todos' | 'cupom' | 'demanda'>('todos');

  // Stats
  const pendentes = cupons.filter(c => c.status_entrega === 'prometido').length;
  const entreguesMes = cupons.filter(c => {
    if (c.status_entrega !== 'entregue' || !c.updated_at) return false;
    const date = new Date(c.updated_at);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  useEffect(() => {
    fetchCupons();
  }, []);

  async function fetchCupons() {
    setLoading(true);
    const { data, error } = await supabase
      .from('cupons')
      .select('*, medicos(nome)')
      .order('created_at', { ascending: false });

    if (data) setCupons(data as any);
    setLoading(false);
  }

  const toggleStatus = async (cupom: Cupom) => {
    const newStatus = cupom.status_entrega === 'prometido' ? 'entregue' : 'prometido';
    const { error } = await supabase
      .from('cupons')
      .update({ 
        status_entrega: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', cupom.id);

    if (!error) {
      setCupons(prev => prev.map(c => 
        c.id === cupom.id ? { ...c, status_entrega: newStatus } : c
      ));
    }
  };

  const exportCSV = () => {
    const headers = ['Tipo', 'Registro', 'Médico', 'Status', 'Tipo Envio', 'Data Prometida'];
    const rows = cupons.map(c => [
      c.tipo,
      c.tipo === 'cupom' ? c.codigo : c.descricao,
      c.medicos?.nome || 'Não informado',
      c.status_entrega,
      c.tipo_envio,
      c.data_prometida
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `logistica_sirius_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCupons = cupons.filter(c => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      (c.codigo || '').includes(search) || 
      (c.descricao || '').toLowerCase().includes(searchLower) || 
      (c.medicos?.nome || '').toLowerCase().includes(searchLower);
    
    const matchesStatus = statusFilter === 'todos' || c.status_entrega === statusFilter;
    const matchesTipo = tipoFilter === 'todos' || c.tipo === tipoFilter;
    
    return matchesSearch && matchesStatus && matchesTipo;
  });

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="p-8 md:p-12 max-w-[1550px] mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-brand-primary font-brand font-bold text-xs uppercase tracking-[0.2em]">
              <ClipboardList size={16} />
              Logística Sirius
            </div>
            <h1 className="text-4xl font-brand font-bold text-brand-text tracking-tighter">Cupons & Demandas</h1>
            <p className="text-lg text-brand-text-muted font-sans font-medium">Controle de Patz e solicitações médicas.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => router.push('/cupons/gerador')}
              className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-[14px] font-brand font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Ticket size={16} />
              GERADOR DINÂMICO
            </button>
            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-6 py-3.5 bg-white text-brand-text-muted border border-brand-border rounded-[14px] font-brand font-bold text-xs hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download size={16} />
              EXPORTAR CSV
            </button>
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-6 py-3.5 bg-brand-primary text-white rounded-[14px] font-brand font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <Plus size={16} />
              NOVO REGISTRO
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <Clock size={28} />
            </div>
            <div>
              <p className="text-sm font-sans font-bold text-brand-text-muted uppercase tracking-wider">Pendências Totais</p>
              <h2 className="text-3xl font-brand font-bold text-brand-text">{pendentes}</h2>
            </div>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <p className="text-sm font-sans font-bold text-brand-text-muted uppercase tracking-wider">Entregues no Mês</p>
              <h2 className="text-3xl font-brand font-bold text-brand-text">{entreguesMes}</h2>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm mb-8 space-y-6">
          <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center">
            <div className="flex flex-wrap gap-4">
              <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-border">
                <button 
                  onClick={() => setStatusFilter('todos')}
                  className={`px-4 py-2 rounded-lg text-xs font-brand font-bold transition-all ${statusFilter === 'todos' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
                >
                  Status: Todos
                </button>
                <button 
                  onClick={() => setStatusFilter('prometido')}
                  className={`px-4 py-2 rounded-lg text-xs font-brand font-bold transition-all ${statusFilter === 'prometido' ? 'bg-white text-amber-600 shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
                >
                  Prometidos
                </button>
                <button 
                  onClick={() => setStatusFilter('entregue')}
                  className={`px-4 py-2 rounded-lg text-xs font-brand font-bold transition-all ${statusFilter === 'entregue' ? 'bg-white text-emerald-600 shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
                >
                  Entregues
                </button>
              </div>

              <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-border">
                <button 
                  onClick={() => setTipoFilter('todos')}
                  className={`px-4 py-2 rounded-lg text-xs font-brand font-bold transition-all ${tipoFilter === 'todos' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
                >
                  Tipo: Todos
                </button>
                <button 
                  onClick={() => setTipoFilter('cupom')}
                  className={`px-4 py-2 rounded-lg text-xs font-brand font-bold transition-all ${tipoFilter === 'cupom' ? 'bg-white text-blue-600 shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
                >
                  Cupons
                </button>
                <button 
                  onClick={() => setTipoFilter('demanda')}
                  className={`px-4 py-2 rounded-lg text-xs font-brand font-bold transition-all ${tipoFilter === 'demanda' ? 'bg-white text-purple-600 shadow-sm' : 'text-brand-text-muted hover:text-brand-text'}`}
                >
                  Demandas
                </button>
              </div>
            </div>

            <div className="flex-1 w-full relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por código, demanda ou médico..." 
                className="w-full pl-11 pr-4 py-2.5 bg-brand-bg/50 border border-brand-border rounded-xl text-xs font-sans outline-none focus:ring-2 focus:ring-brand-primary/20 focus:bg-white transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table/List */}
        {loading ? (
          <div className="text-center py-24 font-brand font-bold text-brand-text-muted animate-pulse uppercase tracking-[0.3em] text-sm">
            Sincronizando Logística Sirius...
          </div>
        ) : filteredCupons.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[32px] border border-dashed border-brand-border">
            <p className="text-brand-text-muted font-sans font-medium">Nenhum registro encontrado.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[24px] border border-brand-border shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-brand-border text-[10px] uppercase font-brand font-bold text-brand-text-muted tracking-widest">
                    <th className="p-6">Tipo</th>
                    <th className="p-6">Registro / Descrição</th>
                    <th className="p-6">Médico</th>
                    <th className="p-6">Logística</th>
                    <th className="p-6">Status</th>
                    <th className="p-6 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border">
                  {filteredCupons.map((item) => (
                    <tr key={item.id} className="hover:bg-brand-bg/30 transition-colors group">
                      <td className="p-6">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.tipo === 'cupom' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                        }`}>
                          {item.tipo === 'cupom' ? <Ticket size={18} /> : <FileText size={18} />}
                        </div>
                      </td>
                      <td className="p-6 max-w-xs">
                        {item.tipo === 'cupom' ? (
                          <div className="space-y-1">
                            <span className="font-mono text-sm font-bold text-brand-text tracking-tight">{item.codigo}</span>
                            <p className="text-[10px] font-brand font-bold text-blue-600 uppercase">{item.produto}</p>
                          </div>
                        ) : (
                          <p className="font-sans text-sm font-bold text-brand-text leading-tight">{item.descricao}</p>
                        )}
                      </td>
                      <td className="p-6">
                        <p className="font-brand font-bold text-brand-text">{item.medicos?.nome || '—'}</p>
                      </td>
                      <td className="p-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-brand-text-muted text-xs font-medium">
                            {item.tipo_envio === 'presencial' ? (
                              <><Handshake size={14} className="text-amber-500" /> Presencial</>
                            ) : (
                              <><Smartphone size={14} className="text-blue-500" /> Virtual</>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-brand-text-muted">
                            {item.data_prometida ? new Date(item.data_prometida + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem prazo'}
                          </p>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          item.status_entrega === 'entregue' 
                            ? 'bg-emerald-50 text-emerald-700' 
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${item.status_entrega === 'entregue' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {item.status_entrega}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <button 
                          onClick={() => toggleStatus(item)}
                          className={`p-2 rounded-xl border transition-all ${
                            item.status_entrega === 'entregue'
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100'
                              : 'bg-white border-brand-border text-brand-text-muted hover:border-emerald-600 hover:text-emerald-600'
                          }`}
                        >
                          {item.status_entrega === 'entregue' ? <Check size={16} /> : <Plus size={16} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddForm && (
        <AddCupomModal 
          onClose={() => setShowAddForm(false)} 
          onSuccess={() => {
            setShowAddForm(false);
            fetchCupons();
          }} 
        />
      )}
    </div>
  );
}

function AddCupomModal({ onClose, onSuccess }: { onClose: (val: boolean) => void, onSuccess: () => void }) {
  const [medicos, setMedicos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tipo, setTipo] = useState<'cupom' | 'demanda'>('cupom');
  const [formData, setFormData] = useState({
    medico_id: '',
    codigo: '',
    descricao: '',
    produto: 'Patz Cp',
    tipo_envio: 'presencial' as 'presencial' | 'virtual',
    data_prometida: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    async function loadMedicos() {
      const { data } = await supabase.from('medicos').select('id, nome').order('nome');
      if (data) setMedicos(data);
    }
    loadMedicos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.medico_id) return alert('Selecione um médico.');
    if (tipo === 'cupom' && !formData.codigo) return alert('Insira o código do cupom.');
    if (tipo === 'demanda' && !formData.descricao) return alert('Insira a descrição da demanda.');

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase.from('cupons').insert({
      tipo,
      medico_id: formData.medico_id,
      codigo: tipo === 'cupom' ? formData.codigo : null,
      descricao: tipo === 'demanda' ? formData.descricao : null,
      produto: formData.produto,
      tipo_envio: formData.tipo_envio,
      data_prometida: formData.data_prometida,
      rep_id: user?.id,
      status_entrega: 'prometido'
    });

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-8 border-b border-brand-border flex justify-between items-center bg-brand-bg/50">
          <div>
            <h2 className="text-2xl font-brand font-bold text-brand-text">Novo Registro</h2>
            <p className="text-xs text-brand-text-muted font-sans font-bold uppercase tracking-wider">Logística & Demandas Sirius</p>
          </div>
          <button onClick={() => onClose(false)} className="p-2 hover:bg-brand-border rounded-xl transition-colors">
            <X size={20} className="text-brand-text-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-border">
            <button 
              type="button"
              onClick={() => setTipo('cupom')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-brand font-bold transition-all ${tipo === 'cupom' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-text-muted'}`}
            >
              <Ticket size={14} /> Cupom
            </button>
            <button 
              type="button"
              onClick={() => setTipo('demanda')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-brand font-bold transition-all ${tipo === 'demanda' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-text-muted'}`}
            >
              <FileText size={14} /> Demanda
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest px-1">Médico Vinculado</label>
            <select 
              className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-xl text-sm font-sans font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
              value={formData.medico_id}
              onChange={e => setFormData(prev => ({ ...prev, medico_id: e.target.value }))}
            >
              <option value="">Selecione o médico...</option>
              {medicos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {tipo === 'cupom' ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest px-1">Código</label>
                  <input 
                    type="text"
                    placeholder="0000000000"
                    className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                    value={formData.codigo}
                    onChange={e => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest px-1">Produto</label>
                  <select 
                    className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-xl text-sm font-sans font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                    value={formData.produto}
                    onChange={e => setFormData(prev => ({ ...prev, produto: e.target.value }))}
                  >
                    <option value="Patz Cp">Patz Cp</option>
                    <option value="Patz Gts">Patz Gts</option>
                    <option value="Cymbi">Cymbi</option>
                    <option value="Lyberdia">Lyberdia</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest px-1">O que foi solicitado?</label>
                <textarea 
                  placeholder="Ex: Preço do Cymbi, Amostra de Lyberdia..."
                  rows={3}
                  className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-xl text-sm font-sans font-medium outline-none focus:ring-2 focus:ring-brand-primary/20"
                  value={formData.descricao}
                  onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest px-1">Logística</label>
              <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-border">
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo_envio: 'presencial' }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-brand font-bold transition-all ${formData.tipo_envio === 'presencial' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-text-muted'}`}
                >
                  <Handshake size={14} /> Presencial
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo_envio: 'virtual' }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-brand font-bold transition-all ${formData.tipo_envio === 'virtual' ? 'bg-white text-blue-600 shadow-sm' : 'text-brand-text-muted'}`}
                >
                  <Smartphone size={14} /> Virtual
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest px-1">Data Prometida</label>
              <input 
                type="date"
                className="w-full px-4 py-3 bg-brand-bg border border-brand-border rounded-xl text-sm font-sans outline-none focus:ring-2 focus:ring-brand-primary/20"
                value={formData.data_prometida}
                onChange={e => setFormData(prev => ({ ...prev, data_prometida: e.target.value }))}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-primary text-white rounded-2xl font-brand font-bold text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <SaveIcon size={20} />}
            SALVAR REGISTRO
          </button>
        </form>
      </div>
    </div>
  );
}

function SaveIcon({ size }: { size: number }) {
  return <CheckCircle2 size={size} />;
}
