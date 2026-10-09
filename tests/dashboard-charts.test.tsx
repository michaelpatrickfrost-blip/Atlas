// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {TileChart,headline,pointsFor} from '@/modules/analytics/components/charts';
const metric={id:'orders',name:'Orders',subject:'Sales',definition:'Orders',grain:'Order',href:'/sales',snapshot:true,points:Array.from({length:12},(_,i)=>({label:String(i),value:i+1}))};
const widget={id:'w',metricId:'orders',visual:'kpi' as const,wide:true};
afterEach(cleanup);
describe('Honest configurable dashboard visuals',()=>{
 it('keeps all KPI groups in a headline instead of reporting a top-eight partial total',()=>{expect(pointsFor(metric,widget)).toHaveLength(12);expect(headline(metric,pointsFor(metric,widget))).toBe('78');expect(pointsFor(metric,{...widget,visual:'bar',maxCategories:3,sort:'ascending'}).map(p=>p.value)).toEqual([1,2,3]);});
 it('uses weighted overall averages and one explicit currency for a data KPI',()=>{expect(headline({...metric,overallValue:3},metric.points)).toBe('3');expect(headline({...metric,unit:'money',currency:'GBP',overallValue:1575},metric.points)).toBe('£15.75');});
 it('guards misleading currency distributions and negative donut values',()=>{const {unmount}=render(<TileChart metric={{...metric,unit:'money'}} widget={{...widget,visual:'donut'}}/>);expect(screen.getByText(/different currencies/)).toBeTruthy();unmount();render(<TileChart metric={{...metric,points:[{label:'Credit',value:-10}]}} widget={{...widget,visual:'donut'}}/>);expect(screen.getByText(/non-negative/)).toBeTruthy();});
 it('shows signed bars instead of drawing negative values as small positive bars',()=>{render(<TileChart metric={{...metric,points:[{label:'Credit',value:-10}]}} widget={{...widget,visual:'bar'}}/>);expect(screen.getByText('Negative ← 0 → Positive')).toBeTruthy();expect(screen.getByText('-10')).toBeTruthy();});
});
