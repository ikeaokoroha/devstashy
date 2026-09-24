import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SIGN_IN_PATH } from "@/auth.config";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { EditorPreferencesProvider } from "@/components/editor/EditorPreferencesProvider";
import { ItemDrawerProvider } from "@/components/items/ItemDrawerProvider";
import { SearchProvider } from "@/components/search/SearchProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSidebarCollections } from "@/lib/db/collections";
import { getSystemItemTypes } from "@/lib/db/items";
import { getEditorPreferences } from "@/lib/db/users";

const SIDEBAR_FAVORITE_COLLECTIONS_LIMIT = 10;
const SIDEBAR_RECENT_COLLECTIONS_LIMIT = 5;

// The signed-in shell: sidebar and top bar around /dashboard, /profile and the
// pages that follow.
export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Written by SidebarProvider on toggle; read here so a collapsed sidebar doesn't flash open on reload.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  // The proxy already redirects signed-out visitors; this narrows the type.
  const session = await auth();
  if (!session?.user?.id) {
    redirect(SIGN_IN_PATH);
  }

  const { id: userId, name, email, image } = session.user;

  const [itemTypes, collections, editorPreferences] = await Promise.all([
    getSystemItemTypes(userId),
    getSidebarCollections(
      userId,
      SIDEBAR_FAVORITE_COLLECTIONS_LIMIT,
      SIDEBAR_RECENT_COLLECTIONS_LIMIT
    ),
    getEditorPreferences(userId),
  ]);

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-svh">
      <AppSidebar itemTypes={itemTypes} collections={collections} user={{ name, email, image }} />
      <SidebarInset className="min-w-0 overflow-hidden">
        {/* All three providers wrap the top bar as well as the page: the command
            palette's trigger lives there, selecting a result opens the same drawer
            an item card does, and the editors inside both the drawer and the New
            Item dialog read the editor settings. */}
        <EditorPreferencesProvider preferences={editorPreferences}>
          <ItemDrawerProvider>
            <SearchProvider>
              <TopBar />
              <div className="min-h-0 flex-1 overflow-y-auto p-6 md:px-12 lg:px-16 xl:px-24">
                {children}
              </div>
            </SearchProvider>
          </ItemDrawerProvider>
        </EditorPreferencesProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
