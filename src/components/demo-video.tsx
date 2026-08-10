"use client";

import Link from "next/link";
import { ArrowRight, Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type DemoVideoModalProps = {
  open: boolean;
  onClose: () => void;
  showStudioAction?: boolean;
};

export function DemoVideoModal({open,onClose,showStudioAction=false}:DemoVideoModalProps) {
  const closeButtonRef=useRef<HTMLButtonElement>(null);
  const videoRef=useRef<HTMLVideoElement>(null);

  useEffect(()=>{
    if(!open){videoRef.current?.pause();return;}
    const previousOverflow=document.body.style.overflow;
    const previousFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const onKeyDown=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose()};
    document.body.style.overflow="hidden";
    document.addEventListener("keydown",onKeyDown);
    const focusTimer=window.setTimeout(()=>closeButtonRef.current?.focus(),0);
    return()=>{
      window.clearTimeout(focusTimer);
      document.body.style.overflow=previousOverflow;
      document.removeEventListener("keydown",onKeyDown);
      previousFocus?.focus();
    };
  },[open,onClose]);

  if(!open)return null;

  return <div className="fixed inset-0 z-[120] grid place-items-center overflow-y-auto bg-[#07182a]/82 p-3 backdrop-blur-md sm:p-6" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}>
    <section role="dialog" aria-modal="true" aria-labelledby="demo-video-title" aria-describedby="demo-video-description" className="my-auto w-full max-w-[1180px] overflow-hidden rounded-[24px] border border-white/15 bg-[#0c2138] text-white shadow-[0_30px_100px_rgba(0,0,0,.5)]">
      <div className="flex items-start justify-between gap-5 border-b border-white/10 px-5 py-4 sm:px-6">
        <div><p className="text-[9px] font-bold uppercase tracking-[.13em] text-[#68d2f7]">Product walkthrough</p><h2 id="demo-video-title" className="mt-1.5 text-lg font-semibold sm:text-xl">See Mission Control in operation</h2><p id="demo-video-description" className="mt-1 max-w-2xl text-[10px] leading-5 text-white/55 sm:text-xs">A guided tour of population screening, inspectable agent stages, human review, governed release, and session-level controls.</p></div>
        <button ref={closeButtonRef} onClick={onClose} aria-label="Close demo video" className="focus-ring grid size-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/8 text-white/75 hover:bg-white/15 hover:text-white"><X size={18}/></button>
      </div>
      <div className="bg-black p-1 sm:p-2"><video ref={videoRef} data-testid="demo-video" src="/mission-control-demo.mp4" controls playsInline preload="none" className="aspect-video max-h-[72vh] w-full bg-black object-contain">Your browser does not support embedded video.</video></div>
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-[10px] leading-5 text-white/48">The walkthrough uses fictional Northstar data. All external actions shown are simulated.</p><div className="flex items-center justify-end gap-2"><button onClick={onClose} className="focus-ring h-10 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/75 hover:bg-white/10">Close</button>{showStudioAction&&<Link href="/studio" onClick={onClose} className="focus-ring inline-flex h-10 items-center gap-2 rounded-full bg-[#65cef2] px-5 text-xs font-semibold text-[#092239]">Open the Studio <ArrowRight size={14}/></Link>}</div></div>
    </section>
  </div>;
}

export function DemoVideoButton() {
  const [open,setOpen]=useState(false);
  const close=useCallback(()=>setOpen(false),[]);
  return <><button onClick={()=>setOpen(true)} className="focus-ring inline-flex h-12 items-center gap-2 rounded-full border border-[#9fc4e6] bg-[#edf6ff] px-6 text-sm font-semibold text-[#1258aa] transition hover:-translate-y-0.5 hover:border-[#68a8df] hover:bg-[#e3f1ff]"><span className="grid size-6 place-items-center rounded-full bg-[#1263e6] text-white"><Play size={10} fill="currentColor"/></span>Watch demo</button><DemoVideoModal open={open} onClose={close} showStudioAction/></>;
}
