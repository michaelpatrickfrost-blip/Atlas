"use client";
import {useState} from "react";
import {TextArea,inputClass} from "@/components/ui/service-fields";
export function ResponseComposer({articles}:{articles:{id:string;title:string;content:string}[]}){
 const [body,setBody]=useState("");
 return <div className="space-y-3">{!!articles.length&&<label className="block text-xs">Insert a reviewed response<select className={inputClass} value="" onChange={event=>{const article=articles.find(a=>a.id===event.target.value);if(article)setBody(value=>value?value+"\n\n"+article.content:article.content);}}><option value="">Choose an answer to adapt</option>{articles.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select></label>}<TextArea title="Message · review before sending" name="body" value={body} onChange={event=>setBody(event.target.value)} required/></div>;
}
