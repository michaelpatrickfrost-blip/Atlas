// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor} from "@testing-library/react";
import {afterEach,expect,it,vi} from "vitest";
import {ActionForm} from "@/components/ui/action-form";
import {withFormFeedback} from "@/core/shared/form-feedback";
afterEach(cleanup);
it("preserves the entered plan after explicit production validation feedback",async()=>{
  const action=vi.fn().mockResolvedValue({error:"This task changed. Refresh the board."});
  render(<ActionForm action={action} label="Save work"><label>Brief<input name="brief" defaultValue="Original"/></label></ActionForm>);
  fireEvent.change(screen.getByLabelText("Brief"),{target:{value:"Unsaved handover"}});fireEvent.click(screen.getByRole("button",{name:"Save work"}));
  await waitFor(()=>expect(screen.getByRole("alert").textContent).toContain("task changed"));
  expect((screen.getByLabelText("Brief") as HTMLInputElement).value).toBe("Unsaved handover");expect(action).toHaveBeenCalledTimes(1);
});
it("returns intended domain guidance without relying on production exception messages",async()=>{expect(await withFormFeedback(async()=>{throw new Error("Review the approved time first.");})).toEqual({error:"Review the approved time first."});});
it("does not disclose a database driver's private error detail",async()=>{class DriverFailure extends Error{} const result=await withFormFeedback(async()=>{throw new DriverFailure("private connection detail");});expect(result?.error).toContain("Could not save");expect(JSON.stringify(result)).not.toContain("private connection");});
it("preserves successful framework redirects",async()=>{const redirect=Object.assign(new Error("redirect"),{digest:"NEXT_REDIRECT;replace;/payroll/one;307;"});await expect(withFormFeedback(async()=>{throw redirect;})).rejects.toBe(redirect);});
