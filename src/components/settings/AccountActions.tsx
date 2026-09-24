import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";
import { DeleteAccountDialog } from "@/components/settings/DeleteAccountDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountActionsProps {
  // OAuth-only accounts have no password, so there is nothing to change.
  hasPassword: boolean;
}

export function AccountActions({ hasPassword }: AccountActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>
          {hasPassword
            ? "Change your password, or delete your account and everything in it."
            : "Delete your account and everything in it."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {hasPassword && <ChangePasswordDialog />}
        <DeleteAccountDialog />
      </CardContent>
    </Card>
  );
}
