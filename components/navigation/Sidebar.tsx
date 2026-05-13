'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, Settings, LogOut, Building2, FileText, Edit3 } from 'lucide-react';
import { Logo } from '@/components/Logo';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/medicos', label: 'Médicos', icon: Users },
  { href: '/clinicas', label: 'Clínicas', icon: Building2 },
  { href: '/desempenho', label: 'Desempenho', icon: BarChart3 },
  { href: '/relatorio', label: 'Relatório', icon: FileText },
  { href: '/anotacoes', label: 'Anotações', icon: Edit3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[240px] h-screen fixed left-0 top-0 z-50 bg-brand-sidebar text-white shadow-2xl">
      <div className="p-6 flex items-center border-b border-white/5">
        <Logo />
      </div>

      <nav className="flex-1 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3.5 transition-all font-sans text-sm font-medium border-l-[3px] ${
                isActive 
                  ? 'bg-brand-secondary/10 border-brand-secondary text-white' 
                  : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={18} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 pt-4 pb-6 space-y-1">
        <button className="flex items-center gap-3 px-6 py-3 w-full text-slate-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium border-l-[3px] border-transparent">
          <Settings size={18} />
          <span>Configurações</span>
        </button>
        <button className="flex items-center gap-3 px-6 py-3 w-full text-slate-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium border-l-[3px] border-transparent">
          <LogOut size={18} />
          <span>Sair</span>
        </button>
        
        {/* User Avatar */}
        <div className="px-6 pt-6 mt-4 flex items-center gap-3 border-t border-white/5">
          <div className="w-9 h-9 rounded-full bg-brand-primary flex items-center justify-center font-display font-bold text-sm">
            Y
          </div>
          <div className="flex-1 truncate">
            <p className="text-sm font-display font-bold truncate">Yuri S.</p>
            <p className="text-xs text-slate-500 truncate">Sirius Rep</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
