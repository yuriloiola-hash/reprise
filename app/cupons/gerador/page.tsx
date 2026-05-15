'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { 
  Ticket, Download, List, Image as ImageIcon, 
  Settings2, Loader2, ArrowLeft, RefreshCw,
  Plus, Check, Share2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GeradorCupons() {
  const router = useRouter();
  const [cuponsText, setCuponsText] = useState('');
  const [bgImage, setBgImage] = useState<string | null>('/templates/durma_bem_gts.png');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [qrPos, setQrPos] = useState({ x: 22, y: 35, size: 85 }); // Posição para o QR Code da esquerda
  const [textPos, setTextPos] = useState({ x: 50, y: 55, size: 50 }); // Posição central para o código
  
  const couponRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cuponsList = cuponsText.split('\n').filter(line => line.trim() !== '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadCoupon = async (code: string) => {
    if (!couponRef.current) return;
    
    // Temporariamente setar o código no DOM
    const codeElement = document.getElementById('coupon-code-display');
    if (codeElement) codeElement.innerText = code;

    const canvas = await html2canvas(couponRef.current, {
      scale: 3, // Alta qualidade
      useCORS: true,
      backgroundColor: null,
    });

    const link = document.createElement('a');
    link.download = `cupom-${code}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const generateAll = async () => {
    if (cuponsList.length === 0 || !bgImage) {
      alert('Insira a lista de cupons e a imagem de fundo.');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    for (let i = 0; i < cuponsList.length; i++) {
      const code = cuponsList[i];
      await downloadCoupon(code);
      setProgress(Math.round(((i + 1) / cuponsList.length) * 100));
      // Pequeno delay para não travar o browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsGenerating(false);
    setProgress(0);
  };

  return (
    <div className="bg-[#F4F7FA] min-h-screen pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-border px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-brand font-bold text-lg text-brand-text">Gerador Sirius</h1>
            <p className="text-[10px] font-brand font-bold text-brand-primary uppercase tracking-widest">Cupons Patz Dinâmicos</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isGenerating && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-bg rounded-lg border border-brand-border">
              <Loader2 size={14} className="animate-spin text-brand-primary" />
              <span className="text-xs font-bold font-brand text-brand-text">{progress}%</span>
            </div>
          )}
          <button 
            onClick={generateAll}
            disabled={isGenerating || !bgImage || cuponsList.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-xl font-brand font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
          >
            <Download size={18} />
            {isGenerating ? 'GERANDO...' : 'BAIXAR TODOS'}
          </button>
        </div>
      </header>

      <main className="p-6 max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna Esquerda: Configurações */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Imagem de Fundo */}
          <section className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 font-brand font-bold text-sm text-brand-text uppercase tracking-wider">
              <ImageIcon size={18} className="text-brand-primary" /> 1. Template de Fundo
            </h3>
            
            {!bgImage ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-all group"
              >
                <div className="w-12 h-12 bg-brand-bg rounded-full flex items-center justify-center text-brand-text-muted group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <p className="text-xs font-brand font-bold text-brand-text-muted uppercase tracking-widest">Carregar Imagem Patz</p>
              </div>
            ) : (
              <div className="relative group">
                <img src={bgImage} className="w-full rounded-xl border border-brand-border" alt="Template" />
                <button 
                  onClick={() => setBgImage(null)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </section>

          {/* 2. Lista de Cupons */}
          <section className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 font-brand font-bold text-sm text-brand-text uppercase tracking-wider">
              <List size={18} className="text-brand-primary" /> 2. Lista de Códigos
            </h3>
            <textarea 
              placeholder="Cole os cupons aqui (um por linha)...&#10;999123456&#10;999654321"
              rows={8}
              className="w-full p-4 bg-brand-bg border border-brand-border rounded-2xl text-sm font-mono outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all resize-none"
              value={cuponsText}
              onChange={(e) => setCuponsText(e.target.value)}
            />
            <div className="flex justify-between items-center text-[10px] font-brand font-bold text-brand-text-muted uppercase">
              <span>Total de Cupons: {cuponsList.length}</span>
              <span className="text-emerald-600 flex items-center gap-1"><Check size={12} /> {cuponsList.length} prontos</span>
            </div>
          </section>

          {/* 3. Ajustes de Posição */}
          <section className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm space-y-6">
            <h3 className="flex items-center gap-2 font-brand font-bold text-sm text-brand-text uppercase tracking-wider">
              <Settings2 size={18} className="text-brand-primary" /> 3. Ajuste de Layout
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest">Posição QR Code (X/Y %)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={qrPos.x} onChange={e => setQrPos(p => ({...p, x: Number(e.target.value)}))} className="p-2 bg-brand-bg border border-brand-border rounded-lg text-xs font-bold" />
                  <input type="number" value={qrPos.y} onChange={e => setQrPos(p => ({...p, y: Number(e.target.value)}))} className="p-2 bg-brand-bg border border-brand-border rounded-lg text-xs font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest">Posição do Texto (X/Y %)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={textPos.x} onChange={e => setTextPos(p => ({...p, x: Number(e.target.value)}))} className="p-2 bg-brand-bg border border-brand-border rounded-lg text-xs font-bold" />
                  <input type="number" value={textPos.y} onChange={e => setTextPos(p => ({...p, y: Number(e.target.value)}))} className="p-2 bg-brand-bg border border-brand-border rounded-lg text-xs font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-brand font-bold text-brand-text-muted uppercase tracking-widest">Tamanho da Fonte</label>
                <input type="range" min="10" max="100" value={textPos.size} onChange={e => setTextPos(p => ({...p, size: Number(e.target.value)}))} className="w-full accent-brand-primary" />
              </div>
            </div>
          </section>
        </div>

        {/* Coluna Direita: Preview Realtime */}
        <div className="lg:col-span-8">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-brand font-bold text-sm text-brand-text uppercase tracking-wider">Preview Final</h3>
              <span className="text-[10px] font-sans text-brand-text-muted italic">Ajuste os valores para alinhar perfeitamente</span>
            </div>

            <div className="bg-slate-200 p-8 rounded-[32px] flex items-center justify-center min-h-[500px] border-2 border-brand-border shadow-inner">
              {bgImage ? (
                <div 
                  ref={couponRef}
                  className="relative shadow-2xl overflow-hidden"
                  style={{ width: '600px', aspectRatio: '1/1' }}
                >
                  <img src={bgImage} className="w-full h-full object-contain" alt="Preview" />
                  
                  {/* QR Code Layer */}
                  <div 
                    className="absolute bg-white p-1 rounded-sm shadow-sm"
                    style={{ 
                      left: `${qrPos.x}%`, 
                      top: `${qrPos.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${qrPos.size}px`,
                      height: `${qrPos.size}px`
                    }}
                  >
                    <QRCodeSVG 
                      value="https://www.emssaude.com.br/durmabem" 
                      size={qrPos.size - 8}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  {/* Coupon Code Layer */}
                  <div 
                    id="coupon-code-display"
                    className="absolute font-brand font-extrabold text-brand-text text-center"
                    style={{ 
                      left: `${textPos.x}%`, 
                      top: `${textPos.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${textPos.size}px`,
                      whiteSpace: 'nowrap',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {cuponsList[0] || 'CÓDIGO AQUI'}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <Ticket size={64} className="text-slate-300 mx-auto" />
                  <p className="text-slate-400 font-brand font-bold text-sm uppercase tracking-widest">Carregue o fundo para ver o preview</p>
                </div>
              )}
            </div>

            {bgImage && (
              <div className="bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10 flex items-center gap-3">
                <Share2 size={20} className="text-brand-primary" />
                <p className="text-xs font-brand font-bold text-brand-text">
                  Dica: Use cupons de teste para alinhar o QR Code e o Código antes de processar toda a lista.
                </p>
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
