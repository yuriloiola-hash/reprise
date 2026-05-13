import { createClient } from '@/utils/supabase/server';
import { DashboardContainer } from '@/components/dashboard/DashboardContainer';

export default async function DashboardPage() {
  const supabase = await createClient();
  const hoje = new Date().toISOString().split('T')[0];

  // Busca inicial apenas para o dia de hoje (o container cuidará do resto via client-side)
  const { data: visitas } = await supabase
    .from('visitas')
    .select(`
      *,
      medicos (*)
    `)
    .eq('data_planejada', hoje)
    .order('hora_planejada', { ascending: true });

  return (
    <DashboardContainer 
      initialVisitas={visitas || []} 
      hoje={hoje} 
    />
  );
}
