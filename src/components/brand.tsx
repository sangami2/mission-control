import Link from "next/link";
import { Orbit } from "lucide-react";

export function Brand({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <Link href="/" className="focus-ring inline-flex items-center gap-2.5 rounded-md" aria-label="Mission Control home">
      <span className={`grid size-8 place-items-center rounded-[10px] ${light ? "bg-white text-[#1263e6]" : "bg-[#1263e6] text-white"}`}>
        <Orbit size={18} strokeWidth={2.3} aria-hidden="true" />
      </span>
      {!compact && <span className={`text-[15px] font-[760] tracking-[-.025em] ${light ? "text-white" : "text-[#10253f]"}`}>Mission Control</span>}
    </Link>
  );
}

export function ConceptLabel({ dark = false }: { dark?: boolean }) {
  return <span className={`text-[11px] font-medium ${dark ? "text-white/58" : "text-[#687b8f]"}`}>Independent product concept by Akash Sangami</span>;
}
