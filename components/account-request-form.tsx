"use client";

import { type FormEvent, useState } from "react";
import { LoaderCircle, Mail, MailCheck } from "lucide-react";
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
      <p
        role="status"
        className="callout flex gap-3 text-[0.9375rem] leading-6 text-ink"
      >
        <MailCheck
          className="mt-0.5 size-5 shrink-0 text-blue-france"
          aria-hidden="true"
        />
        <span>
          Vérifiez votre boîte email. Le lien personnel est valable 15 minutes.
        </span>
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="standalone-account-email" className="font-semibold">
          Votre email
        </Label>
        <Input
          id="standalone-account-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          placeholder="vous@exemple.fr"
          className="h-12"
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
      <Button
        className="h-12 w-full bg-blue-france font-semibold text-white hover:bg-blue-france-hover"
        disabled={working}
      >
        {working ? (
          <LoaderCircle className="animate-spin" />
        ) : (
          <Mail className="size-4" />
        )}
        Recevoir mon lien sécurisé
      </Button>
    </form>
  );
}
