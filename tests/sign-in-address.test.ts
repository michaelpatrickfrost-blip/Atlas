import {describe,it,expect} from "vitest";
import {signInAddress} from "@/core/auth/address-context";
describe("server sign-in address binding",()=>{
 it("uses the observed business login and recovery URL",()=>{
  for(const destination of ["login","reset-password"]) expect(signInAddress(`/business/company-a/${destination}`,{portal:"",companySlug:"company-a"})).toEqual({portal:"",companySlug:"company-a"});
 });
 it("cannot select a different business or platform portal with a hidden field",()=>{
  expect(()=>signInAddress("/business/company-a/login",{portal:"",companySlug:"company-b"})).toThrow("sign-in address");
  expect(()=>signInAddress("/business/company-a/reset-password",{portal:"atlas",companySlug:"company-a"})).toThrow("sign-in address");
  expect(()=>signInAddress("/login",{portal:"",companySlug:"company-a"})).toThrow("sign-in address");
 });
 it("keeps Admin and legacy generic addresses distinct",()=>{
  expect(signInAddress("/atlas/reset-password",{portal:"atlas",companySlug:""})).toEqual({portal:"atlas",companySlug:""});
  expect(signInAddress("/login",{portal:"",companySlug:""})).toEqual({portal:"",companySlug:""});
 });
});
