"use server";

import { revalidatePath } from "next/cache";
import { createContract, deleteContract, sendContract } from "@/core/contracts/actions";

/** Upload a contract against a customer and, if an email is given, send it for signature straight away. */
export async function newContractAction(form: FormData) {
  if (!String(form.get("partyId") ?? "")) throw new Error("Choose the customer this contract is with.");
  const contract = await createContract(form);
  const to = String(form.get("to") ?? "").trim();
  if (to) {
    const send = new FormData();
    send.set("id", contract.id); send.set("to", to); send.set("accountId", String(form.get("accountId") ?? "")); send.set("validDays", String(form.get("validDays") ?? "30"));
    await sendContract(send);
  }
  revalidatePath("/sales/contracts");
}

export async function resendContractAction(form: FormData) {
  await sendContract(form);
  revalidatePath("/sales/contracts");
}

export async function deleteContractAction(form: FormData) {
  await deleteContract(form);
  revalidatePath("/sales/contracts");
}
