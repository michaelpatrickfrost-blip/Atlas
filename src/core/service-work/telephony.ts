/** Future connector boundary. Manual call logs are the only installed implementation. */
export type ServiceCallEvent = {
 organisationId:string; provider:string; externalCallId:string;
 direction:"INBOUND"|"OUTBOUND"; from:string; to:string;
 startedAt:Date; endedAt:Date|null; durationSeconds:number|null;
 caseId?:string; workId?:string; agentUserId?:string;
 consentReference?:string; recordingReference?:string;
};
export interface ServiceTelephonyConnector {
 readonly id:string;
 verifyWebhook(headers:Record<string,string>,body:Uint8Array):Promise<boolean>;
 normaliseEvent(body:unknown):Promise<ServiceCallEvent>;
 recording(event:ServiceCallEvent):Promise<{url:string;expiresAt:Date}|null>;
}
