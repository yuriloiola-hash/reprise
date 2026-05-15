'use client';

import { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { 
  Ticket, Download, List, Image as ImageIcon, 
  Settings2, Loader2, ArrowLeft, RefreshCw,
  Plus, Check, Share2, Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GeradorCupons() {
  const router = useRouter();
  const [cuponsText, setCuponsText] = useState('');
  const [bgImage, setBgImage] = useState<string | null>('/templates/durma_bem_gts.png');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Layout Settings
  const [qrLeftPos, setQrLeftPos] = useState({ x: 23.5, y: 31, size: 85 });
  const [qrRightPos, setQrRightPos] = useState({ x: 57.5, y: 31, size: 85 });
  const [textStartPos, setTextStartPos] = useState({ x: 50, y: 55, size: 45, spacing: 60 });
  const [showRightQR, setShowRightQR] = useState(true);

  const couponRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cuponsList = cuponsText.split('\n').filter(line => line.trim() !== '');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setBgImage(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateImage = async (filename: string) => {
    if (!couponRef.current) return;
    const canvas = await html2canvas(couponRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
    });
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="bg-[#F4F7FA] min-h-screen pb-20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-border px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="font-brand font-bold text-lg text-brand-text">Gerador Sirius v2</h1>
            <p className="text-[10px] font-brand font-bold text-brand-primary uppercase tracking-widest text-brand-primary">Cupons Dinâmicos & Listas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => generateImage('cartela-cupons')}
            disabled={isGenerating || !bgImage || cuponsList.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-xl font-brand font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
          >
            <Download size={18} />
            BAIXAR IMAGEM
          </button>
        </div>
      </header>

      <main className="p-6 max-w-[1500px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Settings Panel */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 font-brand font-bold text-sm text-brand-text uppercase tracking-wider">
              <ImageIcon size={18} className="text-brand-primary" /> Fundo do Cupom
            </h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="aspect-video border-2 border-dashed border-brand-border rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all overflow-hidden relative"
            >
              {bgImage ? (
                <>
                  <img src={bgImage} className="w-full h-full object-cover opacity-40" alt="Fundo" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20">
                    <RefreshCw size={24} className="text-brand-primary" />
                    <p className="text-[10px] font-bold mt-2">TROCAR FUNDO</p>
                  </div>
                </>
              ) : (
                <Plus size={24} className="text-slate-300" />
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </section>

          <section className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 font-brand font-bold text-sm text-brand-text uppercase tracking-wider">
              <List size={18} className="text-brand-primary" /> Lista de Códigos
            </h3>
            <textarea 
              placeholder="Digite ou cole os códigos...&#10;Um por linha."
              rows={6}
              className="w-full p-4 bg-brand-bg border border-brand-border rounded-2xl text-sm font-mono outline-none focus:ring-2 focus:ring-brand-primary/20"
              value={cuponsText}
              onChange={(e) => setCuponsText(e.target.value)}
            />
          </section>

          <section className="bg-white p-6 rounded-[24px] border border-brand-border shadow-sm space-y-6">
            <h3 className="flex items-center gap-2 font-brand font-bold text-sm text-brand-text uppercase tracking-wider">
              <Settings2 size={18} className="text-brand-primary" /> Ajustes Finos
            </h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-brand-bg rounded-xl space-y-3">
                <p className="text-[10px] font-brand font-bold text-brand-primary uppercase">Configurações de QR Code</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text-muted uppercase">Esq. (X %)</label>
                    <input type="number" step="0.5" value={qrLeftPos.x} onChange={e => setQrLeftPos(p => ({...p, x: Number(e.target.value)}))} className="w-full p-2 rounded-lg border border-brand-border text-xs font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text-muted uppercase">Dir. (X %)</label>
                    <input type="number" step="0.5" value={qrRightPos.x} onChange={e => setQrRightPos(p => ({...p, x: Number(e.target.value)}))} className="w-full p-2 rounded-lg border border-brand-border text-xs font-bold" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" checked={showRightQR} onChange={e => setShowRightQR(e.target.checked)} className="accent-brand-primary" />
                  <label className="text-[10px] font-bold text-brand-text uppercase">Mostrar QR da Direita</label>
                </div>
              </div>

              <div className="p-4 bg-brand-bg rounded-xl space-y-3">
                <p className="text-[10px] font-brand font-bold text-brand-primary uppercase">Configurações de Texto</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text-muted uppercase">Início Y (%)</label>
                    <input type="number" step="0.5" value={textStartPos.y} onChange={e => setTextStartPos(p => ({...p, y: Number(e.target.value)}))} className="w-full p-2 rounded-lg border border-brand-border text-xs font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-brand-text-muted uppercase">Espaçamento (px)</label>
                    <input type="number" value={textStartPos.spacing} onChange={e => setTextStartPos(p => ({...p, spacing: Number(e.target.value)}))} className="w-full p-2 rounded-lg border border-brand-border text-xs font-bold" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-brand-text-muted uppercase">Tamanho da Fonte</label>
                  <input type="range" min="10" max="100" value={textStartPos.size} onChange={e => setTextStartPos(p => ({...p, size: Number(e.target.value)}))} className="w-full accent-brand-primary" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Realtime Preview Panel */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-brand font-bold text-sm text-brand-text uppercase tracking-wider">Preview da Cartela</h3>
            <span className="text-[10px] font-sans text-brand-text-muted bg-amber-50 text-amber-700 px-2 py-1 rounded">Os códigos são gerados um abaixo do outro automaticamente</span>
          </div>

          <div className="bg-slate-300 p-12 rounded-[40px] flex items-center justify-center min-h-[600px] shadow-2xl border-4 border-white/50">
            {bgImage ? (
              <div 
                ref={couponRef}
                className="relative bg-white shadow-2xl overflow-hidden"
                style={{ width: '800px', aspectRatio: '1.414/1' }} // Proporção mais horizontal
              >
                <img src={bgImage} className="w-full h-full object-cover" alt="Template" />
                
                {/* QR Code Left */}
                <div 
                  className="absolute p-1 bg-white"
                  style={{ 
                    left: `${qrLeftPos.x}%`, 
                    top: `${qrLeftPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${qrLeftPos.size}px`,
                    height: `${qrLeftPos.size}px`
                  }}
                >
                  <QRCodeSVG value="https://www.emssaude.com.br/durmabem" size={qrLeftPos.size - 8} />
                </div>

                {/* QR Code Right (Optional) */}
                {showRightQR && (
                  <div 
                    className="absolute p-1 bg-white"
                    style={{ 
                      left: `${qrRightPos.x}%`, 
                      top: `${qrRightPos.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${qrRightPos.size}px`,
                      height: `${qrRightPos.size}px`
                    }}
                  >
                    <QRCodeSVG value="https://www.emssaude.com.br/durmabem" size={qrRightPos.size - 8} />
                  </div>
                )}

                {/* Dynamic Coupons List */}
                <div 
                  className="absolute w-full flex flex-col items-center"
                  style={{ 
                    top: `${textStartPos.y}%`,
                    left: '50%',
                    transform: 'translateX(-50%)'
                  }}
                >
                  {cuponsList.length > 0 ? cuponsList.map((code, index) => (
                    <div 
                      key={index}
                      className="font-brand font-extrabold text-brand-text text-center"
                      style={{ 
                        fontSize: `${textStartPos.size}px`,
                        height: `${textStartPos.spacing}px`,
                        lineHeight: `${textStartPos.spacing}px`,
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.05em',
                        marginTop: index > 0 ? '5px' : '0'
                      }}
                    >
                      {code}
                    </div>
                  )) : (
                    <div 
                      className="font-brand font-extrabold text-slate-300 uppercase opacity-30"
                      style={{ fontSize: `${textStartPos.size}px` }}
                    >
                      AGUARDANDO CÓDIGOS...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <Ticket size={80} className="text-slate-400 mx-auto animate-bounce" />
                <p className="text-slate-500 font-brand font-bold uppercase">Carregue o Fundo Sirius</p>
              </div>
            )}
          </div>

          <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Share2 size={20} />
            </div>
            <div>
              <p className="font-brand font-bold text-sm">Pronto para o WhatsApp!</p>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                Agora o sistema gera uma única imagem com todos os códigos da lista. Os campos são adicionados automaticamente um abaixo do outro sem sobreposição. 
                Use os ajustes à esquerda para mover os QR Codes e o bloco de texto conforme o template.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
