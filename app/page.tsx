import { redirect } from "next/navigation";

// La radice del sito rimanda sempre alla dashboard: se non c'è sessione,
// proxy.ts ha già rediretto a /login prima ancora di arrivare qui.
export default function Home() {
  redirect("/dashboard");
}
