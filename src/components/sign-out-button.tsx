"use client";

import { LogOut } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/browser";
import { useI18n } from "@/lib/i18n";

export function SignOutButton() {
  const { t } = useI18n();

  if (!isSupabaseConfigured) return null;

  async function onSignOut() {
    const supabase = createClient();
    await supabase?.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button className="btn-secondary" type="button" onClick={onSignOut}>
      <LogOut size={16} />
      {t("signOut")}
    </button>
  );
}
