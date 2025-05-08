
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarNav, getNavItems } from "./sidebar-nav";
import { Button } from "@/components/ui/button";
import { ChefHat, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";

export default function Layout() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const navItems = getNavItems();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center">
            <ChefHat className="h-6 w-6 text-primary mr-2" />
            <h1 
              className="text-xl font-bold cursor-pointer" 
              onClick={() => navigate("/")}
            >
              Cardápio Mágico Express
            </h1>
          </div>

          <div className="ml-auto flex items-center space-x-2">
            {isMobile ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <div className="py-4">
                    <h2 className="text-lg font-semibold mb-4">Menu</h2>
                    <SidebarNav items={navItems} />
                  </div>
                </SheetContent>
              </Sheet>
            ) : null}
          </div>
        </div>
      </header>

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10 py-6">
        {!isMobile && (
          <aside className="fixed top-20 z-30 -ml-2 hidden h-[calc(100vh-4.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
            <SidebarNav
              items={navItems}
              className="p-1"
            />
          </aside>
        )}

        <main className="flex w-full flex-col overflow-hidden pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
