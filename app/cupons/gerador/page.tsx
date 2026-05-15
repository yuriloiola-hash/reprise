'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { 
  Ticket, Download, List, Settings2, Loader2, ArrowLeft,
  Plus, Check, Share2, Trash2, Smartphone, Handshake,
  Layers
} from 'lucide-react';
import { useRouter } from 'next/navigation';

type ThemeType = 'gts' | 'cp';

const THEMES = {
  gts: {
    label: 'Gotas (GTS)',
    brand: 'GTS',
    accent: '#00D1FF',
    medText: 'SOL 10MG 20ML',
    bg: '#001D4A'
  },
  cp: {
    label: 'Comprimido (CP)',
    brand: 'CP',
    accent: '#FF9F43',
    medText: '10MG C/ 20 CPRS',
    bg: '#001D4A'
  }
};

export default function GeradorCupons() {
  const router = useRouter();
  const [cuponsText, setCuponsText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [viewType, setViewType] = useState<'individual' | 'lista'>('individual');
  const [theme, setTheme] = useState<ThemeType>('gts');
  
  const couponRef = useRef<HTMLDivElement>(null);
  const cuponsList = cuponsText.split('\n').filter(line => line.trim() !== '');

  const activeTheme = THEMES[theme];

  const generateImage = async (filename: string) => {
    if (!couponRef.current) return;
    setIsGenerating(true);
    const canvas = await html2canvas(couponRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });
    const link = document.createElement('a');
    link.download = `${filename}-${theme}.png`;
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
            <h1 className="font-brand font-bold text-lg text-brand-text">Gerador Sirius Multi-Apresentação</h1>
            <p className="text-[10px] font-brand font-bold text-brand-primary uppercase tracking-widest">Patz GTS & Comprimido</p>
          </div>
        </div>
        <button 
          onClick={() => generateImage(`cupom-sirius-${theme}`)}
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
          
          {/* Theme Selector */}
          <section className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 font-brand font-bold text-sm text-brand-text uppercase tracking-wider">
              <Layers size={18} className="text-brand-primary" /> Apresentação Sirius
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(THEMES) as ThemeType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                    theme === t 
                      ? 'border-brand-primary bg-brand-primary/5 shadow-md' 
                      : 'border-brand-border hover:border-brand-primary/30'
                  }`}
                >
                  <div 
                    className="w-10 h-10 rounded-full mb-2 flex items-center justify-center text-white font-black text-xs"
                    style={{ backgroundColor: THEMES[t].accent }}
                  >
                    {THEMES[t].brand}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === t ? 'text-brand-primary' : 'text-brand-text-muted'}`}>
                    {THEMES[t].label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-brand font-bold text-sm text-brand-text uppercase tracking-wider">
                <List size={18} className="text-brand-primary" /> Lista de Cupons
              </h3>
              <span className="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded">
                {cuponsList.length} CÓDIGOS
              </span>
            </div>
            <textarea 
              placeholder="Digite um código por linha..."
              rows={8}
              className="w-full p-4 bg-brand-bg border border-brand-border rounded-2xl text-sm font-mono outline-none focus:ring-2 focus:ring-brand-primary/20"
              value={cuponsText}
              onChange={(e) => setCuponsText(e.target.value)}
            />
          </section>

          <section 
            className="p-6 rounded-[24px] text-white space-y-3 transition-colors duration-500 shadow-xl"
            style={{ backgroundColor: activeTheme.accent }}
          >
            <h4 className="font-brand font-bold text-sm uppercase flex items-center gap-2 text-[#001D4A]">
              <Check size={18} /> Resumo do Layout
            </h4>
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-[#001D4A]/80 uppercase">Apresentação Selecionada:</p>
              <p className="text-lg font-brand font-black text-[#001D4A] tracking-tight">{activeTheme.label}</p>
              <div className="bg-[#001D4A]/10 p-2 rounded-lg border border-[#001D4A]/10 mt-2">
                <p className="text-[10px] text-[#001D4A] font-medium leading-relaxed italic">
                  Texto Automático: "selecione a opção: <span className="font-black">"{activeTheme.medText}"</span>"
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-brand font-bold text-sm text-brand-text uppercase tracking-wider">Visualização em Tempo Real</h3>
            <div className="flex bg-white rounded-lg p-1 border border-brand-border shadow-sm">
              <button 
                onClick={() => setViewType('individual')}
                className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewType === 'individual' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-text-muted hover:bg-slate-50'}`}
              >
                CUPOM ÚNICO
              </button>
              <button 
                onClick={() => setViewType('lista')}
                className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${viewType === 'lista' ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-text-muted hover:bg-slate-50'}`}
              >
                CARTELA (LISTA)
              </button>
            </div>
          </div>

          <div className="bg-slate-300 p-8 rounded-[40px] flex items-center justify-center min-h-[600px] border-2 border-brand-border shadow-inner overflow-auto">
            <div 
              ref={couponRef}
              className="relative flex flex-col gap-8 shadow-2xl transition-colors duration-500"
              style={{ width: '900px', minHeight: '600px', backgroundColor: activeTheme.bg, padding: '40px' }}
            >
              {/* Header Branding */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <h2 
                    className="font-brand font-black text-5xl tracking-tighter leading-none transition-colors"
                    style={{ color: activeTheme.accent }}
                  >
                    Patz
                  </h2>
                  <h3 className="text-white font-brand font-bold text-3xl tracking-wide opacity-80 uppercase">{activeTheme.brand}</h3>
                </div>
                <div 
                  className="px-4 py-1.5 rounded-lg shadow-lg"
                  style={{ backgroundColor: activeTheme.accent }}
                >
                  <span className="text-[#001D4A] font-brand font-black text-sm uppercase">Programa Durma Bem</span>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-2 gap-10">
                {/* Paciente Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2.5 rounded-2xl shadow-xl border-2 border-slate-100">
                      <QRCodeSVG value="https://www.emssaude.com.br/durmabem" size={80} level="H" />
                    </div>
                    <div className="text-white">
                      <p 
                        className="text-[10px] font-brand font-bold uppercase tracking-[0.2em] transition-colors"
                        style={{ color: activeTheme.accent }}
                      >
                        Para o Paciente
                      </p>
                      <h4 className="text-xl font-brand font-bold">Instruções de Uso</h4>
                    </div>
                  </div>
                  <ol className="text-white/90 space-y-3">
                    {[
                      "Escaneie o QR Code ou acesse: www.emssaude.com.br/durmabem",
                      `Preencha o cupom e selecione a opção: "${activeTheme.medText}".`,
                      "Finalize o cadastro para conferir as farmácias credenciadas.",
                      "Apresente o cupom e a receita para obter o desconto Sirius."
                    ].map((step, i) => (
                      <li key={i} className="flex gap-4 text-[11px] font-medium leading-relaxed">
                        <span 
                          className="flex-shrink-0 w-5 h-5 text-[#001D4A] rounded-full flex items-center justify-center font-black text-[10px] shadow-sm"
                          style={{ backgroundColor: activeTheme.accent }}
                        >
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* PDV Column */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2.5 rounded-2xl shadow-xl border-2 border-slate-100">
                      <QRCodeSVG value="https://www.emssaude.com.br/durmabem" size={80} level="H" />
                    </div>
                    <div className="text-white">
                      <p 
                        className="text-[10px] font-brand font-bold uppercase tracking-[0.2em] transition-colors"
                        style={{ color: activeTheme.accent }}
                      >
                        Para o Balconista
                      </p>
                      <h4 className="text-xl font-brand font-bold">Ponto de Venda</h4>
                    </div>
                  </div>
                  <ol className="text-white/90 space-y-3">
                    {[
                      "Acesse o portal: www.portaldadrogaria.com.br",
                      "Vá em \"Apoio ao Consumidor\" e busque o produto Sirius.",
                      "Insira o número do cupom de desconto e o CPF do cliente.",
                      "O desconto aparecerá automaticamente no check-out."
                    ].map((step, i) => (
                      <li key={i} className="flex gap-4 text-[11px] font-medium leading-relaxed">
                        <span 
                          className="flex-shrink-0 w-5 h-5 text-[#001D4A] rounded-full flex items-center justify-center font-black text-[10px] shadow-sm"
                          style={{ backgroundColor: activeTheme.accent }}
                        >
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Dynamic Coupon Boxes Area */}
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-4 min-h-[140px]">
                {cuponsList.length > 0 ? (
                  viewType === 'individual' ? (
                    <div 
                      className="w-full max-w-md bg-white p-6 rounded-[32px] shadow-2xl flex flex-col items-center justify-center text-center border-4"
                      style={{ borderColor: activeTheme.accent }}
                    >
                      <p className="text-[10px] font-brand font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Código do Cupom</p>
                      <h3 className="text-5xl font-brand font-black text-[#001D4A] tracking-tighter">{cuponsList[0]}</h3>
                    </div>
                  ) : (
                    <div className="w-full grid grid-cols-2 gap-4">
                      {cuponsList.slice(0, 6).map((code, index) => (
                        <div 
                          key={index} 
                          className="bg-white p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center text-center border-2 animate-in zoom-in-95 duration-200"
                          style={{ borderColor: activeTheme.accent }}
                        >
                          <p className="text-[8px] font-brand font-bold text-slate-400 uppercase tracking-widest mb-0.5">Cupom {index + 1}</p>
                          <h3 className="text-3xl font-brand font-black text-[#001D4A] tracking-tight">{code}</h3>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="w-full max-w-md bg-white/5 border-2 border-dashed border-white/20 p-10 rounded-[32px] flex flex-col items-center justify-center">
                    <Ticket size={40} className="text-white/20 mb-4" />
                    <p className="text-white/30 font-brand font-bold uppercase text-[10px] tracking-widest">Aguardando códigos...</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-auto pt-6 border-t border-white/10 flex justify-center">
                <p 
                  className="px-6 py-1.5 rounded-full font-brand font-bold text-xs uppercase tracking-wider text-[#001D4A]"
                  style={{ backgroundColor: activeTheme.accent }}
                >
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
