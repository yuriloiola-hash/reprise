export function Sparkline({ data }: { data: { t: string, sirius: number, conc: number, total: number }[] }) {
  // data should be 5 items
  const height = 30;
  const width = 80;
  
  if (!data || data.length === 0) return <div className="w-[80px] h-[30px]" />;

  const maxTotal = Math.max(...data.map(d => d.total), 1);
  
  const stepX = width / (data.length - 1 || 1);
  
  // Helpers to get Y coordinates
  const getY = (val: number) => height - (val / maxTotal) * height;

  const pointsSirius = data.map((d, i) => `${i * stepX},${getY(d.sirius)}`).join(' ');
  const pointsConc = data.map((d, i) => `${i * stepX},${getY(d.conc)}`).join(' ');
  const pointsTotal = data.map((d, i) => `${i * stepX},${getY(d.total)}`).join(' ');

  return (
    <div className="flex items-center" style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Linha Total (Pontilhada) */}
        <polyline 
          points={pointsTotal} 
          fill="none" 
          stroke="#94A3B8" 
          strokeWidth="1.5" 
          strokeDasharray="2 2" 
          className="opacity-50"
        />
        {/* Linha Concorrentes (Cinza) */}
        <polyline 
          points={pointsConc} 
          fill="none" 
          stroke="#64748B" 
          strokeWidth="1.5" 
          className="opacity-80"
        />
        {/* Linha Sirius (Azul) */}
        <polyline 
          points={pointsSirius} 
          fill="none" 
          stroke="#0047CC" 
          strokeWidth="2" 
        />
        {/* Pontos Sirius */}
        {data.map((d, i) => (
          <circle key={i} cx={i * stepX} cy={getY(d.sirius)} r={2} fill="#0047CC" />
        ))}
      </svg>
    </div>
  );
}
