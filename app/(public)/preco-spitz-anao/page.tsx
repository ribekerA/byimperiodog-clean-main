import { redirect } from "next/navigation";

/** Rota histórica preservada para backlinks; preços ficam na vitrine. */
export default function PrecoSpitzAnaoRedirect() {
  redirect("/filhotes");
}
