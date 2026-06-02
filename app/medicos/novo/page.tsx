'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { ChevronLeft, Save, Star, MapPin, Building2, Stethoscope, BarChart2, Trash2, Plus, Map, Edit2, X } from 'lucide-react';

type CategoriaCat = Database['public']['Enums']['categoria_cat'];

const ESPECIALIDADES = [
  'Neurologia', 'Cardiologia', 'Psiquiatria', 'Reumatologia', 'Ortopedia', 'Clínico Geral'
];

const ROTAS_DISPONIVEIS = ['Sobral', 'Acaraú', 'Ibiapaba', 'Crateús'];
const TRIMESTRES = ['T1/2025', 'T2/2025', 'T3/2025', 'T4/2025'];

type DetalhePrescricao = { marca: string; laboratorio: string; quantidade: number; ehMinhasMarca: boolean };
type ResumoPrescricao = {
  id: string;
  molecula: string;
  trimestre: string;
  detalhes: DetalhePrescricao[];
};

type DBMarca = { id: string; nome: string; laboratorio: string; eh_minhas_marca: boolean; adicionado_manualmente: boolean };
type DBMolecula = { id: string; nome: string; marcas: DBMarca[] };

export default function NovoMedicoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    crm: '',
    especialidade: ESPECIALIDADES[0],
    clinica: '',
    local_complexo: '', // Bairro
  });

  const [crmError, setCrmError] = useState<string | null>(null);
  const [rotas, setRotas] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const [catalogoDb, setCatalogoDb] = useState<DBMolecula[]>([]);
  const [resumos, setResumos] = useState<ResumoPrescricao[]>([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState<{ id?: string; molecula: string; trimestre: string; detalhes: DetalhePrescricao[] }>({
    molecula: '',
    trimestre: TRIMESTRES[0],
    detalhes: []
  });

  const [isAddingCompetitor, setIsAddingCompetitor] = useState(false);
  const [competitorSelect, setCompetitorSelect] = useState('');
  const [newCompetitorForm, setNewCompetitorForm] = useState({ nome: '', laboratorio: '', ehMinhasMarca: false });

  // Fetch Catalogo DB
  useEffect(() => {
    async function fetchCatalogo() {
      const { data: mols } = await (supabase as any).from('catalogo_moleculas').select('id, nome');
      const { data: marks } = await (supabase as any).from('catalogo_marcas').select('*');
      if (mols && marks) {
        const merged = mols.map((m: any) => ({
          id: m.id,
          nome: m.nome,
          marcas: marks.filter((mk: any) => mk.molecula_id === m.id).sort((a: any, b: any) => {
            if (a.eh_minhas_marca) return -1;
            if (b.eh_minhas_marca) return 1;
            return 0;
          })
        }));
        setCatalogoDb(merged);
      }
    }
    fetchCatalogo();
  }, []);

  // Limpar marcas se a especialidade mudar
  useEffect(() => {
    setSelectedBrands([]);
  }, [formData.especialidade]);

  const checkCrm = async () => {
    if (!formData.crm) {
      setCrmError(null);
      return;
    }
    const { data } = await supabase.from('medicos').select('id').eq('crm', formData.crm).limit(1);
    if (data && data.length > 0) {
      setCrmError('Este CRM já está cadastrado.');
    } else {
      setCrmError(null);
    }
  };

  const toggleRota = (rota: string) => {
    setRotas(prev => prev.includes(rota) ? prev.filter(r => r !== rota) : [...prev, rota]);
  };

  const getInitialDetalhes = (moleculaNome: string) => {
    const mol = catalogoDb.find(m => m.nome === moleculaNome);
    if (!mol) return [];
    const ems = mol.marcas.filter(m => m.eh_minhas_marca);
    return ems.map(m => ({ marca: m.nome, laboratorio: m.laboratorio, quantidade: 0, ehMinhasMarca: true }));
  };

  // --- Modal Logic ---
  const openModal = (resumo?: ResumoPrescricao) => {
    if (resumo) {
      setModalData({ 
        id: resumo.id, 
        molecula: resumo.molecula, 
        trimestre: resumo.trimestre, 
        detalhes: resumo.detalhes.map(d => ({ ...d })) 
      });
    } else {
      const firstMol = catalogoDb[0]?.nome || '';
      setModalData({
        molecula: firstMol,
        trimestre: TRIMESTRES[0],
        detalhes: getInitialDetalhes(firstMol)
      });
    }
    setIsAddingCompetitor(false);
    setCompetitorSelect('');
    setModalOpen(true);
  };

  const handleModalMoleculaChange = (novaMolecula: string) => {
    const existing = resumos.find(r => r.molecula === novaMolecula && r.trimestre === modalData.trimestre && r.id !== modalData.id);
    if (existing) {
      setModalData({ id: existing.id, molecula: existing.molecula, trimestre: existing.trimestre, detalhes: existing.detalhes.map(d => ({ ...d })) });
      return;
    }
    setModalData(prev => ({
      ...prev,
      molecula: novaMolecula,
      detalhes: getInitialDetalhes(novaMolecula)
    }));
    setIsAddingCompetitor(false);
    setCompetitorSelect('');
  };

  const handleModalTrimestreChange = (novoTrim: string) => {
    const existing = resumos.find(r => r.molecula === modalData.molecula && r.trimestre === novoTrim && r.id !== modalData.id);
    if (existing) {
      setModalData({ id: existing.id, molecula: existing.molecula, trimestre: existing.trimestre, detalhes: existing.detalhes.map(d => ({ ...d })) });
    } else {
      setModalData(prev => ({ ...prev, trimestre: novoTrim }));
    }
  };

  const handleAddExistingCompetitor = () => {
    if (!competitorSelect || competitorSelect === 'novo') return;
    const dbMol = catalogoDb.find(m => m.nome === modalData.molecula);
    const mark = dbMol?.marcas.find(m => m.id === competitorSelect);
    if (mark) {
      setModalData(prev => ({
        ...prev,
        detalhes: [...prev.detalhes, { marca: mark.nome, laboratorio: mark.laboratorio, quantidade: 0, ehMinhasMarca: mark.eh_minhas_marca }]
      }));
      setCompetitorSelect('');
      setIsAddingCompetitor(false);
    }
  };

  const handleSaveNewCompetitor = async () => {
    if (!newCompetitorForm.nome || !newCompetitorForm.laboratorio) return;
    
    const dbMol = catalogoDb.find(m => m.nome === modalData.molecula);
    if (!dbMol) return;
    const { data, error } = await (supabase as any).from('catalogo_marcas').insert({
       molecula_id: dbMol.id,
       nome: newCompetitorForm.nome,
       laboratorio: newCompetitorForm.laboratorio,
       eh_minhas_marca: newCompetitorForm.ehMinhasMarca,
       adicionado_manualmente: true
    }).select().single();

    if (error) {
      console.error(error);
      alert("Erro ao adicionar no catálogo.");
      return;
    }

    // Update local catalog state
    setCatalogoDb(prev => prev.map(m => m.id === dbMol.id ? { ...m, marcas: [...m.marcas, data] } : m));

    // Add to modal
    setModalData(prev => ({
      ...prev,
      detalhes: [...prev.detalhes, { marca: data.nome, laboratorio: data.laboratorio, quantidade: 0, ehMinhasMarca: data.eh_minhas_marca }]
    }));

    setNewCompetitorForm({ nome: '', laboratorio: '', ehMinhasMarca: false });
    setCompetitorSelect('');
    setIsAddingCompetitor(false);
    
    // Toast simples nativo
    const t = document.createElement('div');
    t.innerText = "Novo concorrente adicionado ao catálogo.";
    t.className = "fixed bottom-5 right-5 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-[200] font-bold text-sm animate-bounce";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  };

  const saveModal = () => {
    if (modalData.id) {
      setResumos(prev => prev.map(r => r.id === modalData.id ? { id: r.id, molecula: modalData.molecula, trimestre: modalData.trimestre, detalhes: modalData.detalhes } : r));
    } else {
      const existingIdx = resumos.findIndex(r => r.molecula === modalData.molecula && r.trimestre === modalData.trimestre);
      if (existingIdx >= 0) {
        setResumos(prev => {
          const arr = [...prev];
          arr[existingIdx] = { id: arr[existingIdx].id, molecula: modalData.molecula, trimestre: modalData.trimestre, detalhes: modalData.detalhes };
          return arr;
        });
      } else {
        setResumos(prev => [...prev, { id: Math.random().toString(36).substring(2, 9), molecula: modalData.molecula, trimestre: modalData.trimestre, detalhes: modalData.detalhes }]);
      }
    }
    setModalOpen(false);
  };
  // -------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (crmError) {
      setMessage({ type: 'error', text: 'Corrija o erro do CRM antes de salvar.' });
      return;
    }
    if (rotas.length === 0) {
      setMessage({ type: 'error', text: 'Selecione ao menos uma rota.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const repId = user ? user.id : null;

      // Inserir Médico
      const { data: medicoCriado, error } = await supabase.from('medicos').insert({
        ...(repId ? { rep_id: repId } : {}),
        nome: formData.nome,
        crm: formData.crm,
        especialidade: formData.especialidade,
        clinica: formData.clinica || null,
        local_complexo: formData.local_complexo || null, // Bairro
        marcas_chave: selectedBrands,
        rotas: rotas,
        categoria_cat: 'CAT3' as CategoriaCat
      } as any).select('id').single();

      if (error) throw error;
      if (!medicoCriado) throw new Error('Não foi possível recuperar o ID do médico criado.');

      // Inserir Prescrições
      const painelRecords = [];
      for (const resumo of resumos) {
        for (const det of resumo.detalhes) {
          if (det.quantidade > 0) {
            painelRecords.push({
              medico_id: medicoCriado.id,
              rep_id: repId,
              trimestre: resumo.trimestre,
              molecula: resumo.molecula,
              marca: det.marca,
              laboratorio: det.laboratorio,
              quantidade: det.quantidade,
              eh_minhas_marca: det.ehMinhasMarca
            });
          }
        }
      }

      if (painelRecords.length > 0) {
        const { error: painelError } = await supabase.from('painel_prescritivo').insert(painelRecords);
        if (painelError) throw painelError;
      }

      setMessage({ type: 'success', text: 'Médico Sirius e prescrições cadastrados com sucesso!' });
      setTimeout(() => router.push('/'), 1500);
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao cadastrar médico.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 relative">
      <div className="max-w-4xl mx-auto">
        
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
            <p className="text-slate-500 font-medium">Cadastramento completo de profissional e potencial prescritivo.</p>
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
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">CRM</label>
                <input
                  required
                  type="text"
                  className={`w-full px-6 py-4 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-600 outline-none font-bold transition-all ${crmError ? 'ring-2 ring-red-500' : ''}`}
                  placeholder="Ex: 12345-CE"
                  value={formData.crm}
                  onChange={(e) => {
                    setFormData({ ...formData, crm: e.target.value });
                    setCrmError(null);
                  }}
                  onBlur={checkCrm}
                />
                {crmError && <span className="text-xs font-bold text-red-500 mt-1 block">{crmError}</span>}
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

              <div className="space-y-2 md:col-span-2">
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
            </div>

            {/* Rotas */}
            <div className="space-y-4 pt-6 border-t border-slate-50">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Map size={14} /> Rotas <span className="text-red-400">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {ROTAS_DISPONIVEIS.map(rota => {
                  const isSelected = rotas.includes(rota);
                  return (
                    <button
                      key={rota}
                      type="button"
                      onClick={() => toggleRota(rota)}
                      className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all border ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400 hover:text-blue-600'}`}
                    >
                      {rota}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Seção 2: Painel Prescritivo */}
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <BarChart2 size={20} />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Painel Prescritivo</h2>
              </div>
              <button
                type="button"
                onClick={() => catalogoDb.length > 0 ? openModal() : null}
                disabled={catalogoDb.length === 0}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all font-bold text-sm disabled:opacity-50"
              >
                <Plus size={16} /> Adicionar Produto
              </button>
            </div>

            {resumos.length === 0 ? (
              <div className="text-center py-10">
                <BarChart2 size={40} className="mx-auto text-slate-200 mb-3" />
                <p className="text-slate-400 font-medium">Nenhum dado prescritivo cadastrado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {resumos.map(res => {
                  const totalMercado = res.detalhes.reduce((acc, d) => acc + (d.quantidade || 0), 0);
                  const minhaMarcaQtd = res.detalhes.filter(d => d.ehMinhasMarca).reduce((acc, d) => acc + (d.quantidade || 0), 0);
                  const mShare = totalMercado > 0 ? (minhaMarcaQtd / totalMercado) * 100 : 0;
                  const mShareFormatted = mShare.toFixed(1);
                  
                  let shareColor = 'text-green-600 bg-green-50 border-green-200';
                  if (mShare < 30) shareColor = 'text-red-600 bg-red-50 border-red-200';
                  else if (mShare <= 60) shareColor = 'text-yellow-600 bg-yellow-50 border-yellow-200';

                  return (
                    <div key={res.id} className="flex flex-col md:flex-row items-center justify-between p-5 border border-slate-200 rounded-2xl bg-white shadow-sm gap-4">
                      <div className="flex flex-wrap gap-x-8 gap-y-4 items-center flex-1 w-full">
                        <div className="min-w-[120px]">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Molécula</p>
                          <p className="font-bold text-slate-800">{res.molecula}</p>
                        </div>
                        <div className="min-w-[80px]">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trimestre</p>
                          <p className="font-bold text-slate-800">{res.trimestre}</p>
                        </div>
                        <div className="min-w-[100px]">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Minha Marca</p>
                          <p className="font-bold text-blue-600">{minhaMarcaQtd} pts</p>
                        </div>
                        <div className="min-w-[100px]">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mercado</p>
                          <p className="font-bold text-slate-600">{totalMercado} pts</p>
                        </div>
                        <div className="min-w-[80px]">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Share</p>
                          <span className={`px-2 py-1 rounded-lg font-bold text-xs border ${shareColor}`}>{mShareFormatted}%</span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto justify-end">
                        <button type="button" onClick={() => openModal(res)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Edit2 size={18} /></button>
                        <button type="button" onClick={() => setResumos(prev => prev.filter(r => r.id !== res.id))} className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {message && (
            <div className={`p-6 rounded-2xl text-sm font-bold flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
              {message.text}
            </div>
          )}

          <div className="flex justify-end pt-4 pb-12">
            <button
              disabled={loading || crmError !== null}
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

        {/* Modal de Preenchimento do Painel */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex justify-center items-center p-4 md:p-6">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-slate-900/20">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="font-black text-2xl text-slate-800">Registrar Prescrições</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Preencha o potencial do médico por molécula.</p>
                </div>
              </div>
              
              <div className="p-8 flex-1 overflow-y-auto space-y-8 bg-slate-50/50">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Molécula</label>
                    <select 
                      value={modalData.molecula} 
                      onChange={e => handleModalMoleculaChange(e.target.value)} 
                      className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none font-bold text-slate-700 transition-all appearance-none"
                    >
                      {catalogoDb.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Trimestre</label>
                    <select 
                      value={modalData.trimestre} 
                      onChange={e => handleModalTrimestreChange(e.target.value)} 
                      className="w-full px-5 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-600 outline-none font-bold text-slate-700 transition-all appearance-none"
                    >
                      {TRIMESTRES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Marcas e Quantidades</h4>
                  {modalData.detalhes.map((det, i) => (
                    <div key={i} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${det.ehMinhasMarca ? 'bg-blue-50 border-2 border-blue-200 shadow-sm' : 'bg-white border border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                          <span className={`font-bold text-base ${det.ehMinhasMarca ? 'text-blue-800' : 'text-slate-700'}`}>{det.marca}</span>
                          <span className="text-xs font-medium text-slate-500">({det.laboratorio})</span>
                          {det.ehMinhasMarca && <span className="bg-blue-600 text-white text-[10px] px-2.5 py-1 rounded-full font-black tracking-widest">EMS</span>}
                        </div>
                        <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            min="0" 
                            value={det.quantidade === 0 ? '' : det.quantidade} 
                            placeholder="0"
                            onChange={e => {
                              const val = parseInt(e.target.value) || 0;
                              setModalData(prev => {
                                const newD = [...prev.detalhes];
                                newD[i] = { ...newD[i], quantidade: val >= 0 ? val : 0 };
                                return { ...prev, detalhes: newD };
                              });
                            }} 
                            className="w-24 px-4 py-3 text-center font-bold text-lg rounded-xl border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all" 
                          />
                          {!det.ehMinhasMarca && (
                            <button type="button" onClick={() => {
                                setModalData(prev => ({ ...prev, detalhes: prev.detalhes.filter((_, idx) => idx !== i) }));
                            }} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500 rounded-lg transition-colors">
                               <X size={18} />
                            </button>
                          )}
                        </div>
                    </div>
                  ))}

                  {/* Add Competitor */}
                  {!isAddingCompetitor ? (
                    <button type="button" onClick={() => setIsAddingCompetitor(true)} className="flex items-center justify-center gap-2 mt-4 px-4 py-4 text-sm font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all w-full border-2 border-dashed border-slate-200 hover:border-blue-200">
                      <Plus size={18} /> Adicionar Concorrente
                    </button>
                  ) : (
                    <div className="mt-4 p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                       <select value={competitorSelect} onChange={e => setCompetitorSelect(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500">
                         <option value="">Selecione um concorrente do catálogo...</option>
                         {catalogoDb.find(m => m.nome === modalData.molecula)?.marcas
                           .filter(m => !modalData.detalhes.find(d => d.marca === m.nome))
                           .map(m => (
                             <option key={m.id} value={m.id}>{m.nome} ({m.laboratorio})</option>
                           ))}
                         <option value="novo" className="font-bold text-blue-600">+ Outro (novo concorrente para {modalData.molecula})</option>
                       </select>

                       {competitorSelect === 'novo' ? (
                         <div className="space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex gap-4">
                              <input type="text" placeholder="Nome da marca" value={newCompetitorForm.nome} onChange={e => setNewCompetitorForm({...newCompetitorForm, nome: e.target.value})} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-slate-50" />
                              <input type="text" placeholder="Lab (Ex: EMS)" value={newCompetitorForm.laboratorio} onChange={e => setNewCompetitorForm({...newCompetitorForm, laboratorio: e.target.value})} className="w-32 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-slate-50" />
                            </div>
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer">
                               <input type="checkbox" checked={newCompetitorForm.ehMinhasMarca} onChange={e => setNewCompetitorForm({...newCompetitorForm, ehMinhasMarca: e.target.checked})} className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500" />
                               É produto da sua linha? (Excepcional)
                            </label>
                            <div className="flex gap-3 pt-2">
                               <button type="button" onClick={() => { setCompetitorSelect(''); setNewCompetitorForm({nome:'',laboratorio:'',ehMinhasMarca:false}); }} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancelar Novo</button>
                               <button type="button" onClick={handleSaveNewCompetitor} disabled={!newCompetitorForm.nome || !newCompetitorForm.laboratorio} className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">Salvar no Catálogo</button>
                            </div>
                         </div>
                       ) : (
                         <div className="flex gap-3">
                            <button type="button" onClick={() => { setIsAddingCompetitor(false); setCompetitorSelect(''); }} className="flex-1 py-3 font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancelar</button>
                            <button type="button" onClick={handleAddExistingCompetitor} disabled={!competitorSelect} className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">Adicionar à Sessão</button>
                         </div>
                       )}
                    </div>
                  )}

                </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-1">Total do Mercado</span>
                  <span className="font-black text-2xl text-slate-800">{modalData.detalhes.reduce((acc, d) => acc + (d.quantidade || 0), 0)} pts</span>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                  <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-8 py-4 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-700 rounded-2xl transition-all">Cancelar</button>
                  <button type="button" onClick={saveModal} className="flex-1 px-8 py-4 font-black bg-blue-600 text-white hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-200 transition-all transform active:scale-95">Salvar</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
