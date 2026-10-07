import {beforeEach,describe,expect,it,vi} from "vitest";
import type {Session} from "@/core/auth/session";
const state=vi.hoisted(()=>({tx:{logisticsOperation:{findUnique:vi.fn(),create:vi.fn()},returnLine:{findFirst:vi.fn(),updateMany:vi.fn()},returnAuthorisation:{update:vi.fn()},warehouse:{findFirst:vi.fn()},auditEntry:{create:vi.fn()},domainOutbox:{create:vi.fn()}},stock:vi.fn()}));
vi.mock("@/core/db/client",()=>({db:{$transaction:async(fn: (tx:typeof state.tx)=>unknown)=>fn(state.tx)}}));
vi.mock("@/modules/logistics/services/numbers",()=>({stock:async()=>({returnStock:state.stock}),milestone:vi.fn(),nextReference:vi.fn()}));
import {receiveReturn} from "@/modules/logistics/services/returns";
const session={organisationId:"org",userId:"agent"} as Session;
const input={quantity:2,condition:"DAMAGED",requestKey:"receipt-1"};
beforeEach(()=>{vi.resetAllMocks();state.tx.returnLine.findFirst.mockResolvedValue({id:"line",returnId:"return",productId:"product",quantity:5,receivedQuantity:2,serials:[],returnAuthorisation:{reference:"RMA-1",status:"AWAITING_GOODS"}});state.tx.warehouse.findFirst.mockResolvedValue({id:"warehouse"});state.tx.returnLine.updateMany.mockResolvedValue({count:1});});
describe("safe return receipt",()=>{
 it("rejects over-receipt before any inventory mutation",async()=>{await expect(receiveReturn(session,"line",{...input,quantity:4})).rejects.toThrow("exceeds");expect(state.stock).not.toHaveBeenCalled();});
 it("rejects receipt of an unauthorised return",async()=>{state.tx.returnLine.findFirst.mockResolvedValue({returnAuthorisation:{status:"REQUESTED"}});await expect(receiveReturn(session,"line",input)).rejects.toThrow("Authorise");expect(state.stock).not.toHaveBeenCalled();});
 it("does not increment quantity again on a retry",async()=>{state.tx.logisticsOperation.findUnique.mockResolvedValue({action:"RETURN_RECEIPT",result:{lineId:"line",...input}});await receiveReturn(session,"line",input);expect(state.stock).not.toHaveBeenCalled();expect(state.tx.returnLine.updateMany).not.toHaveBeenCalled();});
 it("rejects replay with different goods",async()=>{state.tx.logisticsOperation.findUnique.mockResolvedValue({action:"RETURN_RECEIPT",result:{lineId:"other",...input}});await expect(receiveReturn(session,"line",input)).rejects.toThrow("different goods");});
 it("receives into quarantine in the same transaction as the receipt",async()=>{await receiveReturn(session,"line",input);expect(state.stock).toHaveBeenCalledWith(session,expect.objectContaining({quantity:2,status:"QUARANTINE",sourceId:"line"}),state.tx);expect(state.tx.logisticsOperation.create).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({organisationId:"org",action:"RETURN_RECEIPT"})}));});
});
