import { Layers } from "lucide-react";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12">
      <div className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-blue-500 text-white">
          <Layers className="size-4" />
        </span>
        <span className="text-lg font-semibold">Devstashy</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
