import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserMenuClient } from "@/components/user-menu-client";

export async function UserMenu() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const email = data.user.email ?? "";
  const initials =
    email
      .split("@")[0]
      ?.slice(0, 2)
      .toUpperCase() ?? "U";

  return <UserMenuClient email={email} initials={initials} />;
}