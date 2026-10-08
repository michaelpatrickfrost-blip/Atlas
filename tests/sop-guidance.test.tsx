// @vitest-environment jsdom
import React from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {cycleGuidance,monthlyBrief,reviewStages,REVIEW_GUIDES} from '@/modules/sop/domain/guidance';
import type {DemandRow} from '@/modules/sop/domain/engine';
import {MonthlyBrief} from '@/modules/sop/components/monthly-brief';
import {SopGuideHome,SopReviews,SopGenerate,SopHelp} from '@/modules/sop/components/guidance';
import {SopSetup} from '@/modules/sop/components/setup';
import type {getSopWorkspace} from '@/modules/sop/services/workspace';
vi.mock('@/modules/sop/services/workspace',()=>({generateSopForecast:vi.fn(),configureSopCycle:vi.fn(),updateSopWorkflow:vi.fn(),approveSopVersion:vi.fn(),publishSopVersion:vi.fn()}));
vi.mock('next/link',()=>({default:({children,href,...props}:{children:React.ReactNode;href:string})=><a href={href} {...props}>{children}</a>}));
afterEach(cleanup);
const version={id:'v',kind:'consensus',status:'draft',sourceRevision:1};
const workflow=(status='open',id='v')=>REVIEW_GUIDES.map(g=>({title:g.title,status,owner:'Alex',dueOn:'',versionId:id}));
const row=(values:Partial<DemandRow>={})=>({productId:'p',code:'SKU',name:'Product',unit:'each',period:'2026-10',consensus:100,remainingDemand:80,atRisk:20,revenueMinor:100000,marginMinor:null,...values} as DemandRow);
const workspace=(changes:Record<string,unknown>={})=>({capabilities:['sop.read','sop.manage','sop.approve','sop.publish','plan.read','sales.order.read','customers.read','core.products.read','manufacturing.plan.manage'],cycles:[],plans:[],inaccessibleVersions:0,versions:[],cycle:{id:'c',revision:1,inputRevision:1,sourcePlanIds:[],workflow:workflow(),actions:[],settings:{},currency:'GBP'},version:{...version,payload:{rows:[row()],targets:[],currency:'GBP',settings:{}}},...changes} as unknown as Awaited<ReturnType<typeof getSopWorkspace>>);
describe('S&OP guidance follows actual version state',()=>{
 it('handles first use and restricted sources distinctly',()=>{expect(cycleGuidance(null,1,[],0).key).toBe('setup');expect(cycleGuidance(null,1,[],0,true).key).toBe('access');});
 it('does not treat scenarios or an empty forecast as approval-ready',()=>{expect(cycleGuidance({...version,kind:'scenario'},1,workflow('approved'),10).ready).toBe(false);expect(cycleGuidance(version,1,workflow('approved'),0).key).toBe('empty');});
 it('requires all seven named reviews for the selected exact version',()=>{expect(cycleGuidance(version,1,workflow('approved','old'),10).key).toBe('other');expect(cycleGuidance(version,1,workflow('approved').slice(1),10).ready).toBe(false);expect(cycleGuidance(version,1,workflow('approved'),10)).toMatchObject({ready:true,approved:7,key:'approve'});});
 it('recommends the next incomplete review and resets after settings changes',()=>{const stages=workflow();stages[0].status='approved';expect(cycleGuidance(version,1,stages,10)).toMatchObject({key:'review',approved:1,title:'Next: Are the right products included?'});expect(cycleGuidance(version,2,stages,10)).toMatchObject({key:'stale',approved:0,ready:false});});
 it('distinguishes approved demand to release from already published evidence',()=>{expect(cycleGuidance({...version,status:'approved'},1,workflow('approved'),10).key).toBe('publish');expect(cycleGuidance({...version,status:'published'},2,workflow(),10).key).toBe('published');});
 it('parses missing workflow without granting review completion',()=>{expect(reviewStages(null)).toEqual([]);expect(reviewStages([{title:'Demand review'}])[0].status).toBe('open');});
});
describe('Monthly decision brief',()=>{
 it('keeps unlike units separate and absent supply or margin unavailable',()=>{const [brief]=monthlyBrief([row(),row({productId:'kg',unit:'kg',consensus:30,atRisk:null})],[],null,'GBP');expect(brief.units).toEqual([{unit:'each',demand:100,remaining:80,risk:20},{unit:'kg',demand:30,remaining:80,risk:null}]);expect(brief.margin).toBeNull();expect(brief.target).toBeNull();expect(brief.shortfalls).toBe(1);});
 it('uses only the selected revenue plan and matching currency',()=>{const target={periodKey:'2026-10',value:120000,planId:'target',metricKey:'revenue',currency:'GBP'};expect(monthlyBrief([row()], [{...target,currency:'USD'},{...target,planId:'other'},target],'target','GBP')[0]).toMatchObject({target:120000,revenue:100000,gap:-20000});});
 it('switches months without changing stored plans',()=>{render(<MonthlyBrief months={monthlyBrief([row(),row({period:'2026-11',revenueMinor:200000})],[],null,'GBP')} currency="GBP" base="/sop?cycle=c&version=v"/>);fireEvent.change(screen.getByLabelText('Planning month'),{target:{value:'2026-11'}});expect(screen.getByText('£2,000')).toBeTruthy();expect(screen.getByRole('link',{name:'Record a decision →'}).getAttribute('href')).toBe('/sop?cycle=c&version=v&view=decisions');});
});
describe('Guided screens',()=>{
 it('gives a new user a real first action and an accessible guide',()=>{render(<SopGuideHome data={workspace({cycle:null,version:null})}/>);expect(screen.getByRole('link',{name:'Create your first cycle →'}).getAttribute('href')).toBe('#new-cycle');expect(screen.getByRole('link',{name:'How to use S&OP'}).getAttribute('href')).toBe('/sop?view=help');});
 it('shows checklists and no premature approval button',()=>{render(<SopReviews data={workspace()}/>);expect(screen.getAllByRole('button',{name:'Record review complete'})).toHaveLength(7);expect(screen.queryByRole('button',{name:'Approve agreed forecast'})).toBeNull();});
 it('offers approval only after all selected-version reviews are complete',()=>{const data=workspace();data.cycle!.workflow=workflow('approved');render(<SopReviews data={data}/>);expect(screen.getByRole('button',{name:'Approve agreed forecast'})).toBeTruthy();expect(screen.queryByRole('button',{name:'Release approved demand to Manufacturing'})).toBeNull();});
 it('hides review writes from readers and explains generation access',()=>{const data=workspace({capabilities:['sop.read']});render(<><SopReviews data={data}/><SopGenerate data={data}/></>);expect(screen.queryByRole('button',{name:'Record review complete'})).toBeNull();expect(screen.getByText(/planning lead needs access/)).toBeTruthy();});
 it('keeps advanced settings collapsed while submitting their defaults',()=>{render(<SopSetup data={workspace()}/>);const advanced=screen.getByText('Advanced forecast & service settings').closest('details');expect(advanced?.open).toBe(false);expect(document.querySelector<HTMLSelectElement>('select[name="method"]')?.value).toBe('auto');expect(screen.getByRole('button',{name:'Save planning setup'})).toBeTruthy();});
 it('provides an example without requiring a readable forecast',()=>{render(<SopHelp/>);expect(screen.getByRole('heading',{name:'A simple example'})).toBeTruthy();expect(screen.getByText(/Illustration only/)).toBeTruthy();});
 it('hydrates the monthly brief without mismatch',async()=>{const {renderToString}=await import('react-dom/server'),{hydrateRoot}=await import('react-dom/client'),{act}=await import('react');const props={months:monthlyBrief([row()],[],null,'GBP'),currency:'GBP',base:'/sop?cycle=c'};const container=document.createElement('div');container.innerHTML=renderToString(<MonthlyBrief {...props}/>);const errors:unknown[]=[];let root:ReturnType<typeof hydrateRoot>;await act(async()=>{root=hydrateRoot(container,<MonthlyBrief {...props}/>,{onRecoverableError:e=>errors.push(e)});});await act(async()=>root.unmount());expect(errors).toEqual([]);});
});
