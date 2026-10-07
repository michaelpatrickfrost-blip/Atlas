import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({response:{findUnique:vi.fn(),updateMany:vi.fn()},serviceCase:{findFirst:vi.fn(),updateMany:vi.fn()},entry:{create:vi.fn()},outbox:{create:vi.fn()},emit:vi.fn()}));
vi.mock("@/core/db/client",()=>({db:{csatResponse:state.response,$transaction:async(fn: (tx:unknown)=>unknown)=>fn({csatResponse:state.response,serviceCase:state.serviceCase,serviceEntry:state.entry,domainOutbox:state.outbox})}}));
vi.mock("@/core/events/bus",()=>({emit:state.emit,DOMAIN_EVENTS:{csatResponded:"csat.responded"}}));
vi.mock("@/core/auth/session",()=>({requireSession:vi.fn()}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));vi.mock("next/navigation",()=>({redirect:vi.fn()}));
import {recordCsatScore,recordCsatComment} from "@/modules/csat/services/actions";
beforeEach(()=>{vi.resetAllMocks();state.response.findUnique.mockResolvedValue({id:"response",organisationId:"org",entityType:"ServiceCase",entityId:"case",survey:{reasons:["Helpful"]}});state.response.updateMany.mockResolvedValue({count:1});state.serviceCase.findFirst.mockResolvedValue({id:"case",ownerUserId:"agent"});});
describe("customer feedback integrity",()=>{
 it("atomically claims a first response and links negative feedback to the case owner",async()=>{await recordCsatScore("token",1);expect(state.response.updateMany).toHaveBeenCalledWith(expect.objectContaining({where:{token:"token",respondedAt:null}}));expect(state.entry.create).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({kind:"CSAT_RECOVERY_NEEDED",caseId:"case",authorUserId:"agent"})}));});
 it("does not overwrite an existing score",async()=>{state.response.findUnique.mockResolvedValue({respondedAt:new Date()});expect(await recordCsatScore("token",5)).toBeNull();expect(state.response.updateMany).not.toHaveBeenCalled();});
 it("allows only one concurrent winner",async()=>{state.response.updateMany.mockResolvedValue({count:0});expect(await recordCsatScore("token",4)).toBeNull();expect(state.entry.create).not.toHaveBeenCalled();expect(state.emit).not.toHaveBeenCalled();});
 it("claims one comment and accepts only configured reasons",async()=>{await recordCsatComment("token","Thank you",["Helpful","invented"]);expect(state.response.updateMany).toHaveBeenCalledWith(expect.objectContaining({where:{token:"token",respondedAt:{not:null},commentSubmittedAt:null},data:expect.objectContaining({reasons:["Helpful"]})}));});
});
