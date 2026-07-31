"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RotateCcw, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ManagementActions({
  endpoint,
  status,
}: {
  endpoint: string;
  status: string;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);

  async function update(action: "close" | "reopen") {
    setWorking(true);
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);
      toast.success(
        action === "close" ? "Annonce fermée" : "Annonce réouverte",
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Action impossible.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        "Supprimer définitivement cette annonce et toutes ses réponses ?",
      )
    ) {
      return;
    }
    setWorking(true);
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error);
      toast.success("Annonce supprimée");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "closed" ? (
        <Button
          variant="outline"
          disabled={working}
          onClick={() => update("reopen")}
        >
          {working ? <LoaderCircle className="animate-spin" /> : <RotateCcw />}
          Réouvrir
        </Button>
      ) : (
        <Button
          variant="outline"
          disabled={working}
          onClick={() => update("close")}
        >
          {working ? <LoaderCircle className="animate-spin" /> : <XCircle />}
          Marquer comme résolue
        </Button>
      )}
      <Button variant="destructive" disabled={working} onClick={remove}>
        <Trash2 />
        Supprimer
      </Button>
    </div>
  );
}
