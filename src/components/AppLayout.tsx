
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  User,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/app-context";
import { useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/logs", label: "Glucose Logs", icon: BookText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/reminders", label: "Smart Reminders", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: User },
];

const NavLinks = () => {
  const pathname = usePathname();
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={label}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            pathname === href && "bg-muted text-primary"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { authState, logout, user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (authState === 'loggedOut') {
      router.replace('/login');
    }
  }, [authState, router]);


  if (authState === 'loading' || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const MobileNavContent = () => {
    const pathname = usePathname();
    return (
      <nav className="grid items-start px-4 text-sm font-medium gap-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <SheetClose asChild key={label}>
            <Link
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                pathname === href && "bg-muted text-primary"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          </SheetClose>
        ))}
      </nav>
    );
  };


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-transparent md:block">
        <div className="flex h-full max-h-screen flex-col gap-2 bg-glass rounded-r-lg">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-primary">
              <HeartPulse className="h-6 w-6" />
              <span className="">GlucoTrack</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <NavLinks />
          </div>
          <div className="mt-auto p-4 border-t">
             <div className="pb-4">
                <p className="font-semibold truncate text-sm">{user?.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
             </div>
            <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-transparent">
        <header className="flex h-14 items-center gap-4 border-b bg-glass px-4 lg:h-[60px] lg:px-6 sticky top-0 z-30">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden bg-glass">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 bg-glass-popover">
               <div className="flex h-14 items-center border-b px-4">
                 <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-primary">
                    <HeartPulse className="h-6 w-6" />
                    <span>GlucoTrack</span>
                 </Link>
              </div>
              <div className="flex-1 overflow-y-auto py-4">
                <MobileNavContent />
              </div>
              <div className="mt-auto p-4 border-t">
                 <div className="pb-4">
                    <p className="font-semibold truncate text-sm">{user?.displayName || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                 </div>
                <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
            {/* Can add search or other header items here */}
          </div>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
