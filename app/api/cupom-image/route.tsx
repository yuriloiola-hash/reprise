import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const THEMES: Record<string, {
  label: string; brand: string; accent: string;
  medText: string; bg: string; qrUrl: string;
}> = {
  gts: {
    label: 'Gotas (GTS)', brand: 'GTS', accent: '#00D1FF',
    medText: 'SOL 10MG 20ML', bg: '#001D4A',
    qrUrl: 'https://www.emssaude.com.br/durmabem'
  },
  cp: {
    label: 'Comprimido (CP)', brand: 'CP', accent: '#FF9F43',
    medText: '10MG C/ 20 CPRS', bg: '#001D4A',
    qrUrl: 'https://www.emssaude.com.br/durmabem'
  }
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const themeKey = searchParams.get('theme') || 'gts';
  const codes = (searchParams.get('codes') || '').split(',').filter(Boolean);
  const customQrUrl = searchParams.get('qrUrl') || '';

  const theme = THEMES[themeKey] || THEMES.gts;
  const qrUrl = customQrUrl || theme.qrUrl;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qrUrl)}&format=png`;

  const WIDTH = 900;
  const BASE_HEIGHT = 640;
  const codeBlockHeight = Math.max(codes.length * 110, 140);
  const HEIGHT = BASE_HEIGHT + codeBlockHeight;

  const pacienteSteps = [
    'Escaneie o QR Code acima ou acesse: www.emssaude.com.br/durmabem',
    `Preencha o campo "Nº do cupom" com código do seu cupom Durma Bem e, na seção "Medicamento", selecione a opção: "${theme.medText}".`,
    'Finalize o cadastro preenchendo com os seus dados. Após isso, você poderá conferir a farmácia participante mais próxima de você.',
    'Para retirar seu medicamento apresente o cupom e a receita ao atendente da farmácia escolhida.'
  ];

  const pdvSteps = [
    'Acesse o Portal da Drogaria em: www.portaldadrogaria.com.br',
    'Selecione o menu "Apoio ao Consumidor" e pesquise o produto (código de barras ou nome).',
    'Digite o número do cupom de desconto e o CPF do comprador.',
    'Finalize o atendimento e informe NSU e cartão para o consumidor receber os descontos no check-out.'
  ];

  const stepBadge = (num: number) => (
    <div style={{
      width: 20, height: 20, borderRadius: '50%',
      backgroundColor: theme.accent, color: theme.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 900, flexShrink: 0, marginRight: 10, marginTop: 2
    }}>
      {num}
    </div>
  );

  return new ImageResponse(
    (
      <div style={{
        width: WIDTH, height: HEIGHT,
        backgroundColor: theme.bg,
        display: 'flex', flexDirection: 'column',
        padding: 40, fontFamily: 'sans-serif', color: 'white',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 48, fontWeight: 900, color: theme.accent, lineHeight: 1 }}>Patz</span>
            <span style={{ fontSize: 28, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase' }}>{theme.brand}</span>
          </div>
          <div style={{
            backgroundColor: theme.accent, padding: '8px 16px', borderRadius: 8, display: 'flex',
          }}>
            <span style={{ color: theme.bg, fontWeight: 900, fontSize: 13, textTransform: 'uppercase' }}>Programa Durma Bem</span>
          </div>
        </div>

        {/* Two columns */}
        <div style={{ display: 'flex', flex: 1 }}>
          {/* Paciente */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} width={80} height={80} style={{ borderRadius: 12, marginRight: 12, backgroundColor: 'white', padding: 6 }} alt="" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 3 }}>Paciente</span>
                <span style={{ fontSize: 18, fontWeight: 700 }}>Orientações</span>
              </div>
            </div>
            {pacienteSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
                {stepBadge(i + 1)}
                <span style={{ fontSize: 10, lineHeight: 1.6, opacity: 0.9 }}>{step}</span>
              </div>
            ))}
          </div>

          {/* Balconista / PDV */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingLeft: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} width={80} height={80} style={{ borderRadius: 12, marginRight: 12, backgroundColor: 'white', padding: 6 }} alt="" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: theme.accent, textTransform: 'uppercase', letterSpacing: 3 }}>Balconista</span>
                <span style={{ fontSize: 18, fontWeight: 700 }}>Ponto de Venda</span>
              </div>
            </div>
            {pdvSteps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
                {stepBadge(i + 1)}
                <span style={{ fontSize: 10, lineHeight: 1.6, opacity: 0.9 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coupon codes */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 16 }}>
          {codes.length > 0 ? codes.map((code, i) => (
            <div key={i} style={{
              backgroundColor: 'white', borderRadius: 24,
              padding: '16px 48px', marginBottom: 12,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              border: `4px solid ${theme.accent}`, width: 400,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 3 }}>
                Código do Cupom {i + 1}
              </span>
              <span style={{ fontSize: 32, fontWeight: 900, color: theme.bg }}>{code}</span>
            </div>
          )) : (
            <div style={{
              border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 24,
              padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 400,
            }}>
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3 }}>
                Aguardando códigos...
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16,
        }}>
          <div style={{
            backgroundColor: theme.accent, color: theme.bg,
            padding: '6px 24px', borderRadius: 999, display: 'flex',
          }}>
            <span style={{ fontWeight: 900, fontSize: 11, textTransform: 'uppercase' }}>
              Atenção! O desconto é válido apenas para a 1ª compra no CPF.
            </span>
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );
}
