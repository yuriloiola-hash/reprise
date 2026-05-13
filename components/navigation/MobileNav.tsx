'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, Edit3, FileText } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/medicos', label: 'Médicos', icon: Users },
  { href: '/anotacoes', label: 'Anotações', icon: Edit3 },
  { href: '/desempenho', label: 'Desempenho', icon: BarChart3 },
  { href: '/relatorio', label: 'Relatório', icon: FileText },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] pb-safe bg-white border-t border-brand-border flex justify-around items-center z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center justify-center w-full h-full gap-1 pt-1"
          >
            <Icon 
              size={22} 
              strokeWidth={isActive ? 2.5 : 2} 
              className={isActive ? 'text-brand-primary' : 'text-slate-400'}
            />
            <span className={`font-display text-[10px] ${isActive ? 'text-brand-primary font-bold' : 'text-slate-400 font-medium'}`}>
              {item.label}
            </span>
            {isActive && (
              <div className="absolute bottom-1 w-1 h-1 bg-brand-primary rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
