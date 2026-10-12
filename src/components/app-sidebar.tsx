import { SidebarContent } from "@/components/sidebar-content";

export function AppSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
      <SidebarContent />
    </aside>
  );
}