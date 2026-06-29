import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ACCESS_TOKEN_KEY } from "@/utils/constants";

export default function RootPage() {
  const cookieStore = cookies();
  const token = cookieStore.get(ACCESS_TOKEN_KEY);
  redirect(token ? "/dashboard" : "/login");
}
