import { RECORD_KINDS } from "./work";
export type WorkplaceKind = (typeof RECORD_KINDS)[number];
export const recordLabel = (kind: string) => kind.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()).replace("Dse", "DSE").replace("Ppe", "PPE").replace("Rpe", "RPE").replace("Peep", "PEEP");
/** Prompts help capture operational facts; they are not approved assessments or legal templates. */
export const WORKPLACE_PROMPTS: Partial<Record<WorkplaceKind, string[]>> = {
 DSE_ASSESSMENT: ["Workstation and equipment", "Chair, screen and posture", "Lighting, breaks and working arrangements", "Adjustments needed"],
 FIRE_ASSESSMENT: ["Ignition and fuel sources", "People at risk", "Escape routes and detection", "Controls and outstanding improvements"],
 FIRE_DRILL: ["Scenario and alarm raised", "Evacuation and assembly observations", "Time taken and people accounted for", "Lessons and changes"],
 EMERGENCY_PLAN: ["Emergency scenarios", "Alarm and evacuation arrangements", "Assembly points and responsible contacts", "Assistance and recovery arrangements"],
 PEEP: ["Operational evacuation assistance", "Route and safe meeting point", "Named assistance and cover", "Practice and review arrangements"],
 FIRST_AID_NEED: ["Workplace hazards and workforce", "Shift and absence cover", "Facilities and equipment", "Required first-aid arrangements"],
 FIRST_AIDER: ["First-aid role and cover", "Qualification and certificate reference", "Availability and contact arrangements", "Renewal arrangements"],
 FIRST_AID_KIT: ["Kit location and identifier", "Contents checked and missing items", "Expiry and condition findings", "Replenishment required"],
 METHOD_STATEMENT: ["Task and work sequence", "Equipment and competence required", "Controls at each step", "Stop conditions and emergency arrangements"],
 LIFTING_PLAN: ["Load and lifting operation", "Equipment, accessories and checks", "Roles, competence and exclusion zone", "Conditions, communications and contingency"],
 LONE_WORK: ["Task and lone-working hazards", "Check-in arrangements", "Missed check-in escalation and contacts", "Emergency arrangements"],
 CONTRACTOR_PROFILE: ["Contractor and scope of work", "Competence and evidence checked", "Induction and coordination", "Supervision and permit requirements"],
 TOOLBOX_TALK: ["Topic and key messages", "Attendees and delivery date", "Questions and worker feedback", "Understanding and follow-up"],
 INDUCTION: ["Person or group and work area", "Hazards, controls and emergency information", "Trainer and understanding checked", "Restrictions and follow-up"],
 MANUAL_HANDLING: ["Task, load and environment", "People and handling demands", "Avoidance and handling aids", "Remaining controls and training"],
 WORK_AT_HEIGHT: ["Task and access method", "Avoidance and fall prevention", "Equipment and competence checks", "Rescue and emergency arrangements"],
 HEALTH_REQUIREMENT: ["Work exposure requiring review", "Surveillance arrangements and provider reference", "Work-relevant restrictions or outcome", "Next review arrangements — no clinical detail"],
 NOISE: ["Task, sources and exposed groups", "Measurement reference and findings", "Exposure reduction controls", "Protection, information and review"],
 VIBRATION: ["Tools, tasks and exposed groups", "Exposure assessment reference", "Reduction and maintenance controls", "Information and review arrangements"],
 ASBESTOS: ["Survey or register reference and scope", "Known or presumed materials and locations", "Condition and access restrictions", "Management and contractor communication"],
 LEGIONELLA: ["Water systems and assessment reference", "Responsible contacts", "Monitoring and control arrangements", "Findings and remedial work"],
};
export const DEFAULT_PROMPTS = ["Task, people or equipment covered", "Hazards and findings", "Controls and arrangements", "Checks and follow-up needed"];
export const WORKPLACE_FIELDS = ["location", "responsible", "detail", "finding1", "finding2", "finding3", "finding4", "followUp", "evidence", "completionNote"] as const;
export class WorkplaceValidationError extends Error {}
export function workplaceInput(form: FormData) {
 const read=(key:string,max=6000)=>{const raw=form.get(key);if(raw!==null&&typeof raw!=="string")throw new WorkplaceValidationError("Use text for record fields.");const value=String(raw??"").trim();if(value.length>max)throw new WorkplaceValidationError(`${key} is too long (maximum ${max} characters).`);return value;};
 const kind=read("kind",80);
 if(!RECORD_KINDS.includes(kind as WorkplaceKind))throw new WorkplaceValidationError("Choose a workplace record type.");
 const title=read("title",200);if(!title)throw new WorkplaceValidationError("Give the record a title.");
 const status=read("status",30)||"OPEN";
 if(!["OPEN","IN_PROGRESS","COMPLETE"].includes(status))throw new WorkplaceValidationError("Choose an available record status.");
 const payload=Object.fromEntries(WORKPLACE_FIELDS.map(key=>[key,read(key,key==="location"||key==="responsible"?300:6000)]));
 if(status==="COMPLETE"&&payload.completionNote.length<10)throw new WorkplaceValidationError("Record what was completed or checked before marking this complete.");
 const due=read("dueAt",10);let dueAt:Date|null=null;
 if(due){dueAt=new Date(`${due}T00:00:00.000Z`);if(!/^\d{4}-\d{2}-\d{2}$/.test(due)||Number.isNaN(dueAt.getTime())||dueAt.toISOString().slice(0,10)!==due)throw new WorkplaceValidationError("Enter a valid review date.");}
 return {kind,title,status,payload,dueAt};
}
export function recordDue(dueAt: Date|null,status:string,now=new Date()) {
 if(status==="COMPLETE")return "Complete";
 if(!dueAt)return "No review date";
 const today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()));
 if(dueAt<today)return "Overdue";
 if(dueAt.getTime()<=today.getTime()+30*86400000)return "Due within 30 days";
 return "Scheduled";
}
