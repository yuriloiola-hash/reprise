'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { calcularStatusVisita } from '@/lib/visitStatus';

type CategoriaCat = Database['public']['Enums']['categoria_cat'];
import { PotencialTab } from '@/components/medicos/PotencialTab';

export default function MedicoPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: medicoId } = use(params);

  const [medico, setMedico] = useState<any>(null);
  const [visitas, setVisitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'potencial'>('info');

  useEffect(() => {
    async function loadData() {
      // 1. Busca Médico
      const { data: m } = await supabase
        .from('medicos')
        .select('*')
        .eq('id', medicoId)
        .single();
      
      if (!m) {
        alert('Médico não encontrado');
        router.back();
        return;
      }
      setMedico(m);

      // 2. Busca histórico de visitas e insights
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;

      if (userId) {
        const { data: v } = await supabase
          .from('visitas')
          .select(`
            id, data_planejada, status, nota_propaganda,
            perfil_risco, perfil_paciencia, perfil_extroversao, perfil_normas, pre_visita_feita, pos_visita_feita,
            insights ( id, texto, eh_privado, created_at, rep_id )
          `)
          .eq('medico_id', medicoId)
          .order('data_planejada', { ascending: false });

        if (v) {
          // Filtrar insights no cliente
          const visitasComInsightsFiltrados = v.map(vis => ({
            ...vis,
            insights: vis.insights.filter((i: any) => !i.eh_privado || i.rep_id === userId)
          }));
          setVisitas(visitasComInsightsFiltrados);
        }
      }

      setLoading(false);
    }
    loadData();
  }, [medicoId, router]);

  if (loading) return <div className="p-8 text-center text-brand-text-muted animate-pulse">Carregando perfil...</div>;

  const renderBadge = (cat: CategoriaCat | null) => {
    switch (cat) {
      case 'CAT1': return 'bg-[#FEF3C7] text-[#92400E]';
      case 'CAT2': return 'bg-[#DBEAFE] text-[#1E40AF]';
      case 'CAT3': return 'bg-[#E0E7FF] text-[#3730A3]';
      case 'CAT4': return 'bg-[#F1F5F9] text-[#475569]';
      default: return 'bg-brand-bg text-brand-text-muted';
    }
  };

  return (
    <div className="bg-brand-bg min-h-screen pb-32">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-brand-border px-4 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-brand-text-muted hover:text-brand-text transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-display font-semibold text-lg text-brand-text">Perfil do Médico</h1>
        </div>
        <button 
          onClick={() => router.push(`/medicos/${medicoId}/editar`)}
          className="p-2 text-brand-text-muted hover:text-brand-primary transition-colors"
        >
          <Edit3 size={20} />
        </button>
      </header>

      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
        
        {/* Cabeçalho do Médico */}
        <div className="bg-white p-6 rounded-[16px] shadow-sm border border-brand-border space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            {/* Logo/Ícone decorativo */}
          </div>
          
          <div>
            <h2 className="font-display font-semibold text-2xl text-brand-text mb-1">{medico.nome}</h2>
            <p className="font-sans text-brand-text-muted">{medico.especialidade}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide ${renderBadge(medico.categoria_cat)}`}>
              {medico.categoria_cat || 'S/C'}
            </span>
          </div>

          <div className="pt-4 border-t border-brand-border flex items-center gap-3 font-sans text-sm text-brand-text-muted">
            <MapPin size={18} className="text-brand-primary" />
            <span>{medico.clinica || 'Sem clínica vinculada'} • {medico.local_complexo || 'Endereço não informado'}</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white rounded-xl border border-brand-border p-1 w-full md:w-max mx-auto shadow-sm">
          <button 
            onClick={() => setActiveTab('info')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-sans font-medium transition-all ${
              activeTab === 'info' ? 'bg-brand-bg text-brand-text shadow-sm' : 'bg-transparent text-brand-text-muted hover:bg-slate-50'
            }`}
          >
            Informações & Visitas
          </button>
          <button 
            onClick={() => setActiveTab('potencial')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-sans font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'potencial' ? 'bg-brand-primary/10 text-brand-primary shadow-sm' : 'bg-transparent text-brand-text-muted hover:bg-slate-50'
            }`}
          >
            ⚡ Potencial de Mercado
          </button>
        </div>

        {activeTab === 'potencial' ? (
          <PotencialTab medico={medico} />
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Observações Permanentes */}
        <div className="bg-amber-50 p-5 rounded-[16px] border border-amber-200 space-y-2">
          <h3 className="font-display font-semibold text-sm text-amber-800 uppercase tracking-wider px-1 flex items-center gap-2">
            📝 Observações Permanentes
          </h3>
          <p className="font-sans text-sm text-amber-900 bg-white/50 p-4 rounded-[12px] whitespace-pre-wrap">
            {medico.observacoes || 'Nenhuma observação permanente registrada.'}
          </p>
        </div>

        {/* Histórico de Visitas */}
        <div className="space-y-4 pt-4">
          <h3 className="font-display font-semibold text-sm text-brand-text-muted uppercase tracking-wider px-1 flex items-center gap-2">
            🕐 Histórico de Visitas ({visitas.length})
          </h3>

          {visitas.length > 0 ? (
            <div className="space-y-4">
              {visitas.map((visita) => {
                const statusInfo = calcularStatusVisita({
                  dataPlanejada: visita.data_planejada,
                  preVisitaFeita: visita.pre_visita_feita,
                  posVisitaFeita: visita.pos_visita_feita
                });

                return (
                  <div key={visita.id} className="bg-white rounded-[16px] border border-brand-border shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-brand-bg/50 px-5 py-3 border-b border-brand-border flex justify-between items-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1 ${statusInfo.pillBg} ${statusInfo.pillText}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
                        {statusInfo.label}
                      </span>
                      <span className="font-mono text-xs text-brand-text-muted">
                        {new Date(visita.data_planejada + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>

                    <div className="p-5 space-y-4">
                      {visita.pos_visita_feita ? (
                        <>
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="font-sans text-xs font-bold text-brand-text bg-brand-bg px-2.5 py-1 rounded-md border border-brand-border">
                              ★ Propaganda: {visita.nota_propaganda}/10
                            </span>
                            <span className="font-sans text-xs text-brand-text-muted">
                              Perfil: Risco {visita.perfil_risco} • Paciência {visita.perfil_paciencia} • Extro. {visita.perfil_extroversao} • Normas {visita.perfil_normas}
                            </span>
                          </div>

                          {visita.insights && visita.insights.length > 0 && (
                            <div className="space-y-2 bg-[#F7FAFF] p-4 rounded-[12px] border border-[#E8EFF8]">
                              <p className="font-sans text-xs font-semibold text-brand-primary flex items-center gap-1.5">
                                💡 Insights desta visita:
                              </p>
                              <ul className="space-y-2">
                                {visita.insights.map((insight: any) => (
                                  <li key={insight.id} className="font-sans text-sm text-brand-text flex items-start gap-2">
                                    <span className="text-brand-secondary mt-0.5">•</span>
                                    <span>{insight.texto}</span>
                                    {insight.eh_privado && (
                                      <span className="ml-2 text-[9px] uppercase font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">Privado</span>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="font-sans text-sm text-brand-text-muted italic">Visita agendada, pós-visita não registrada.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-[16px] border border-dashed border-brand-border">
              <p className="font-sans text-sm text-brand-text-muted">Nenhum histórico de visitas para este médico.</p>
            </div>
          )}
        </div>
        </div>
        )}

      </div>
    </div>
  );
}
