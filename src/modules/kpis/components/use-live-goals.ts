"use client";
import {useEffect,useState} from "react";
import {loadLiveGoalMarkers} from "@/app/(app)/analytics/actions";
import type {GoalMarker} from "../services/workspace";
export function useLiveGoals(initial:GoalMarker[],seconds:number,sample=false){
 const [goals,setGoals]=useState(initial);
 useEffect(()=>{if(sample)return;let stopped=false;const timer=window.setInterval(async()=>{if(document.hidden)return;try{const next=await loadLiveGoalMarkers();if(!stopped)setGoals(next);}catch{if(!stopped)setGoals(previous=>previous.map(g=>({...g,score:{...g.score,actual:null,verdict:"no_reading",summary:"Goal refresh failed. Refresh the page to retry."}})));}},(seconds||30)*1000);return()=>{stopped=true;window.clearInterval(timer);};},[seconds,sample]);
 return goals;
}
