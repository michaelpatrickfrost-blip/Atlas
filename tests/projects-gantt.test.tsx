// @vitest-environment jsdom
import React from 'react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {Gantt} from '@/modules/projects/components/gantt';
import {baselineTasks,duration,finishVariance,ganttWindow,ganttSummary,scheduleDate,dayNumber,type GanttTask} from '@/modules/projects/domain/gantt';
vi.mock('@/app/(app)/projects/actions',()=>({rescheduleTask:vi.fn()}));
vi.mock('next/link',()=>({default:({children,href}: {children:React.ReactNode;href:string})=><a href={href}>{children}</a>}));
afterEach(cleanup);
const task:GanttTask={id:'a',title:'Design approval',status:'TODO',startAt:'2026-10-05',dueAt:'2026-10-09',owner:'Alex',project:'Launch',priority:'HIGH',estimatedMinutes:120,parentTaskId:null,version:1,editable:true,dependencies:[]};
describe('Gantt planning',()=>{
 it('counts inclusive calendar duration across daylight savings',()=>{expect(duration({...task,startAt:'2026-10-24',dueAt:'2026-10-26'})).toBe(3);expect(duration({...task,startAt:null})).toBeNull();});
 it('reports finish variance without inventing missing baseline dates',()=>{expect(finishVariance(task,{dueAt:'2026-10-07'})).toBe(2);expect(finishVariance(task,undefined)).toBeNull();});
 it('bounds very long project windows and supports explicit paging',()=>{const far={...task,dueAt:'2036-10-09'};const w=ganttWindow([far],[],null,'Months',dayNumber('2026-10-08'));expect(w.count).toBe(366);expect(w.last).toBeGreaterThan(w.end);expect(ganttWindow([far],[],w.end+1,'Days',1).start).toBe(w.end+1);});
 it('only projects baseline dates from visible current tasks',()=>{expect(baselineTasks({tasks:[{id:'a',title:'not needed',startAt:'bad',dueAt:'2026-10-07'},{id:'secret',title:'Private scope',dueAt:'2026-10-08'}]},new Set(['a']))).toEqual([{id:'a',startAt:null,dueAt:'2026-10-07'}]);expect(baselineTasks(null,new Set())).toEqual([]);});
 it('distinguishes overdue, incomplete schedules and cancelled effort',()=>{expect(ganttSummary([task,{...task,id:'b',startAt:null,dueAt:null},{...task,id:'c',status:'CANCELLED'}],dayNumber('2026-10-10'))).toEqual({open:2,overdue:1,unscheduled:1,hours:4});});
 it('validates dates strictly including leap years',()=>{expect(scheduleDate('2028-02-29').toISOString()).toBe('2028-02-29T00:00:00.000Z');for(const bad of ['2026-02-29','2026-13-01','2026-10-08T12:00:00Z','tomorrow'])expect(()=>scheduleDate(bad)).toThrow('valid calendar date');});
 it('lets managers select a task and edit just its dates',()=>{render(<Gantt tasks={[task]} today="2026-10-08"/>);fireEvent.click(screen.getByRole('button',{name:'Schedule Design approval'}));expect(screen.getByLabelText('Task start')).toHaveProperty('value','2026-10-05');expect(screen.getByLabelText('Task finish')).toHaveProperty('value','2026-10-09');expect(screen.getByRole('button',{name:'Save task dates'})).toBeTruthy();expect(screen.getByRole('link',{name:'Open full task →'}).getAttribute('href')).toBe('/projects/tasks/a');});
 it('keeps read-only tasks readable without date controls',()=>{render(<Gantt tasks={[{...task,editable:false}]} today="2026-10-08"/>);fireEvent.click(screen.getByRole('button',{name:'Schedule Design approval'}));expect(screen.queryByRole('button',{name:'Save task dates'})).toBeNull();});
 it('search and critical filters do not remove schedule analysis context',()=>{render(<Gantt tasks={[task,{...task,id:'b',title:'Build',startAt:'2026-10-06',dueAt:'2026-10-07',dependencies:[{predecessorId:'a',successorId:'b',kind:'FINISH_TO_START',lagDays:1}]}]} today="2026-10-08"/>);expect(screen.getByText('Review 1 dependency conflicts')).toBeTruthy();fireEvent.change(screen.getByLabelText('Find task or owner'),{target:{value:'Build'}});expect(screen.queryByRole('button',{name:'Schedule Design approval'})).toBeNull();expect(screen.getByText('Review 1 dependency conflicts')).toBeTruthy();});
 it('shows readable baseline changes and unscheduled tasks',()=>{render(<Gantt tasks={[task,{...task,id:'b',title:'Unplanned',startAt:null,dueAt:null}]} today="2026-10-08" baselines={[{id:'base',name:'Agreed',createdAt:'2026-10-01',tasks:[{id:'a',startAt:'2026-10-05',dueAt:'2026-10-07'}]}]}/>);expect(screen.getByText('+2d')).toBeTruthy();expect(screen.getByText('Added since baseline')).toBeTruthy();expect(screen.getByText('Unscheduled')).toBeTruthy();fireEvent.change(screen.getByLabelText('Gantt zoom'),{target:{value:'Days'}});expect(screen.getByLabelText('Today marker')).toBeTruthy();});
});

describe('Gantt hydration',()=>{
 it('hydrates the baseline and dependency chart without browser repairing invalid HTML',async()=>{
  const {renderToString}=await import('react-dom/server');const {hydrateRoot}=await import('react-dom/client');const {act}=await import('react');
  const props={tasks:[task,{...task,id:'b',title:'Build',dependencies:[{predecessorId:'a',successorId:'b',kind:'FINISH_TO_START',lagDays:1}]}],today:'2026-10-08',milestones:[{id:'m',name:'Delivery',targetAt:'2026-10-20',complete:false}],baselines:[{id:'base',name:'Agreed',createdAt:'2026-10-01',tasks:[{id:'a',startAt:'2026-10-05',dueAt:'2026-10-07'}]}]};
  const container=document.createElement('div');container.innerHTML=renderToString(<Gantt {...props}/>);document.body.append(container);const errors:unknown[]=[];let root:ReturnType<typeof hydrateRoot>;
  await act(async()=>{root=hydrateRoot(container,<Gantt {...props}/>,{onRecoverableError:e=>errors.push(e)});});
  await act(async()=>root.unmount());container.remove();expect(errors).toEqual([]);
 });
});
