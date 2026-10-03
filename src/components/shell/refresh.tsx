"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export function Refresh({milliseconds=15000}:{milliseconds?:number}) {const router=useRouter();useEffect(()=>{const interval=setInterval(()=>{if(document.visibilityState==='visible')router.refresh();},milliseconds);return ()=>clearInterval(interval);},[milliseconds,router]);return null;}
