import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SIGN_IN_PATH } from "@/auth.config";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSidebarCollections } from "@/lib/db/collections";
import { getSystemItemTypes } from "@/lib/db/items";
import { getCurrentUserId } from "@/lib/db/users";

const SIDEBAR_FAVORITE_COLLECTIONS_LIMIT = 10;
const SIDEBAR_RECENT_COLLECTIONS_LIMIT = 5;

export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  // Written by SidebarProvider on toggle; read here so a collapsed sidebar doesn't flash open on reload.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  // The proxy already redirects signed-out visitors; this narrows the type.
  const session = await auth();
  if (!session?.user) {
    redirect(SIGN_IN_PATH);
  }

  const { name, email, image } = session.user;

  const userId = await getCurrentUserId();
  const [itemTypes, collections] = await Promise.all([
    getSystemItemTypes(userId),
    getSidebarCollections(
      userId,
      SIDEBAR_FAVORITE_COLLECTIONS_LIMIT,
      SIDEBAR_RECENT_COLLECTIONS_LIMIT
    ),
  ]);

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-svh">
      <AppSidebar itemTypes={itemTypes} collections={collections} user={{ name, email, image }} />
      <SidebarInset className="min-w-0 overflow-hidden">
        <TopBar />
        <div className="min-h-0 flex-1 overflow-y-auto p-6 md:px-12 lg:px-16 xl:px-24">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
