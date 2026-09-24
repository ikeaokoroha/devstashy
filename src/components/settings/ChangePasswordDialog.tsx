"use client";

import { useActionState, useState } from "react";

import { changePassword } from "@/actions/profile";
import { FormField } from "@/components/auth/FormField";
import { FormMessage } from "@/components/auth/FormMessage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  // useActionState has no reset, so the form is remounted each time the dialog
  // opens rather than reopening on the last result.
  const [formKey, setFormKey] = useState(0);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setFormKey((key) => key + 1);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button variant="outline" size="lg" />}>
        Change password
      </DialogTrigger>
      <DialogContent className="p-6">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>
            Enter your current password, then pick a new one.
          </DialogDescription>
        </DialogHeader>
        <ChangePasswordForm key={formKey} onDone={() => handleOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [state, formAction, isPending] = useActionState(changePassword, null);
  const fieldErrors = state?.data?.fieldErrors;

  if (state?.success) {
    return (
      <div className="grid gap-4">
        <FormMessage variant="success">Your password has been changed.</FormMessage>
        <Button size="lg" onClick={onDone}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      {state?.error && <FormMessage variant="error">{state.error}</FormMessage>}
      <FormField
        name="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
        error={fieldErrors?.currentPassword}
        required
      />
      <FormField
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        error={fieldErrors?.password}
        required
      />
      <FormField
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        error={fieldErrors?.confirmPassword}
        required
      />
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Saving..." : "Change password"}
      </Button>
    </form>
  );
}
