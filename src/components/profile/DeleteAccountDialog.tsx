"use client";

import { useActionState, useState } from "react";

import { deleteAccount } from "@/actions/profile";
import { FormField } from "@/components/auth/FormField";
import { FormMessage } from "@/components/auth/FormMessage";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DELETE_CONFIRMATION } from "@/lib/profile";

export function DeleteAccountDialog() {
  const [state, formAction, isPending] = useActionState(deleteAccount, null);
  // The confirmation has to be typed exactly, so the button can't be hit by accident.
  const [confirmation, setConfirmation] = useState("");

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" size="lg" />}>
        Delete account
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form action={formAction} className="grid gap-4">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account along with every item and collection
              in it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {state?.error && <FormMessage variant="error">{state.error}</FormMessage>}
          <FormField
            name="confirmation"
            label={`Type ${DELETE_CONFIRMATION} to confirm`}
            autoComplete="off"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            required
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <Button
              type="submit"
              variant="destructive"
              disabled={isPending || confirmation !== DELETE_CONFIRMATION}
            >
              {isPending ? "Deleting..." : "Delete account"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
