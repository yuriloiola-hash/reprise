import { createClient } from '@/utils/supabase/server';
import { BarChart3, TrendingUp, Target, Award, CheckCircle2 } from 'lucide-react';

export default async function DesempenhoPage() {
  const supabase = await createClient();

  // 1. Buscar todos os médicos e visitas do mês atual para cálculo de métricas
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  const [medicosRes, visitasRes] = await Promise.all([
    supabase.from('medicos').select('id, categoria_cat, marcas_chave'),
    supabase.from('visitas')
      .select('medico_id, pos_visita_feita')
      .gte('data_planejada', inicioMes.toISOString().split('T')[0])
      .eq('pos_visita_feita', true)
  ]);

  const medicos = medicosRes.data || [];
  const visitasConcluidas = visitasRes.data || [];
  const medicosVisitadosIds = new Set(visitasConcluidas.map(v => v.medico_id));

  // 2. Lógica de agrupamento por Categoria
  const categorias = ['CAT1', 'CAT2', 'CAT3', 'CAT4', 'MARCAS_CHAVE'] as const;
  
  const statsPorCategoria = categorias.map(cat => {
    const totalNaBase = medicos.filter(m => m.categoria_cat === cat).length;
    const visitados = medicos.filter(m => m.categoria_cat === cat && medicosVisitadosIds.has(m.id)).length;
    const cobertura = totalNaBase > 0 ? Math.round((visitados / totalNaBase) * 100) : 0;
    
    return {
      label: cat === 'MARCAS_CHAVE' ? 'Marcas Chave' : `Categoria ${cat.replace('CAT', '')}`,
      total: totalNaBase,
      visitados,
      cobertura,
      color: cat === 'CAT1' ? 'bg-blue-600' : 'bg-slate-400',
    };
  });

  // 3. Métricas Gerais
  const totalMedicos = medicos.length;
  const totalCobertura = totalMedicos > 0 ? Math.round((medicosVisitadosIds.size / totalMedicos) * 100) : 0;
  const medicosComMarcasSirius = medicos.filter(m => m.marcas_chave && m.marcas_chave.length > 5).length;

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto">
      <header className="mb-12">
        <div className="flex items-center gap-2 text-blue-600 mb-2">
          <TrendingUp size={20} />
          <span className="text-sm font-black uppercase tracking-[0.2em]">Painel de Performance</span>
        </div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Desempenho Sirius</h2>
        <p className="text-slate-500 font-medium mt-1">Metas e cobertura da praça Sobral • {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
      </header>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target size={80} />
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Cobertura Total</p>
          <p className="text-5xl font-black text-slate-900">{totalCobertura}%</p>
          <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${totalCobertura}%` }} />
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-6 opacity-10">
            <Award size={80} className="text-blue-400" />
          </div>
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Linha Sirius</p>
          <p className="text-5xl font-black text-white">{medicosComMarcasSirius}</p>
          <p className="text-sm text-slate-400 mt-2">Médicos com perfil Sirius mapeado</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Visitas Concluídas</p>
          <p className="text-5xl font-black text-green-600">{visitasConcluidas.length}</p>
          <p className="text-sm text-slate-500 mt-2">Total de interações este mês</p>
        </div>
      </div>

      {/* Grade de Cobertura por Categoria */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-100 pb-6">
          <BarChart3 size={24} className="text-slate-400" />
          <h3 className="text-2xl font-bold text-slate-800">Cobertura por Categoria</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
          {statsPorCategoria.map((stat) => (
            <div key={stat.label} className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <h4 className="font-bold text-slate-900">{stat.label}</h4>
                  <p className="text-xs text-slate-500 font-medium">
                    {stat.visitados} de {stat.total} médicos visitados
                  </p>
                </div>
                <span className="text-2xl font-black text-slate-900">{stat.cobertura}%</span>
              </div>
              
              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex">
                <div 
                  className={`${stat.color} h-full transition-all duration-1000`} 
                  style={{ width: `${stat.cobertura}%` }} 
                />
              </div>
              
              {stat.cobertura >= 100 && (
                <div className="flex items-center gap-1.5 text-green-600 text-[10px] font-black uppercase tracking-wider">
                  <CheckCircle2 size={12} />
                  Meta Atingida
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-12 text-center">
        <p className="text-xs text-slate-400 font-medium italic">
          Os dados acima são atualizados em tempo real com base no fechamento das pós-visitas.
        </p>
      </footer>
    </div>
  );
}
