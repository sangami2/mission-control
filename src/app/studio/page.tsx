import type { Metadata } from "next";
import { StudioApp } from "@/components/studio/studio-app";

export const metadata: Metadata = { title: "Studio", description: "Design, evaluate, and govern AI workflows." };

export default function StudioPage() { return <StudioApp />; }
