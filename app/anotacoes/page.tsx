'use client';

import { FileText } from 'lucide-react';

export default function AnotacoesPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-brand-primary text-xs font-brand font-bold uppercase tracking-widest mb-1">
          <FileText size={14} />
          Bloco de Notas
        </div>
        <h1 className="text-3xl font-brand font-extrabold text-brand-text">Anotações</h1>
      </header>
      
      <div className="bg-white rounded-2xl border border-brand-border p-12 text-center">
        <div className="w-16 h-16 bg-brand-bg rounded-full flex items-center justify-center mx-auto mb-4 text-brand-text-muted">
          <FileText size={32} />
        </div>
        <p className="text-brand-text font-medium mb-1">Em desenvolvimento</p>
        <p className="text-sm text-brand-text-muted">Este módulo de anotações rápidas estará disponível em breve.</p>
      </div>
    </div>
  );
}
