"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, ClipboardList, Users, Target, Quote, Settings, LogOut } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/checkins", label: "Check-Ins", icon: ClipboardList },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/community", label: "Community", icon: Target },
  { href: "/admin/quotes", label: "Quotes", icon: Quote },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't show sidebar on login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname === item.href
                      ? "bg-white/10 text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-white/10 space-y-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            View Kiosk
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white w-full"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
