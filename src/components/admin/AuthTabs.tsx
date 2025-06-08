"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import { Settings, UserPlus } from "lucide-react";

export default function AuthTabs() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-md">
        <Card className="bg-background/80 backdrop-blur-xl border-white/20 shadow-2xl">
          <CardContent className="p-0">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-background/50 backdrop-blur-xl border-white/20 m-6 mb-0">
                <TabsTrigger
                  value="login"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Register
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                <TabsContent value="login" className="mt-0">
                  <LoginForm />
                </TabsContent>

                <TabsContent value="register" className="mt-0">
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
