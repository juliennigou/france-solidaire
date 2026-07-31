"use client";

import { type FormEvent, useState } from "react";
import { LoaderCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountRequestForm() {
  const [working, setWorking] = useState(false);
  const [queued, setQueued] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setWorking(true);
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          website: form.get("website"),
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);
      setQueued(true);
      toast.success("Lien de connexion mis en file");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Connexion impossible.",
      );
    } finally {
      setWorking(false);
    }
  }

  if (queued) {
    return (
      <p role="status" className="rounded-xl bg-teal/8 p-4 text-sm text-teal">
        Vérifiez votre boîte email. Le lien personnel est valable 15 minutes.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="standalone-account-email">Votre email</Label>
        <Input
          id="standalone-account-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
        />
      </div>
      <div className="hidden" aria-hidden="true">
        <Label htmlFor="standalone-account-website">Site internet</Label>
        <Input
          id="standalone-account-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <Button className="w-full bg-ink text-white" disabled={working}>
        {working ? <LoaderCircle className="animate-spin" /> : <Mail />}
        Recevoir mon lien sécurisé
      </Button>
    </form>
  );
}
