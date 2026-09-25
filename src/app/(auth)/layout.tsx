import { auth } from "@/auth";
import { HomeNav } from "@/components/home/HomeNav";

export default async function AuthLayout({ children }: LayoutProps<"/">) {
  // A signed-in visitor on these pages gets "Go to Dashboard" in the nav.
  const session = await auth();

  return (
    <>
      <HomeNav isSignedIn={Boolean(session?.user)} logoHref="/" />
      {/* pt-29 is the fixed nav's h-17 plus the old py-12, so the form never
          sits under the nav on a short screen. */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-29 pb-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </>
  );
}
