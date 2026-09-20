import { signInWithGitHub } from "@/actions/auth";
import { GitHubIcon } from "@/components/shared/GitHubIcon";
import { Button } from "@/components/ui/button";

interface GitHubSignInButtonProps {
  callbackUrl?: string;
}

export function GitHubSignInButton({ callbackUrl }: GitHubSignInButtonProps) {
  return (
    <form action={signInWithGitHub}>
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <Button type="submit" variant="outline" size="lg" className="w-full">
        <GitHubIcon />
        Sign in with GitHub
      </Button>
    </form>
  );
}
