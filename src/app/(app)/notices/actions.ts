"use server";

import { revalidatePath } from "next/cache";
import { clearNotice as dismissOne, clearNotices as dismissAll, loadNotices as readNotices } from "./load";
import type { Notice } from "./shape";

function refresh() {
  revalidatePath("/home");
  revalidatePath("/audit/echo");
  revalidatePath("/projects/work/inbox");
  revalidatePath("/profile");
}

function publicError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "That notification is no longer here.") return message;
  return "That notification could not be cleared.";
}

export async function loadNotices(): Promise<Notice[]> {
  return readNotices();
}

export async function clearNotice(id: string): Promise<{ error?: string }> {
  try {
    await dismissOne(id);
    refresh();
    return {};
  } catch (error) {
    return { error: publicError(error) };
  }
}

export async function clearNotices(): Promise<{ error?: string }> {
  try {
    await dismissAll();
    refresh();
    return {};
  } catch (error) {
    return { error: publicError(error) };
  }
}
