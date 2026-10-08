// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const state=vi.hoisted(()=>({remove:vi.fn()}));
vi.mock("@/app/(app)/atlas/cleanup/actions",()=>({deleteSelectedTestCompanies:state.remove,retryCompanyFileCleanup:vi.fn()}));
import { CompanyCleanupForm, type CleanupCompany } from "@/app/(app)/atlas/cleanup/cleanup-form";
afterEach(cleanup);
const companies:CleanupCompany[]=["A","B"].map(letter=>({id:`test-${letter}`,name:`Test ${letter}`,updatedAt:"2026-10-08T10:00:00Z",status:"ACTIVE",current:false,users:1,customers:2,products:3,employees:4,files:5}));
it("reviews the exact selected companies before deletion and keeps a rejected confirmation draft",async()=>{
 state.remove.mockResolvedValue({error:"Your administrator password was not recognised."});
 render(<CompanyCleanupForm companies={companies}/>);
 fireEvent.click(screen.getByRole("checkbox",{name:/Test A/}));
 fireEvent.click(screen.getByRole("button",{name:"Review cleanup (1)"}));
 expect(screen.getByText("Test A")).toBeTruthy();expect(screen.queryByText("Test B")).toBeNull();
 fireEvent.change(screen.getByLabelText("Type DELETE 1 TEST COMPANY to confirm"),{target:{value:"DELETE 1 TEST COMPANY"}});
 fireEvent.change(screen.getByLabelText("Your administrator password"),{target:{value:"wrong"}});
 fireEvent.click(screen.getByRole("checkbox"));
 fireEvent.submit(screen.getByRole("button",{name:"Permanently delete 1 company"}).closest("form")!);
 await waitFor(()=>expect(screen.getByRole("alert").textContent).toContain("password was not recognised"));
 expect((screen.getByLabelText("Type DELETE 1 TEST COMPANY to confirm") as HTMLInputElement).value).toBe("DELETE 1 TEST COMPANY");
 expect(JSON.parse((state.remove.mock.calls[0][0] as FormData).get("selectedCompanies") as string)).toEqual([{id:"test-A",name:"Test A",updatedAt:"2026-10-08T10:00:00Z"}]);
});
it("selects all shown while protecting the current workspace",()=>{
 render(<CompanyCleanupForm companies={[companies[0],{...companies[1],current:true}]}/>);
 fireEvent.click(screen.getByRole("button",{name:"Select all shown (1)"}));
 expect((screen.getByRole("checkbox",{name:/Test A/}) as HTMLInputElement).checked).toBe(true);
 expect((screen.getByRole("checkbox",{name:/Test B/}) as HTMLInputElement).disabled).toBe(true);
});
