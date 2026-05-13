'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, Save, Star, MapPin, Building2, Stethoscope } from 'lucide-react';

const ESPECIALIDADES = [
  'Neurologia', 'Cardiologia', 'Psiquiatria', 'Reumatologia', 'Ortopedia', 'Clínico Geral'
];

const BRANDS_BY_SPECIALTY: Record<string, string[]> = {
  Cardiologia: ['Brasart', 'Brasart HCT', 'Brasart BCC', 'Vynaxa 20', 'Vynaxa 2,5', 'Patz SL', 'Somalgin Cardio'],
  Psiquiatria: ['Patz SL', 'Patz Gts', 'Lyberdia Gts', 'Lyberdia Caps', 'Konduz', 'Cymbi'],
  Neurologia: ['Patz SL', 'Patz Gts', 'Lyberdia Gts', 'Lyberdia Caps', 'Konduz', 'Cymbi'],
  Reumatologia: ['Condres Longbio', 'Condres Ultra', 'Konduz', 'Cymbi'],
  Ortopedia: ['Condres Longbio', 'Condres Ultra', 'Konduz', 'Cymbi'],
  'Clínico Geral': ['Brasart', 'Patz SL', 'Vynaxa', 'Konduz', 'Cymbi']
};

export default function NovoMedicoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    especialidade: ESPECIALIDADES[0],
    clinica: '',
    local_complexo: '', // Usaremos para o Bairro conforme instrução
  });

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  // Limpar marcas se a especialidade mudar
  useEffect(() => {
    setSelectedBrands([]);
  }, [formData.especialidade]);

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const repId = user ? user.id : null;

      const { error } = await supabase.from('medicos').insert({
        ...(repId ? { rep_id: repId } : {}),
        nome: formData.nome,
        especialidade: formData.especialidade,
        clinica: formData.clinica || null,
        local_complexo: formData.local_complexo || null, // Bairro
        marcas_chave: selectedBrands,
        categoria_cat: 'CAT3' // Valor padrão fixo já que removemos do form
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Médico Sirius cadastrado com sucesso!' });
      setTimeout(() => router.push('/'), 1500);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao cadastrar médico.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        
        {/* Header Sirius */}
        <header className="mb-12 flex items-center justify-between">
          <div className="space-y-1">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold text-sm mb-4"
            >
              <ChevronLeft size={18} />
              VOLTAR
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Novo Médico Sirius</h1>
            <p className="text-slate-500 font-medium">Cadastramento simplificado para a praça Sobral.</p>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Seção 1: Dados Principais */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-200 space-y-8">
            <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                <Stethoscope size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Dados do Profissional</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nome Completo</label>
                <input
                  required
                  type="text"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 outline-none font-bold transition-all"
                  placeholder="Ex: Dr. Roberto Silva"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Especialidade</label>
                <select
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 outline-none font-bold transition-all appearance-none"
                  value={formData.especialidade}
                  onChange={(e) => setFormData({ ...formData, especialidade: e.target.value })}
                >
                  {ESPECIALIDADES.map(esp => (
                    <option key={esp} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={14} /> Clínica
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 outline-none font-bold transition-all"
                  placeholder="Nome da clínica"
                  value={formData.clinica}
                  onChange={(e) => setFormData({ ...formData, clinica: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} /> Bairro
                </label>
                <input
                  required
                  type="text"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 outline-none font-bold transition-all"
                  placeholder="Ex: Aldeota / Centro"
                  value={formData.local_complexo}
                  onChange={(e) => setFormData({ ...formData, local_complexo: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Marcas-Chave Sirius ocultas conforme solicitação para automação futura */}

          {message && (
            <div className={`p-6 rounded-2xl text-sm font-bold flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              disabled={loading}
              type="submit"
              className="flex items-center gap-3 px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
            >
              {loading ? 'SALVANDO...' : (
                <>
                  <Save size={24} />
                  SALVAR MÉDICO
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
