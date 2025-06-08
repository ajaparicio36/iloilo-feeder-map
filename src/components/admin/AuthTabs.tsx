"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { Settings, UserPlus } from "lucide-react";

export default function AuthTabs() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-accent/15 via-transparent to-primary/10"></div>

      {/* Animated background elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="w-full max-w-md relative z-10">
        <Card className="bg-background/20 backdrop-blur-2xl border-white/30 shadow-2xl relative overflow-hidden">
          {/* Additional glassmorphism overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none"></div>

          <CardContent className="p-0 relative">
            <Tabs defaultValue="login" className="w-full">
              <div className="p-6 pb-0">
                <TabsList className="grid w-full grid-cols-2 bg-background/30 backdrop-blur-xl border-white/40 h-11 shadow-lg">
                  <TabsTrigger
                    value="login"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center justify-center gap-2 h-9 text-sm font-medium transition-all"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="truncate">Sign In</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center justify-center gap-2 h-9 text-sm font-medium transition-all"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="truncate">Register</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6 pt-4">
                <TabsContent value="login" className="mt-0 space-y-0">
                  <LoginForm />
                </TabsContent>

                <TabsContent value="register" className="mt-0 space-y-0">
                  <RegisterForm />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
