export type ForecastMethod = "Recent 3 months" | "Recent 6 months" | "Same month last year";
const mean = (xs: number[]) => xs.reduce((a,b)=>a+b,0)/Math.max(1,xs.length);
const predict = (history:number[], method:ForecastMethod)=>method==="Same month last year"?history.at(-12)??0:mean(history.slice(method==="Recent 3 months"?-3:-6));
/** Rolling holdout selects among transparent baselines using absolute error.
 * Missing pre-product months are excluded by the caller; genuine zero months stay. */
export function demandForecast(history:number[], ahead=6) {
 if(history.some(v=>!Number.isFinite(v)||v<0)||ahead<1||ahead>12)throw new Error("Forecast history must contain finite non-negative quantities.");
 if(history.length<3)return {method:null,quantities:[] as number[],wape:null,bias:null,observations:history.length,warning:"At least three complete months of demand history are needed. Enter a reviewed forecast or publish S&OP demand."};
 const methods:ForecastMethod[]=["Recent 3 months",...(history.length>=7?["Recent 6 months" as const]:[]),...(history.length>=18?["Same month last year" as const]:[])];
 const start=Math.max(methods.includes("Same month last year")?12:methods.includes("Recent 6 months")?6:3,history.length-6);
 const scored=methods.map(method=>{let error=0,signed=0,actual=0,count=0;for(let i=start;i<history.length;i++){if(method==="Same month last year"&&i<12||method==="Recent 6 months"&&i<6)continue;const expected=predict(history.slice(0,i),method);error+=Math.abs(expected-history[i]);signed+=expected-history[i];actual+=history[i];count++;}return {method,error:count?error/count:Infinity,wape:actual?100*error/actual:null,bias:actual?100*signed/actual:null};}).sort((a,b)=>a.error-b.error);
 const best=scored[0];const future=[...history];const quantities:number[]=[];
 for(let i=0;i<ahead;i++){const value=Math.max(0,Math.round(predict(future,best.method)*1000000)/1000000);quantities.push(value);future.push(value);}
 const zeroes=history.filter(v=>v===0).length;
 return {...best,quantities,observations:history.length,warning:zeroes>history.length/2?"Intermittent demand: more than half the history months are zero. Review forecasts against customer plans before saving.":history.length<12?"Less than a full year of history: seasonality is unproven.":null};
}
export function monthlyDemand(totalForecast:number, grossBookings:number, outstanding:number){return {residualForecast:Math.max(0,totalForecast-grossBookings),productionDemand:Math.max(0,outstanding)+Math.max(0,totalForecast-grossBookings)};}

export function adjustedForecast(base:number|null,percent:number,add:number){
 if(base===null)return null;
 if(!Number.isFinite(base)||!Number.isFinite(percent)||percent < -100||!Number.isFinite(add))throw new Error("Enter valid forecast adjustments.");
 return Math.max(0,Math.round((base*(1+percent/100)+add)*1e6)/1e6);
}
