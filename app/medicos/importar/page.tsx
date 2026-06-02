import ImportWizard from '@/app/components/import/ImportWizard';

export const metadata = {
  title: 'Importar Médicos | REPrise',
  description: 'Importação em massa de médicos a partir do Excel.'
};

export default function ImportarMedicosPage() {
  return (
    <div className="min-h-screen bg-brand-bg py-8 px-4">
      <ImportWizard />
    </div>
  );
}
