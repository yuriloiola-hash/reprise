'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PosVisitaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: visitaId } = use(params);

  const [visita, setVisita] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Formulário
  const [textoInsight, setTextoInsight] = useState('');
  const [ehPrivado, setEhPrivado] = useState(false);
  const [notaPropaganda, setNotaPropaganda] = useState<number | null>(null);
  const [perfilRisco, setPerfilRisco] = useState(5);
  const [perfilPaciencia, setPerfilPaciencia] = useState(5);
  const [perfilExtroversao, setPerfilExtroversao] = useState(5);
  const [perfilNormas, setPerfilNormas] = useState(5);
  const [observacoes, setObservacoes] = useState('');
  const [observacoesOriginais, setObservacoesOriginais] = useState('');

  useEffect(() => {
    async function loadData() {
      const { data: v } = await supabase
        .from('visitas')
        .select('*, medicos(*)')
        .eq('id', visitaId)
        .single();
        
      if (!v) {
        alert('Visita não encontrada');
        router.back();
        return;
      }
      setVisita(v);
      setObservacoes(v.medicos?.observacoes || '');
      setObservacoesOriginais(v.medicos?.observacoes || '');
      setLoading(false);
    }
    loadData();
  }, [visitaId, router]);

  const handleSave = async () => {
    if (notaPropaganda === null) {
      alert('Por favor, avalie a propaganda.');
      return;
    }
    if (!textoInsight.trim()) {
      alert('Por favor, registre o insight principal da visita.');
      return;
    }

    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Sessão expirada. Faça login novamente.');
        router.push('/login');
        return;
      }

      // 1. Atualizar visita
      const { error: visitError } = await supabase.from('visitas').update({
        pos_visita_feita: true,
        status: 'CONCLUIDO',
        nota_propaganda: notaPropaganda,
        perfil_risco: perfilRisco,
        perfil_paciencia: perfilPaciencia,
        perfil_extroversao: perfilExtroversao,
        perfil_normas: perfilNormas,
        updated_at: new Date().toISOString(),
      }).eq('id', visitaId);

      if (visitError) throw visitError;

      // 2. Salvar insight no perfil do médico
      const { error: insightError } = await supabase.from('insights').insert({
        rep_id: user.id,
        medico_id: visita.medico_id,
        visita_id: visitaId,
        texto: textoInsight,
        eh_privado: ehPrivado,
      });

      if (insightError) throw insightError;

      // 3. Atualizar observações permanentes
      if (observacoes !== observacoesOriginais) {
        const { error: medicoError } = await supabase.from('medicos').update({
          observacoes: observacoes,
          updated_at: new Date().toISOString(),
        }).eq('id', visita.medico_id);
        
        if (medicoError) throw medicoError;
      }

      alert('Visita concluída com sucesso!');
      router.push('/');
    } catch (e: any) {
      alert('Erro ao salvar visita: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-brand-text-muted animate-pulse">Carregando...</div>;

  const renderNotaButton = (nota: number) => {
    const isSelected = notaPropaganda === nota;
    let colorClass = '';
    if (nota <= 4) colorClass = isSelected ? 'bg-red-600 border-red-600 text-white scale-110 shadow-md' : 'border-red-600 text-red-600 bg-transparent';
    else if (nota <= 6) colorClass = isSelected ? 'bg-amber-500 border-amber-500 text-white scale-110 shadow-md' : 'border-amber-500 text-amber-500 bg-transparent';
    else if (nota <= 8) colorClass = isSelected ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-md' : 'border-blue-600 text-blue-600 bg-transparent';
    else colorClass = isSelected ? 'bg-green-600 border-green-600 text-white scale-110 shadow-md' : 'border-green-600 text-green-600 bg-transparent';

    return (
      <button
        key={nota}
        onClick={() => setNotaPropaganda(nota)}
        className={`w-10 h-10 flex items-center justify-center rounded-full font-display font-bold text-sm border-2 transition-all ${colorClass}`}
      >
        {nota}
      </button>
    );
  };

  const renderSlider = (label: string, value: number, setter: (v: number) => void, icon: string) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-sans text-sm font-medium text-brand-text flex items-center gap-2">
          <span>{icon}</span> {label}
        </span>
        <span className="font-mono text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-0.5 rounded">
          {value}
        </span>
      </div>
      <input 
        type="range" min="0" max="10" value={value} 
        onChange={(e) => setter(Number(e.target.value))}
        className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-primary"
      />
    </div>
  );

  return (
    <div className="bg-brand-bg min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-brand-border px-4 py-4 shadow-sm flex items-center gap-4">
        <button onClick={() => router.back()} className="text-brand-text-muted hover:text-brand-text">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="font-display font-semibold text-lg text-brand-text">Pós-Visita</h1>
          <p className="font-sans text-xs text-brand-text-muted">{visita.medicos?.nome}</p>
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        
        {/* Seção 1: Novo Insight */}
        <section className="bg-white p-5 rounded-[16px] shadow-sm border border-brand-border space-y-4">
          <h3 className="font-display font-semibold text-md text-brand-text">O que aconteceu nesta visita? *</h3>
          <textarea 
            value={textoInsight}
            onChange={e => setTextoInsight(e.target.value)}
            placeholder="Ex: Médico demonstrou interesse em Cardio Plus para pacientes com HAS..."
            className="w-full min-h-[120px] p-3 border border-brand-border rounded-[12px] font-sans text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none resize-y"
            maxLength={1000}
          />
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="privado" 
              checked={ehPrivado} 
              onChange={e => setEhPrivado(e.target.checked)}
              className="w-4 h-4 text-brand-primary border-brand-border rounded accent-brand-primary cursor-pointer"
            />
            <label htmlFor="privado" className="font-sans text-sm text-brand-text-muted flex items-center gap-1 cursor-pointer">
              <Lock size={14} /> Insight privado (só você vê)
            </label>
          </div>
        </section>

        {/* Seção 2: Avaliação */}
        <section className="bg-white p-5 rounded-[16px] shadow-sm border border-brand-border space-y-4">
          <h3 className="font-display font-semibold text-md text-brand-text">Como foi a apresentação? *</h3>
          <div className="flex justify-between items-center overflow-x-auto pb-2 custom-scrollbar gap-2">
            {[0,1,2,3,4,5,6,7,8,9,10].map(renderNotaButton)}
          </div>
        </section>

        {/* Seção 3: Percepção Comportamental */}
        <section className="bg-white p-5 rounded-[16px] shadow-sm border border-brand-border space-y-6">
          <h3 className="font-display font-semibold text-md text-brand-text mb-2">Percepção Comportamental</h3>
          {renderSlider("Risco", perfilRisco, setPerfilRisco, "⚡")}
          {renderSlider("Paciência", perfilPaciencia, setPerfilPaciencia, "🕐")}
          {renderSlider("Extroversão", perfilExtroversao, setPerfilExtroversao, "💬")}
          {renderSlider("Normas", perfilNormas, setPerfilNormas, "📋")}
        </section>

        {/* Seção 4: Observações Permanentes */}
        <section className="bg-white p-5 rounded-[16px] shadow-sm border border-brand-border space-y-2">
          <h3 className="font-display font-semibold text-md text-brand-text">Observações sobre o médico</h3>
          <p className="font-sans text-xs text-brand-text-muted mb-2">Ficará visível no perfil do médico em todas as visitas futuras</p>
          <textarea 
            value={observacoes}
            onChange={e => setObservacoes(e.target.value)}
            placeholder="Ex: Prefere reuniões curtas. Chegar antes das 10h..."
            className="w-full min-h-[100px] p-3 border border-brand-border rounded-[12px] font-sans text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
          />
        </section>

      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-brand-border md:pl-64 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-4 bg-green-600 text-white rounded-[12px] font-sans font-medium hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? 'Salvando...' : (
              <>
                <Save size={20} />
                Concluir Visita
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
