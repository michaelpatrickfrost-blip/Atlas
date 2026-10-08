/** Optional planning detail; canonical campaign/audience/product identities remain separate. */
export const CAMPAIGN_DETAIL_GROUPS = [
  { title: 'Audience and insight', fields: [
    ['customerProblem', 'Customer problem', 'What problem are we helping them solve?'],
    ['customerInsight', 'Customer insight', 'Research, interviews or buying behaviour behind the idea.'],
    ['exclusions', 'Who to exclude', 'People or markets this campaign is not for. This is planning guidance; delivery eligibility still applies.'],
    ['competitors', 'Competitors and alternatives', 'What else might the customer choose?'],
  ] },
  { title: 'Creative and delivery', fields: [
    ['proofPoints', 'Proof points', 'Evidence, testimonials and claims we can support.'],
    ['toneOfVoice', 'Tone of voice', 'How the campaign should sound and feel.'],
    ['deliverables', 'Creative deliverables', 'Copy, images, video, landing pages and formats needed.'],
    ['approvalNotes', 'Review and approval requirements', 'Who needs to review claims, artwork or offers? These notes do not grant approval.'],
  ] },
  { title: 'Measurement and follow-up', fields: [
    ['successMeasure', 'Success measures', 'What does success look like, and by when?'],
    ['measurementPlan', 'Measurement plan', 'Where results come from, attribution assumptions and review dates.'],
    ['salesHandoff', 'Sales handoff', 'What makes a lead ready, who receives it and how quickly to respond.'],
    ['followUpPlan', 'Follow-up plan', 'What happens after an enquiry, event or first order?'],
    ['lessonsLearned', 'Results and lessons learned', 'What worked, what did not and what to repeat.'],
    ['notes', 'Additional notes', 'Anything else the team needs to know.'],
  ] },
] as const;
export type CampaignDetails = { fields: Record<string,string>; custom: {label:string;value:string}[]; resources: {label:string;url:string}[] };
const object = (value:unknown):Record<string,unknown> => value!==null && typeof value==='object' && !Array.isArray(value)?value as Record<string,unknown>:{};
export function readCampaignDetails(brief:unknown):CampaignDetails {
  const data=object(object(brief).workspace),fields=object(data.fields);
  return {fields:Object.fromEntries(CAMPAIGN_DETAIL_GROUPS.flatMap(group=>group.fields.map(([key])=>[key,typeof fields[key]==='string'?fields[key]:'']))),
    custom:Array.isArray(data.custom)?data.custom.filter((row):row is {label:string;value:string}=>typeof object(row).label==='string'&&typeof object(row).value==='string').slice(0,20):[],
    resources:Array.isArray(data.resources)?data.resources.filter((row):row is {label:string;url:string}=>typeof object(row).label==='string'&&typeof object(row).url==='string'&&safeResourceUrl(String(object(row).url))).slice(0,20):[]};
}
export function safeResourceUrl(value:string):boolean {try {const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password;}catch{return false;}}
export function parseCampaignDetails(form:FormData):CampaignDetails {
  const field=(value:FormDataEntryValue|null,max:number,label:string)=>{const text=String(value??'').trim();if(text.length>max)throw new Error(`${label} is too long (maximum ${max} characters).`);return text;};
  const fields=Object.fromEntries(CAMPAIGN_DETAIL_GROUPS.flatMap(group=>group.fields.map(([key,label])=>[key,field(form.get(`detail:${key}`),5000,label)])));
  const labels=form.getAll('customLabel'),values=form.getAll('customValue'),resourceLabels=form.getAll('resourceLabel'),urls=form.getAll('resourceUrl');
  if(labels.length!==values.length||resourceLabels.length!==urls.length)throw new Error('Each custom field and resource must have matching values.');
  if(labels.length>20||values.length>20||resourceLabels.length>20||urls.length>20)throw new Error('Add up to 20 custom fields and 20 resource links.');
  const custom=labels.map((label,index)=>({label:field(label,100,'Custom field name'),value:field(values[index]??null,5000,'Custom field value')})).filter(row=>row.label||row.value);
  if(custom.some(row=>!row.label))throw new Error('Give each custom field a name.');
  if(new Set(custom.map(row=>row.label.toLowerCase())).size!==custom.length)throw new Error('Use a different name for each custom field.');
  const resources=resourceLabels.map((label,index)=>({label:field(label,150,'Resource name'),url:field(urls[index]??null,2000,'Resource URL')})).filter(row=>row.label||row.url);
  if(resources.some(row=>!row.label||!safeResourceUrl(row.url)))throw new Error('Give each resource a name and a valid http or https link without login credentials.');
  return {fields,custom,resources};
}
export function mergeCampaignDetails(brief:unknown,details:CampaignDetails) {return {...object(brief),workspace:{...object(object(brief).workspace),...details}};}
