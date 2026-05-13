'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PreVisitaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: visitaId } = use(params);

  const [visita, setVisita] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [ultimaVisita, setUltimaVisita] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Busca a visita atual
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

        // 2. Busca histórico de insights do médico
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          alert('Sessão expirada. Faça login novamente.');
          router.push('/login');
          return;
        }

        const { data: i } = await supabase
          .from('insights')
          .select('*')
          .eq('medico_id', v.medico_id)
          .or(`eh_privado.eq.false,rep_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
        
        if (i) setInsights(i);

        // 3. Busca a última visita concluída
        // Nota: data_visita foi mencionado no prompt, mas usaremos data_planejada para ordenação se data_visita não existir
        const { data: uv } = await supabase
          .from('visitas')
          .select('*, insights(*)')
          .eq('medico_id', v.medico_id)
          .eq('pos_visita_feita', true)
          .order('data_planejada', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (uv) setUltimaVisita(uv);
      } catch (err: any) {
        alert('Erro ao carregar dados: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [visitaId, router]);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Sessão expirada.');
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('visitas')
        .update({ pre_visita_feita: true })
        .eq('id', visitaId);

      if (error) {
        alert('Erro ao iniciar visita: ' + error.message);
      } else {
        router.push('/');
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-brand-text-muted animate-pulse">Carregando histórico...</div>;
  }

  const dataAtual = new Date(visita.data_planejada).toLocaleDateString('pt-BR');

  return (
    <div className="bg-brand-bg min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-brand-border px-4 py-4 shadow-sm flex items-center gap-4">
        <button onClick={() => router.back()} className="text-brand-text-muted hover:text-brand-text">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="font-display font-semibold text-lg text-brand-text">Pré-Visita</h1>
          <p className="font-sans text-xs text-brand-text-muted">{dataAtual}</p>
        </div>
      </header>

      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-5 rounded-[16px] shadow-sm border border-brand-border">
          <h2 className="font-display font-semibold text-xl text-brand-text">{visita.medicos?.nome}</h2>
          <p className="font-sans text-sm text-brand-text-muted">{visita.medicos?.especialidade} • {visita.medicos?.clinica}</p>
        </div>

        {/* Última Visita */}
        {ultimaVisita && (
          <div className="space-y-2">
            <h3 className="font-display font-semibold text-sm text-brand-text-muted uppercase tracking-wider px-1">📌 Última Visita</h3>
            <div className="bg-[#F0FDF4] p-4 rounded-[12px] border border-green-200">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-xs text-green-700">
                  {new Date(ultimaVisita.data_planejada + 'T00:00:00').toLocaleDateString('pt-BR')}
                </span>
                <span className="font-sans text-xs font-bold text-green-800 bg-green-200 px-2 py-0.5 rounded-full">
                  ★ Propaganda: {ultimaVisita.nota_propaganda}/10
                </span>
              </div>
              <p className="font-sans text-sm text-green-900">
                {ultimaVisita.insights?.[0]?.texto || 'Sem observações registradas.'}
              </p>
            </div>
          </div>
        )}

        {/* Histórico de Insights */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-sm text-brand-text-muted uppercase tracking-wider px-1">
            💡 Histórico de Insights ({insights.length})
          </h3>
          
          {insights.length > 0 ? (
            <div className="space-y-3">
              {insights.map(insight => (
                <div key={insight.id} className="bg-white p-4 rounded-[12px] border border-brand-border shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-xs text-brand-text-muted">
                      {new Date(insight.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {insight.eh_privado && (
                      <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Privado</span>
                    )}
                  </div>
                  <p className="font-sans text-sm text-brand-text whitespace-pre-wrap">{insight.texto}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-[12px] border border-dashed border-brand-border">
              <p className="font-sans text-sm text-brand-text-muted">Nenhum insight anterior.<br/>Primeira visita registrada?</p>
            </div>
          )}
        </div>

      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-brand-border md:pl-64 z-50">
        <div className="max-w-2xl mx-auto">
          <button 
            onClick={handleConfirm}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full py-4 bg-brand-primary text-white rounded-[12px] font-sans font-medium hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50"
          >
            {saving ? 'Iniciando...' : (
              <>
                <CheckCircle size={20} />
                Confirmar Leitura e Iniciar Visita
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
