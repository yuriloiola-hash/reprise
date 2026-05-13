export type VisitStatus = 'PLANEJADO' | 'PRE_VISITA' | 'CONCLUIDO' | 'ATRASADO';

export interface VisitStatusInfo {
  id: VisitStatus;
  label: string;
  pillBg: string;
  pillText: string;
  dotColor: string;
  borderColor: string; // Para a borda esquerda do card
}

export const VISIT_COLORS: Record<VisitStatus, VisitStatusInfo> = {
  PLANEJADO: {
    id: 'PLANEJADO',
    label: 'PLANEJADO',
    pillBg: 'bg-slate-100',
    pillText: 'text-slate-600',
    dotColor: 'bg-slate-400',
    borderColor: 'border-slate-400',
  },
  PRE_VISITA: {
    id: 'PRE_VISITA',
    label: 'PRÉ-VISITA',
    pillBg: 'bg-blue-50',
    pillText: 'text-blue-700',
    dotColor: 'bg-blue-600',
    borderColor: 'border-blue-600',
  },
  CONCLUIDO: {
    id: 'CONCLUIDO',
    label: 'CONCLUÍDO',
    pillBg: 'bg-green-50',
    pillText: 'text-green-700',
    dotColor: 'bg-green-600',
    borderColor: 'border-green-600',
  },
  ATRASADO: {
    id: 'ATRASADO',
    label: 'ATRASADO',
    pillBg: 'bg-red-50',
    pillText: 'text-red-700',
    dotColor: 'bg-red-600',
    borderColor: 'border-red-600',
  }
};

export function calcularStatusVisita({
  dataPlanejada,
  preVisitaFeita,
  posVisitaFeita,
}: {
  dataPlanejada: string;
  preVisitaFeita: boolean;
  posVisitaFeita: boolean;
}): VisitStatusInfo {
  if (posVisitaFeita) {
    return VISIT_COLORS.CONCLUIDO;
  }
  
  if (preVisitaFeita) {
    return VISIT_COLORS.PRE_VISITA;
  }

  const hoje = new Date().toISOString().split('T')[0];
  
  // Se a data já passou e não foi feita a pré-visita
  if (dataPlanejada < hoje) {
    return VISIT_COLORS.ATRASADO;
  }
  
  // Se é hoje, checar o horário limite (18h)
  if (dataPlanejada === hoje) {
    const agora = new Date();
    if (agora.getHours() >= 18) {
      return VISIT_COLORS.ATRASADO;
    }
  }

  // Se é futuro ou hoje antes das 18h
  return VISIT_COLORS.PLANEJADO;
}
