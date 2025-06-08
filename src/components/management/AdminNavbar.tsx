"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Zap,
  Building,
  MapPin,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserData {
  userId: string;
  email: string;
  isAdmin: boolean;
}

export default function AdminNavbar() {
  const pathname = usePathname();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/v1/auth/user");
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setUserData(result.data);
          } else {
            // Redirect to login if not authenticated
            window.location.href = "/admin/login";
          }
        } else {
          // Redirect to login on auth failure
          window.location.href = "/admin/login";
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        window.location.href = "/admin/login";
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/v1/admin/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (email: string) => {
    return email.split("@")[0].substring(0, 2).toUpperCase();
  };

  const navItems = [
    {
      href: "/management/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/management/interruptions",
      label: "Interruptions",
      icon: Zap,
    },
  ];

  if (isLoading) {
    return (
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <Link
              href="/management/dashboard"
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">IM</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Iloilo Feeder Map
                </h1>
                <p className="text-sm text-muted-foreground">Admin Panel</p>
              </div>
            </Link>
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const userEmail = userData?.email || "";

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <Link
            href="/management/dashboard"
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">IM</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Iloilo Feeder Map
              </h1>
              <p className="text-sm text-muted-foreground">Admin Panel</p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary/20 text-primary shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 px-3 py-2 hover:bg-background/50 transition-colors"
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-sm font-semibold">
                    {getInitials(userEmail)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium truncate max-w-32">
                    {userEmail.split("@")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-0 bg-background/95 backdrop-blur-xl border border-white/20 shadow-2xl"
              align="end"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-semibold">
                      {getInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{userEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      Administrator
                    </p>
                  </div>
                </div>

                <Separator className="bg-white/20" />

                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-background/50"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoggingOut ? "Signing out..." : "Sign out"}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex space-x-1 overflow-x-auto pb-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200",
                  isActive
                    ? "bg-primary/20 text-primary shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
