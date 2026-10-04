import { redirect } from "next/navigation";

/** Dashboards is its own app. Old CRM links leave CRM. */
export default function Page() {
  redirect("/analytics");
}
