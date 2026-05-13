import { createClient } from '@/utils/supabase/server';
import { Building2, MapPin, Search, Plus } from 'lucide-react';
import Link from 'next/link';

export default async function ClinicasPage() {
  const supabase = await createClient();

  // Buscar clínicas únicas cadastradas nos médicos
  const { data, error } = await supabase
    .from('medicos')
    .select('clinica, local_complexo')
    .not('clinica', 'is', null)
    .order('clinica');

  // Remover duplicatas no lado do servidor (agrupamento básico)
  const clinicasUnicas = data ? Array.from(new Set(data.map(c => JSON.stringify({
    nome: c.clinica,
    bairro: c.local_complexo
  })))).map(s => JSON.parse(s)) : [];

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="p-8 md:p-16 max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-blue-600">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <Building2 size={20} className="text-white" />
              </div>
              <span className="text-sm font-black uppercase tracking-[0.3em]">Patrimônio Sirius</span>
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Clínicas</h1>
            <p className="text-xl text-slate-500 font-medium">Gestão de pontos de atendimento em Sobral.</p>
          </div>

          <div className="flex items-center gap-3">
             <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar clínica..." 
                  className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-sm"
                />
             </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinicasUnicas.length > 0 ? (
            clinicasUnicas.map((clinica, i) => (
              <div 
                key={i}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Building2 size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight group-hover:text-blue-600 transition-colors">
                  {clinica.nome}
                </h3>
                <div className="flex items-center gap-2 text-sm text-slate-500 font-bold uppercase tracking-wider">
                  <MapPin size={14} className="text-blue-600" />
                  {clinica.bairro || 'Bairro não informado'}
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    ID MAPS: PENDENTE
                  </span>
                  <button className="text-xs font-black text-blue-600 hover:underline">
                    EDITAR LOCAL
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">Nenhuma clínica mapeada nos cadastros de médicos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
