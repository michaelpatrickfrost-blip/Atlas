"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
export async function postMessage(form:FormData) {
 const session=await requireSession();
 assertCapability(session,"core.chat.write");
 const body=String(form.get("body")??"").trim();
 if(!body || body.length>4000) throw new Error("Write a message between 1 and 4,000 characters.");
 await db.chatMessage.create({data:{organisationId:session.organisationId,authorUserId:session.userId,body}});
 revalidatePath("/chat");
}
