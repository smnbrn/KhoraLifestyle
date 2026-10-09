"use server";

import { redirect } from "next/navigation";

import { signOut } from "@/services/auth.service";

export async function logout() {
  await signOut();
  redirect("/login");
}
