'use client';

import React, { useState } from 'react';
import { useImport, TODAS_CIDADES, MedicoRow, Disponibilidade } from '../../hooks/useImport';
import DisponibilidadeModal from './DisponibilidadeModal';
import { Trash2, CheckCircle2, AlertCircle, XCircle, ArrowRight, Play, UploadCloud, Loader2, Lock } from 'lucide-react';

export default function ImportWizard() {
  const { rows, handlePaste, updateRow, removeRow, loadExample, importRows, isImporting, progress } = useImport();
  const [step, setStep] = useState(1);
  const [ignoreErrors, setIgnoreErrors] = useState(false);
  const [pasteText, setPasteText] = useState('');
  
  // Modal state
  const [editingDispId, setEditingDispId] = useState<string | null>(null);

  const onNextStep1 = () => {
    handlePaste(pasteText);
    setStep(2);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle2 className="text-emerald-500" size={18} />;
      case 'incompleto': return <AlertCircle className="text-amber-500" size={18} />;
      case 'erro': return <XCircle className="text-red-500" size={18} />;
      default: return null;
    }
  };

  const counts = {
    ok: rows.filter(r => r.status === 'ok').length,
    incompleto: rows.filter(r => r.status === 'incompleto').length,
    erro: rows.filter(r => r.status === 'erro').length,
  };

  const handleExecuteImport = async () => {
    await importRows(ignoreErrors);
    setStep(4); // Finished
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 font-sans">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <UploadCloud className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-brand font-bold text-slate-800">Assistente de Importação</h1>
          <p className="text-sm text-slate-500 font-medium">Copie do Excel e cole direto no REPrise</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2 rounded-full"></div>
        <div className="absolute top-1/2 left-0 h-1 bg-indigo-600 -z-10 -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${(step - 1) * 33.33}%` }}></div>
        
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-4 transition-colors ${step >= s ? 'bg-indigo-600 border-indigo-100 text-white' : 'bg-slate-100 border-white text-slate-400'}`}>
            {s}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-brand-border space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-brand font-bold text-slate-800">1. Colar Dados</h2>
            <button onClick={loadExample} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
              Usar dados de exemplo
            </button>
          </div>
          <p className="text-sm text-slate-600">Copie as células do seu Excel ou Google Sheets (incluindo o cabeçalho na primeira linha) e cole na caixa abaixo.</p>
          
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            placeholder="Cole aqui (ex: Nome | Categoria | Especialidade | Cidade | Clínica | Dias | Turno)..."
            className="w-full h-64 p-4 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 whitespace-pre"
          />
          
          <div className="flex justify-end">
            <button 
              onClick={onNextStep1}
              disabled={pasteText.trim() === ''}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Processar Dados <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-brand-border overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <div>
              <h2 className="text-lg font-brand font-bold text-slate-800">2. Revisão</h2>
              <p className="text-sm text-slate-500 font-medium">{counts.ok} de {rows.length} prontos para importar</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={14}/> {counts.ok} Prontos</span>
                <span className="flex items-center gap-1 text-amber-600"><AlertCircle size={14}/> {counts.incompleto} Incompletos</span>
                <span className="flex items-center gap-1 text-red-600"><XCircle size={14}/> {counts.erro} Erros</span>
              </div>
              <button 
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 transition-all"
              >
                Avançar <ArrowRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 w-10">St</th>
                  <th className="px-4 py-3 w-36">
                    <span className="flex items-center gap-1">CRM <Lock size={10} className="text-slate-400" /></span>
                  </th>
                  <th className="px-4 py-3 min-w-[200px]">Nome <span className="text-red-500">*</span></th>
                  <th className="px-4 py-3 w-32">Cat. <span className="text-amber-500">*</span></th>
                  <th className="px-4 py-3 min-w-[150px]">Especialidade <span className="text-amber-500">*</span></th>
                  <th className="px-4 py-3 w-40">Cidade <span className="text-amber-500">*</span></th>
                  <th className="px-4 py-3 w-48">Rotas (Auto)</th>
                  <th className="px-4 py-3 min-w-[150px]">Clínica</th>
                  <th className="px-4 py-3 min-w-[120px]">Dias</th>
                  <th className="px-4 py-3 min-w-[150px]">Disponibilidade</th>
                  <th className="px-4 py-3 w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(row => (
                  <tr key={row._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">{getStatusIcon(row.status)}</td>
                    <td className="px-4 py-2">
                      {/* CRM is immutable — shown as read-only badge */}
                      <div className={`flex items-center gap-1 px-2 py-1 rounded font-mono text-sm font-bold ${
                        !row.crm || !/^\d+$/.test(row.crm) 
                          ? 'bg-red-50 text-red-600 border border-red-200' 
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        <Lock size={10} className="text-slate-400 flex-shrink-0" />
                        {row.crm || <span className="text-red-400 italic text-xs">Obrig.</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={row.nome} 
                        onChange={e => updateRow(row._id, { nome: e.target.value })}
                        className={`w-full px-2 py-1.5 border rounded outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${!row.nome ? 'border-red-300 bg-red-50' : 'border-transparent hover:border-slate-300 bg-transparent'}`}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select 
                        value={row.categoria} 
                        onChange={e => updateRow(row._id, { categoria: e.target.value })}
                        className={`w-full px-2 py-1.5 border rounded outline-none focus:border-indigo-500 bg-transparent ${!row.categoria ? 'border-amber-300 bg-amber-50' : 'border-transparent hover:border-slate-300'}`}
                      >
                        <option value="">Selecione</option>
                        <option value="Q1">Q1</option>
                        <option value="Q2">Q2</option>
                        <option value="Q3">Q3</option>
                        <option value="Q4">Q4</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={row.especialidade} 
                        onChange={e => updateRow(row._id, { especialidade: e.target.value })}
                        className={`w-full px-2 py-1.5 border rounded outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-transparent ${!row.especialidade ? 'border-amber-300 bg-amber-50' : 'border-transparent hover:border-slate-300'}`}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <select 
                        value={row.cidade} 
                        onChange={e => updateRow(row._id, { cidade: e.target.value })}
                        className={`w-full px-2 py-1.5 border rounded outline-none focus:border-indigo-500 bg-transparent ${!row.cidade ? 'border-amber-300 bg-amber-50' : 'border-transparent hover:border-slate-300'}`}
                      >
                        <option value="">Selecione</option>
                        {TODAS_CIDADES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1 flex-wrap">
                        {row.rotas.length === 0 && <span className="text-xs text-slate-400">Nenhuma</span>}
                        {row.rotas.map(rota => (
                          <span key={rota} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-semibold">{rota}</span>
                        ))}
                        {row.flags.multiRota && <span title="Multi-Rota" className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-xs font-semibold">🌎</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={row.clinica} 
                        onChange={e => updateRow(row._id, { clinica: e.target.value })}
                        className="w-full px-2 py-1.5 border border-transparent hover:border-slate-300 rounded outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={row.dias_visita.join(', ')} 
                        onChange={e => updateRow(row._id, { dias_visita: e.target.value.split(',').map(s=>s.trim()).filter(Boolean) })}
                        placeholder="Segunda, Quarta..."
                        className="w-full px-2 py-1.5 border border-transparent hover:border-slate-300 rounded outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-transparent"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <button 
                        onClick={() => setEditingDispId(row._id)}
                        className="px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-xs font-semibold transition-colors"
                      >
                        Editar ({row.disponibilidade.tipo === 'turno' ? 'Grade' : 'Horários'})
                      </button>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button onClick={() => removeRow(row._id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-8 text-slate-500">Nenhum dado processado. Volte ao passo 1.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Disponibilidade */}
      {editingDispId && (
        <DisponibilidadeModal 
          initialValue={rows.find(r => r._id === editingDispId)!.disponibilidade}
          onSave={(disp) => {
            updateRow(editingDispId, { disponibilidade: disp });
            setEditingDispId(null);
          }}
          onClose={() => setEditingDispId(null)}
        />
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-border text-center space-y-6 animate-in fade-in zoom-in-95">
          <h2 className="text-2xl font-brand font-bold text-slate-800">Confirmar Importação</h2>
          
          <div className="flex justify-center gap-6">
            <div className="p-4 bg-emerald-50 rounded-xl w-32 border border-emerald-100">
              <div className="text-3xl font-black text-emerald-600">{counts.ok}</div>
              <div className="text-xs font-bold text-emerald-800 uppercase mt-1">Prontos</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl w-32 border border-amber-100">
              <div className="text-3xl font-black text-amber-600">{counts.incompleto}</div>
              <div className="text-xs font-bold text-amber-800 uppercase mt-1">Incompletos</div>
            </div>
            <div className="p-4 bg-red-50 rounded-xl w-32 border border-red-100">
              <div className="text-3xl font-black text-red-600">{counts.erro}</div>
              <div className="text-xs font-bold text-red-800 uppercase mt-1">Erros / Vazios</div>
            </div>
          </div>

          <label className="flex items-center justify-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={ignoreErrors} 
              onChange={e => setIgnoreErrors(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            Ignorar registros Incompletos/Com Erro e importar apenas os <b>Prontos</b>.
          </label>

          {isImporting && (
            <div className="w-full max-w-md mx-auto space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Salvando no banco de dados...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4 pt-4">
            <button 
              onClick={() => setStep(2)}
              disabled={isImporting}
              className="px-6 py-2.5 text-slate-600 font-bold text-sm hover:bg-slate-50 rounded-lg transition-colors disabled:opacity-50"
            >
              Voltar e Editar
            </button>
            <button 
              onClick={handleExecuteImport}
              disabled={isImporting || (!ignoreErrors && (counts.incompleto > 0 || counts.erro > 0)) || rows.length === 0}
              className="flex items-center gap-2 px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-md"
            >
              {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
              Executar Importação
            </button>
          </div>
          {(!ignoreErrors && (counts.incompleto > 0 || counts.erro > 0)) && (
            <p className="text-xs text-red-500 font-medium">Resolva os erros no passo anterior ou marque a caixa para ignorá-los.</p>
          )}
        </div>
      )}

      {/* STEP 4 */}
      {step === 4 && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-border space-y-6 animate-in fade-in zoom-in-95">
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-2xl font-brand font-bold text-slate-800">Processo Finalizado</h2>
            <p className="text-sm text-slate-500 mt-1">Veja abaixo o resultado da importação.</p>
          </div>
          
          <div className="max-h-96 overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100">
            {rows.map(row => (
              <div key={row._id} className="p-3 flex items-start gap-3 text-sm">
                <div className="mt-0.5">
                  {row.status === 'ok' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-red-500" />}
                </div>
                <div>
                  <div className="font-semibold text-slate-800">{row.nome || '(Sem nome)'}</div>
                  {row.status === 'erro' && row.dbError && (
                    <div className="text-xs text-red-600 font-mono mt-1 bg-red-50 px-2 py-1 rounded">Erro: {row.dbError}</div>
                  )}
                  {row.status !== 'ok' && !row.dbError && (
                    <div className="text-xs text-amber-600 mt-1">Registro não importado (incompleto/ignorado).</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <button 
              onClick={() => { setStep(1); setPasteText(''); }}
              className="px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold text-sm transition-colors"
            >
              Nova Importação
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
