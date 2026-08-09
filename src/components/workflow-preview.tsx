"use client";

import { Database, FileSearch2, Gauge, Mail, Scale, UserRoundCheck, Workflow } from "lucide-react";
import { useEffect, useState } from "react";

const steps=[
  {label:"Membership base",short:"Population",detail:"12 screened",icon:Database,color:"#1263e6"},
  {label:"Risk scoring",short:"Score",detail:"5 flagged",icon:Gauge,color:"#1598ae"},
  {label:"Context enrichment",short:"Context",detail:"4 ready",icon:FileSearch2,color:"#1263e6"},
  {label:"Intervention agent",short:"Agent",detail:"4 drafted",icon:Workflow,color:"#745bd1"},
  {label:"Policy gate",short:"Policy",detail:"4 eligible",icon:Scale,color:"#c7821b"},
  {label:"Human review",short:"Review",detail:"4 pending",icon:UserRoundCheck,color:"#df624c"},
  {label:"Outreach",short:"Action",detail:"0 released",icon:Mail,color:"#338b58"},
];

export function WorkflowPreview({compact=false}:{compact?:boolean}){
  const [active,setActive]=useState(0);
  useEffect(()=>{const id=window.setInterval(()=>setActive(current=>current===5?0:current+1),1150);return()=>window.clearInterval(id)},[]);
  return <div className={`relative overflow-hidden rounded-[26px] border border-[#cdddeb] bg-white surface-shadow ${compact?"p-4":"p-5 md:p-7"}`}>
    <div className="absolute inset-0 dot-paper opacity-60"/><div className="relative mb-5 flex items-center justify-between"><div><p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#718399]">Workflow operation</p><h3 className="mt-1 text-[15px] font-semibold">Membership Retention</h3></div><div className="flex items-center gap-2 rounded-full border border-[#cfe0ef] bg-[#eef6ff] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-[#1263e6]"><span className="size-1.5 rounded-full bg-[#1263e6] animate-pulse-soft"/>Executing</div></div>
    <div className="relative grid min-w-[660px] grid-cols-7 items-start gap-3 pb-2"><div className="absolute left-[6%] top-[27px] h-0.5 w-[88%] bg-[#cfdae5]"/>{steps.map((step,index)=>{const Icon=step.icon;const processing=index===active;const complete=index<active;const waiting=index>active;return <div key={step.label} className="relative z-10 flex min-w-0 flex-col items-center text-center"><button onClick={()=>setActive(index)} aria-label={`Inspect ${step.label}`} className={`focus-ring relative grid size-[54px] place-items-center rounded-2xl border bg-white transition duration-300 ${processing?"-translate-y-1 border-[#1263e6] shadow-[0_8px_22px_rgba(18,99,230,.18)]":complete?"border-[#9fcfb0]":"border-[#d7e1eb] hover:border-[#9fbcdc]"}`} style={{color:step.color}}><Icon size={20}/>{complete&&<span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-[#3da56a] text-[9px] text-white">✓</span>}</button><span className={`mt-3 text-[10px] font-semibold leading-tight ${processing?"text-[#10253f]":"text-[#64778a]"}`}>{compact?step.short:step.label}</span><span className={`mt-1 text-[8px] uppercase tracking-[.06em] ${processing?"font-semibold text-[#1263e6]":complete?"text-[#3d8a5d]":"text-[#8998a7]"}`}>{processing?"Processing…":complete?step.detail:waiting?"Waiting":step.detail}</span></div>})}</div>
    <div className="relative mt-5 grid grid-cols-3 gap-2 border-t border-[#e1e8ef] pt-4"><Mini label="Population" value="12 members"/><Mini label="Needs attention" value="5 records"/><Mini label="Release state" value="Human gated"/></div>
  </div>;
}

function Mini({label,value}:{label:string;value:string}){return <div><p className="text-[9px] uppercase tracking-[.08em] text-[#8392a2]">{label}</p><p className="mt-1 text-[12px] font-semibold text-[#263f59]">{value}</p></div>}
