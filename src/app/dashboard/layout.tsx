import { TopBar } from "@/components/dashboard/TopBar";

export default function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  return (
    <div className="flex h-screen flex-col">
      <TopBar />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 border-r p-4 md:block">
          <h2 className="text-lg font-semibold">Sidebar</h2>
        </aside>
        <main className="min-w-0 flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
