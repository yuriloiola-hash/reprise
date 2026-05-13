export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon: upward graph integrated into the letter R */}
      <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-secondary shadow-sm overflow-hidden shrink-0">
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-white"
        >
          <path d="M7 21V5C7 3.89543 7.89543 3 9 3H14C16.2091 3 18 4.79086 18 7C18 9.20914 16.2091 11 14 11H7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 11L18 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 11L21 5M21 5H16M21 5V10" stroke="#00C2FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      
      {/* Text: REPrise — REP bold, rise italic smaller */}
      <div className="font-brand tracking-tight leading-none text-white flex items-baseline gap-[1px]">
        <span className="font-extrabold text-[1.2rem] uppercase tracking-tighter">REP</span>
        <span className="italic font-light text-[0.95rem] opacity-80">rise</span>
      </div>
    </div>
  );
}
