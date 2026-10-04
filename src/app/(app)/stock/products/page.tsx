import { redirect } from "next/navigation";

/** The catalogue belongs to Products, not Inventory. */
export default function Page() {
  redirect("/products");
}
