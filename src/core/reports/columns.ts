import type { ReportColumn } from './types';
export const text = (key:string,label:string,path=key,searchable=true):ReportColumn=>({key,label,path,searchable});
export const date = (key:string,label:string,path=key):ReportColumn=>({key,label,path,type:'date'});
export const number = (key:string,label:string,path?:string):ReportColumn=>({key,label,path,type:'number'});
export const amount = (key:string,label:string,currencyKey='currency'):ReportColumn=>({key,label,type:'money',currencyKey});
export const boolean = (key:string,label:string,path=key):ReportColumn=>({key,label,path,type:'boolean'});

export const enumText = (key:string,label:string,values:string[],path=key):ReportColumn=>({key,label,path,values});
export const integer = (key:string,label:string,path=key):ReportColumn=>({key,label,path,type:'number',integer:true});
