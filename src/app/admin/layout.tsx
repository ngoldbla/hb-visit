import type { Metadata } from "next";
import Link from "next/link";
import { Home, Ticket, ClipboardList, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin - HatchBridge Check-In",
  description: "Manage visitor passes and check-ins",
};

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/passes", label: "Passes", icon: Ticket },
  { href: "/admin/checkins", label: "Check-Ins", icon: ClipboardList },
  { href: "/admin/members", label: "Members", icon: Users },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#000824] text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold">HatchBridge</h1>
          <p className="text-sm text-white/60">Visitor Management</p>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            View Kiosk
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
