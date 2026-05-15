'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { 
  Ticket, Download, List, Settings2, Loader2, ArrowLeft,
  Plus, Check, Share2, Trash2, Smartphone, Handshake
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GeradorCupons() {
  const router = useRouter();
  const [cuponsText, setCuponsText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewType, setViewType] = useState<'individual' | 'lista'>('individual');
  
  const couponRef = useRef<HTMLDivElement>(null);
  const cuponsList = cuponsText.split('\n').filter(line => line.trim() !== '');

  const generateImage = async (filename: string) => {
    if (!couponRef.current) return;
    setIsGenerating(true);
    const canvas = await html2canvas(couponRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsGenerating(false);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      <header className="sticky top-0 z-50 bg-white border-b border-brand-border px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-brand font-bold text-lg text-brand-text">Gerador Durma Bem GTS</h1>
            <p className="text-[10px] font-brand font-bold text-brand-primary uppercase tracking-widest">Layout 100% Digital & Editável</p>
          </div>
        </div>
        <button 
          onClick={() => generateImage('cupom-sirius')}
          disabled={isGenerating || cuponsList.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-brand font-bold text-sm hover:bg-blue-700 transition-all shadow-lg"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          GERAR IMAGEM
        </button>
      </header>

      <main className="p-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Settings */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-brand font-bold text-sm text-brand-text uppercase tracking-wider">
                <List size={18} className="text-brand-primary" /> Lista de Cupons
              </h3>
              <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded">
                {cuponsList.length} CUPONS
              </span>
            </div>
            <p className="text-[11px] text-brand-text-muted">Um código por linha. Cada linha gerará um campo no cartão.</p>
            <textarea 
              placeholder="Ex:&#10;999123456&#10;999888777"
              rows={10}
              className="w-full p-4 bg-brand-bg border border-brand-border rounded-2xl text-sm font-mono outline-none focus:ring-2 focus:ring-brand-primary/20"
              value={cuponsText}
              onChange={(e) => setCuponsText(e.target.value)}
            />
          </section>

          <section className="bg-blue-600 p-6 rounded-[24px] text-white space-y-3">
            <h4 className="font-brand font-bold text-sm uppercase flex items-center gap-2">
              <Check size={18} /> Instruções Corrigidas
            </h4>
            <p className="text-xs opacity-90 leading-relaxed">
              O layout agora é gerado via código (HTML/CSS), garantindo que os textos de orientação estejam 100% corretos conforme o manual da EMS.
            </p>
          </section>
        </div>

        {/* Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-brand font-bold text-sm text-brand-text uppercase tracking-wider">Preview Digital</h3>
            <div className="flex bg-white rounded-lg p-1 border border-brand-border">
              <button 
                onClick={() => setViewType('individual')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewType === 'individual' ? 'bg-brand-primary text-white' : 'text-brand-text-muted hover:bg-slate-50'}`}
              >
                UNITÁRIO
              </button>
              <button 
                onClick={() => setViewType('lista')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewType === 'lista' ? 'bg-brand-primary text-white' : 'text-brand-text-muted hover:bg-slate-50'}`}
              >
                LISTA COMPLETA
              </button>
            </div>
          </div>

          <div className="bg-slate-200 p-8 rounded-[40px] flex items-center justify-center min-h-[600px] border-2 border-brand-border shadow-inner overflow-auto">
            <div 
              ref={couponRef}
              className="relative bg-[#001D4A] p-10 flex flex-col gap-8 shadow-2xl"
              style={{ width: '900px', minHeight: '600px' }}
            >
              {/* Header Branding */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <h2 className="text-[#00D1FF] font-brand font-black text-5xl tracking-tighter leading-none">Patz</h2>
                  <h3 className="text-white font-brand font-bold text-3xl tracking-wide opacity-80">GTS</h3>
                </div>
                <div className="bg-[#00D1FF] px-4 py-1.5 rounded-lg">
                  <span className="text-[#001D4A] font-brand font-black text-sm uppercase">Durma Bem</span>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-2 gap-10">
                {/* Paciente Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl shadow-lg">
                      <QRCodeSVG value="https://www.emssaude.com.br/durmabem" size={80} />
                    </div>
                    <div className="text-white">
                      <p className="text-[10px] font-brand font-bold uppercase tracking-widest text-[#00D1FF]">Paciente</p>
                      <h4 className="text-lg font-brand font-bold">Orientações</h4>
                    </div>
                  </div>
                  <ol className="text-white/90 space-y-2.5">
                    {[
                      "Escaneie o QR Code ou acesse: www.emssaude.com.br/durmabem",
                      "Preencha o cupom com o código e selecione \"SOL 10MG 20ML\".",
                      "Finalize o cadastro para conferir a farmácia mais próxima.",
                      "Apresente o cupom e a receita na farmácia escolhida."
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3 text-[11px] font-medium leading-snug">
                        <span className="flex-shrink-0 w-5 h-5 bg-[#00D1FF] text-[#001D4A] rounded-full flex items-center justify-center font-black text-[10px]">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* PDV Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl shadow-lg">
                      <QRCodeSVG value="https://www.emssaude.com.br/durmabem" size={80} />
                    </div>
                    <div className="text-white">
                      <p className="text-[10px] font-brand font-bold uppercase tracking-widest text-[#00D1FF]">Ponto de Venda</p>
                      <h4 className="text-lg font-brand font-bold">Farmácia</h4>
                    </div>
                  </div>
                  <ol className="text-white/90 space-y-2.5">
                    {[
                      "Acesse: www.portaldadrogaria.com.br",
                      "Selecione \"Apoio ao Consumidor\" e pesquise o produto.",
                      "Digite o número do cupom e o CPF do comprador.",
                      "Finalize para receber os descontos no check-out."
                    ].map((step, i) => (
                      <li key={i} className="flex gap-3 text-[11px] font-medium leading-snug">
                        <span className="flex-shrink-0 w-5 h-5 bg-[#00D1FF] text-[#001D4A] rounded-full flex items-center justify-center font-black text-[10px]">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Dynamic Coupon Boxes Area */}
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6">
                {cuponsList.length > 0 ? (
                  viewType === 'individual' ? (
                    <div className="w-full max-w-md bg-white p-6 rounded-[24px] shadow-2xl transform rotate-1 border-4 border-[#00D1FF] flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-brand font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Código do Cupom</p>
                      <h3 className="text-4xl font-brand font-black text-[#001D4A] tracking-tighter">{cuponsList[0]}</h3>
                    </div>
                  ) : (
                    <div className="w-full grid grid-cols-2 gap-4">
                      {cuponsList.slice(0, 6).map((code, index) => (
                        <div key={index} className="bg-white p-4 rounded-2xl shadow-lg border-2 border-[#00D1FF] flex flex-col items-center justify-center text-center">
                          <p className="text-[8px] font-brand font-bold text-slate-400 uppercase tracking-widest mb-0.5">Cupom {index + 1}</p>
                          <h3 className="text-2xl font-brand font-black text-[#001D4A]">{code}</h3>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="w-full max-w-md bg-white/10 border-2 border-dashed border-white/20 p-8 rounded-[24px] flex flex-col items-center justify-center">
                    <Ticket size={40} className="text-white/20 mb-4" />
                    <p className="text-white/40 font-brand font-bold uppercase text-[10px] tracking-widest">Aguardando códigos...</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-auto pt-6 border-t border-white/10">
                <p className="text-center text-[#00D1FF] font-brand font-bold text-xs uppercase tracking-wide">
                  Atenção! O desconto é valido apenas para a 1º compra no CPF.
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
