"use client";

import Link from "next/link";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";

const nav = [
  ["Product", "/#product"], ["How it works", "/#how-it-works"],
  ["Architecture", "/#architecture"], ["Case study", "/case-study"],
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-[#dbe5ef]/85 bg-[#f8fbff]/90 backdrop-blur-xl">
      <div className="page-shell flex h-[70px] items-center justify-between gap-5">
        <Brand />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary navigation">
          {nav.map(([label, href]) => <Link key={label} className="focus-ring rounded-sm text-[13px] font-medium text-[#4f657b] transition hover:text-[#1263e6]" href={href}>{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-3 xl:flex">
          <span className="text-[12px] font-semibold text-[#10253f]">Akash Sangami</span>
          <span className="h-4 w-px bg-[#d1dce8]" />
          <a className="focus-ring rounded-sm text-[12px] text-[#587087] hover:text-[#1263e6]" href="mailto:sangami.akash@gmail.com">Email</a>
          <a className="focus-ring rounded-sm text-[12px] text-[#587087] hover:text-[#1263e6]" href="https://www.linkedin.com/in/akashsangami/" target="_blank" rel="noreferrer">LinkedIn</a>
          <Link href="/studio" className="focus-ring ml-2 inline-flex h-10 items-center gap-2 rounded-full bg-[#10253f] px-4 text-[12px] font-semibold text-white transition hover:bg-[#1263e6] active:scale-[.98]">Open Studio <ArrowUpRight size={14}/></Link>
        </div>
        <Link href="/studio" className="focus-ring ml-auto hidden h-9 items-center rounded-full bg-[#10253f] px-4 text-[12px] font-semibold text-white sm:flex xl:hidden">Open Studio</Link>
        <button onClick={() => setOpen(!open)} className="focus-ring grid size-10 place-items-center rounded-full border border-[#d4dfeb] bg-white text-[#10253f] lg:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"}>{open ? <X size={19}/> : <Menu size={19}/>}</button>
      </div>
      {open && <div id="mobile-nav" className="border-t border-[#dbe5ef] bg-white px-5 py-5 lg:hidden">
        <nav className="mx-auto grid max-w-xl gap-1" aria-label="Mobile navigation">
          {nav.map(([label, href]) => <Link onClick={() => setOpen(false)} key={label} className="focus-ring rounded-lg px-3 py-3 text-[15px] font-medium text-[#263f59] hover:bg-[#f1f7fd]" href={href}>{label}</Link>)}
          <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[#e1e8f0] pt-5 text-sm">
            <span className="font-semibold">Akash Sangami</span><a href="mailto:sangami.akash@gmail.com" className="text-[#1263e6]">Email</a><a href="https://www.linkedin.com/in/akashsangami/" className="text-[#1263e6]">LinkedIn</a>
          </div>
        </nav>
      </div>}
    </header>
  );
}
