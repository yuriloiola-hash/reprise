'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Ticket, Plus, Check, Smartphone, 
  Handshake, Loader2, Save, Trash2, Clock,
  FileText, ClipboardList
} from 'lucide-react';
import { Database } from '@/lib/database.types';

type Cupom = Database['public']['Tables']['cupons']['Row'];

interface MedicoCuponsProps {
  medicoId: string;
}

export function MedicoCupons({ medicoId }: MedicoCuponsProps) {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [tipo, setTipo] = useState<'cupom' | 'demanda'>('cupom');
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    produto: 'Patz Cp',
    tipo_envio: 'presencial' as 'presencial' | 'virtual',
    data_prometida: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchCupons();
  }, [medicoId]);

  async function fetchCupons() {
    setLoading(true);
    const { data } = await supabase
      .from('cupons')
      .select('*')
      .eq('medico_id', medicoId)
      .order('created_at', { ascending: false });

    if (data) setCupons(data);
    setLoading(false);
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tipo === 'cupom' && !formData.codigo) return;
    if (tipo === 'demanda' && !formData.descricao) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('cupons').insert({
      tipo,
      codigo: tipo === 'cupom' ? formData.codigo : null,
      descricao: tipo === 'demanda' ? formData.descricao : null,
      produto: formData.produto,
      tipo_envio: formData.tipo_envio,
      data_prometida: formData.data_prometida,
      medico_id: medicoId,
      rep_id: user?.id,
      status_entrega: 'prometido'
    });

    if (!error) {
      setFormData({
        codigo: '',
        descricao: '',
        produto: 'Patz Cp',
        tipo_envio: 'presencial',
        data_prometida: new Date().toISOString().split('T')[0]
      });
      setShowAdd(false);
      fetchCupons();
    }
    setSaving(false);
  };

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

  const deleteCupom = async (id: string) => {
    if (!confirm('Excluir este registro?')) return;
    const { error } = await supabase.from('cupons').delete().eq('id', id);
    if (!error) setCupons(prev => prev.filter(c => c.id !== id));
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-brand-text-muted">Carregando dados...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="font-display font-semibold text-sm text-brand-text-muted uppercase tracking-wider flex items-center gap-2">
          <ClipboardList size={16} /> Cupons & Demandas
        </h3>
        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="text-[10px] font-brand font-bold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-lg border border-brand-primary/20 hover:bg-brand-primary/20 transition-all flex items-center gap-1.5"
        >
          {showAdd ? 'CANCELAR' : <><Plus size={12} /> NOVO REGISTRO</>}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-[20px] border-2 border-brand-primary/10 shadow-lg space-y-5 animate-in slide-in-from-top-2 duration-300">
          
          <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-border mb-4">
            <button 
              type="button"
              onClick={() => setTipo('cupom')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-brand font-bold transition-all ${tipo === 'cupom' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-text-muted'}`}
            >
              <Ticket size={14} /> Cupom Patz
            </button>
            <button 
              type="button"
              onClick={() => setTipo('demanda')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-brand font-bold transition-all ${tipo === 'demanda' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-text-muted'}`}
            >
              <FileText size={14} /> Outra Demanda
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tipo === 'cupom' ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest px-1">Código do Cupom</label>
                <input 
                  type="text" required placeholder="0000000000"
                  className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
                  value={formData.codigo}
                  onChange={e => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                />
              </div>
            ) : (
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest px-1">Descrição da Demanda</label>
                <textarea 
                  required placeholder="Ex: Enviar monografia de Cymbi, Preço do Lyberdia..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm font-sans font-medium outline-none focus:ring-2 focus:ring-brand-primary/20"
                  value={formData.descricao}
                  onChange={e => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </div>
            )}
            
            {tipo === 'cupom' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest px-1">Produto Sirius</label>
                <select 
                  className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm font-sans font-bold outline-none focus:ring-2 focus:ring-brand-primary/20"
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
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest px-1">Logística de Entrega</label>
              <div className="flex bg-brand-bg rounded-xl p-1 border border-brand-border">
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo_envio: 'presencial' }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-brand font-bold transition-all ${formData.tipo_envio === 'presencial' ? 'bg-white text-brand-primary shadow-sm' : 'text-brand-text-muted'}`}
                >
                  <Handshake size={14} /> Presencial
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo_envio: 'virtual' }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-brand font-bold transition-all ${formData.tipo_envio === 'virtual' ? 'bg-white text-blue-600 shadow-sm' : 'text-brand-text-muted'}`}
                >
                  <Smartphone size={14} /> Virtual
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest px-1">Prazo Prometido</label>
              <input 
                type="date"
                className="w-full px-4 py-2.5 bg-brand-bg border border-brand-border rounded-xl text-sm font-sans outline-none focus:ring-2 focus:ring-brand-primary/20"
                value={formData.data_prometida}
                onChange={e => setFormData(prev => ({ ...prev, data_prometida: e.target.value }))}
              />
            </div>
          </div>

          <button 
            type="submit" disabled={saving}
            className="w-full py-3.5 bg-brand-primary text-white rounded-xl font-brand font-bold text-xs hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            SALVAR {tipo.toUpperCase()}
          </button>
        </form>
      )}

      {cupons.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-[16px] border border-dashed border-brand-border">
          <p className="text-brand-text-muted font-sans text-sm">Nenhum registro encontrado para este médico.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {cupons.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border border-brand-border shadow-sm flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  item.status_entrega === 'entregue' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {item.status_entrega === 'entregue' ? <Check size={20} /> : (item.tipo === 'cupom' ? <Ticket size={20} /> : <FileText size={20} />)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    {item.tipo === 'cupom' ? (
                      <span className="font-mono text-sm font-bold text-brand-text tracking-tight">{item.codigo}</span>
                    ) : (
                      <span className="font-sans text-sm font-bold text-brand-text leading-tight">{item.descricao}</span>
                    )}
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      item.tipo === 'cupom' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                    }`}>
                      {item.tipo === 'cupom' ? item.produto : 'DEMANDA'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-brand-text-muted font-medium flex items-center gap-1">
                      {item.tipo_envio === 'presencial' ? <Handshake size={10} /> : <Smartphone size={10} />}
                      {item.tipo_envio}
                    </span>
                    <span className="text-[10px] text-brand-text-muted font-mono">
                      Prometido em: {item.data_prometida ? new Date(item.data_prometida + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleStatus(item)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-brand font-bold border transition-all ${
                    item.status_entrega === 'entregue'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-amber-600 border-amber-200 hover:border-emerald-600 hover:text-emerald-600'
                  }`}
                >
                  {item.status_entrega === 'entregue' ? 'ENTREGUE' : 'MARCAR OK'}
                </button>
                <button 
                  onClick={() => deleteCupom(item.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
