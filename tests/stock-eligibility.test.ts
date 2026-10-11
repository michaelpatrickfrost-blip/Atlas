import {describe,it,expect} from "vitest";
import {eligiblePositions,unreservedPositions} from "@/modules/stock/domain/eligibility";
import {addQuantity,validQuantity} from "@/core/shared/quantity";
const positions=[{id:"a",warehouseId:"w",locationId:"a",lotId:"old",status:"AVAILABLE",quantity:0.25},{id:"b",warehouseId:"w",locationId:"b",lotId:"fresh",status:"AVAILABLE",quantity:0.75}];
const lots=[{id:"old",code:"RAW-OLD",expiresOn:new Date("2030-01-01"),removalOn:new Date("2029-01-01")},{id:"fresh",code:"RAW-NEW",expiresOn:new Date("2031-01-01"),removalOn:null}];
describe("usable fractional physical stock",()=>{
 it("allocates a general reservation once across bins",()=>{expect(unreservedPositions(positions,[{id:"r",locationId:null,lotId:"",quantity:0.3}]).reduce((sum,row)=>addQuantity(sum,row.quantity),0)).toBe(0.7);});
 it("protects a selected lot before a general reservation",()=>{const rows=unreservedPositions(positions,[{id:"g",locationId:null,lotId:"",quantity:0.1},{id:"s",locationId:null,lotId:"fresh",quantity:0.7}]);expect(rows.reduce((sum,row)=>addQuantity(sum,row.quantity),0)).toBe(0.2);expect(rows.find(row=>row.lotId==="fresh")?.quantity).toBe(0.05);});
 it("excludes expired stock and quarantined positions",()=>{expect(eligiblePositions([...positions,{...positions[1],id:"q",status:"QUARANTINE"}],lots,[],"LOT",new Date("2030-06-01")).map(row=>row.id)).toEqual(["b"]);});
 it("honours batch holds without excluding a different batch",()=>{expect(eligiblePositions(positions,lots,[{warehouseId:"w",locationId:null,lotCode:"RAW-OLD"}],"LOT",new Date("2026-01-01")).map(row=>row.id)).toEqual(["b"]);});
 it("refuses anonymous stock for lot tracking",()=>{expect(eligiblePositions([{...positions[0],lotId:""}],lots,[],"LOT")).toEqual([]);});
 it("keeps other warehouses outside a local hold",()=>{expect(eligiblePositions(positions,lots,[{warehouseId:"another",locationId:null,lotCode:null}],"LOT",new Date("2026-01-01"))).toHaveLength(2);});
 it("accepts large six-place quantities without floating-point false rejection",()=>{expect(validQuantity(123456.123456)).toBe(true);expect(validQuantity(0.0000001)).toBe(false);expect(addQuantity(0.1,0.2,-0.3)).toBe(0);});
});
