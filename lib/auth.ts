import { cookies } from "next/headers";

export function login() {
  cookies().set("auth", "true");
}

export function logout() {
  cookies().delete("auth");
}

export function isAuthenticated() {
  return cookies().get("auth")?.value === "true";
}
