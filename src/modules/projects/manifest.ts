import {FolderKanban} from 'lucide-react';
import type {ModuleManifest} from '@/core/modules/types';
import {projectsAnalytics} from './services/analytics';
import {projectsAttention,projectsSearch,projectsCustomer} from './services/providers';
export const projectsManifest:ModuleManifest={id:'projects',name:'Projects',description:'Personal work, team projects and connected business delivery.',icon:FolderKanban,version:'0.2.0',minimumCoreVersion:'0.1.0',dependencies:[],capabilities:['projects.read','projects.manage'],rootPath:'/projects',accessCapability:'projects.read',status:'available',analyticsProvider:projectsAnalytics,attentionProvider:projectsAttention,searchProvider:projectsSearch,customerOverviewProvider:projectsCustomer,navigation:[
 {label:'Home',href:'/projects'},
 {label:'My Work',href:'/projects/work/my-work',group:'My day'},
 {label:'My Day',href:'/projects/work/my-day',group:'My day'},
 {label:'Inbox',href:'/projects/work/inbox',group:'My day'},
 {label:'My time',href:'/projects/work/timesheets',group:'My day'},
 {label:'Tasks',href:'/projects/tasks',group:'Delivery'},
 {label:'Portfolios',href:'/projects/work/portfolios',group:'Delivery'},
 {label:'Timeline',href:'/projects/work/timeline',group:'Delivery'},
 {label:'Workload',href:'/projects/work/workload',group:'Delivery'},
 {label:'Notes',href:'/projects/work/notes',group:'Collaborate'},
 {label:'Docs',href:'/projects/work/docs',group:'Collaborate'},
 {label:'Calendar',href:'/projects/work/calendar',group:'Collaborate'},
 {label:'Meetings',href:'/projects/meetings',group:'Collaborate'},
 {label:'Reports',href:'/projects/work/reports'},
]};
