"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
export async function saveProfile(form: FormData) {
 const session = await requireSession();
 assertCapability(session, "core.profile.self");
 const name = String(form.get("name") ?? "").trim();
 if (!name || name.length > 100) throw new Error("Enter a name between 1 and 100 characters.");
 await db.user.update({where:{id:session.userId}, data:{name}});
 revalidatePath("/", "layout");
}
