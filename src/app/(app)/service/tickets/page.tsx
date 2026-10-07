import { redirect } from "next/navigation";
/** Existing service-ticket bookmarks now open the connected Department Tickets workspace. */
export default function LegacyServiceTickets() { redirect("/tickets"); }
