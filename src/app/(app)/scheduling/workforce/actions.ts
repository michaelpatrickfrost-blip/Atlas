"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { revalidatePath } from "next/cache";
import * as workforce from "@/modules/scheduling/services/workforce";

function refresh() { for(const path of ["/scheduling","/scheduling/workforce","/profile","/people/me"])revalidatePath(path); }
export async function getWorkforce(day:string,department:string) {const session=await requireSession();assertCapability(session,"core.profile.self");return workforce.loadWorkforce(session,day,department);}
export async function placeBreak(form:FormData) {const session=await requireSession();assertCapability(session,"core.profile.self");await workforce.placeBreak(session,form);refresh();}
export async function saveActivity(form:FormData) {const session=await requireSession();assertCapability(session,"core.profile.self");await workforce.saveActivity(session,form);refresh();}
export async function removeActivity(form:FormData) {const session=await requireSession();assertCapability(session,"core.profile.self");await workforce.removeActivity(session,form);refresh();}
export async function saveInterval(form:FormData) {const session=await requireSession();assertCapability(session,"core.profile.self");await workforce.saveInterval(session,form);refresh();}
export async function removeInterval(form:FormData) {const session=await requireSession();assertCapability(session,"core.profile.self");await workforce.removeInterval(session,form);refresh();}
export async function createOpening(form:FormData) {const session=await requireSession();assertCapability(session,"core.profile.self");await workforce.createOpening(session,form);refresh();}
export async function requestOpening(form:FormData) {const session=await requireSession();assertCapability(session,"core.profile.self");await workforce.requestOpening(session,form);refresh();}
export async function decideOpening(form:FormData) {const session=await requireSession();assertCapability(session,"core.profile.self");await workforce.decideOpening(session,form);refresh();}
export async function cancelOpening(form:FormData) {const session=await requireSession();assertCapability(session,"core.profile.self");await workforce.cancelOpening(session,form);refresh();}
export async function saveAvailability(form:FormData) {const session=await requireSession();assertCapability(session,"core.profile.self");await workforce.saveAvailability(session,form);refresh();}
export async function removeAvailability(form:FormData) {const session=await requireSession();assertCapability(session,"core.profile.self");await workforce.removeAvailability(session,form);refresh();}
