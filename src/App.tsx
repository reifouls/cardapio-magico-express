import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/layout";

// Lazy load components
const HomePage = lazy(() => import("./pages/HomePage"));
const FichasTecnicas = lazy(() => import("./pages/FichasTecnicas"));
const Ingredientes = lazy(() => import("./pages/Ingredientes"));
const Combos = lazy(() => import("./pages/Combos"));
const Engenharia = lazy(() => import("./pages/Engenharia"));
const Premissas = lazy(() => import("./pages/Premissas"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const ImportarExportar = lazy(() => import("./pages/ImportarExportar"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="fichas-tecnicas" element={<FichasTecnicas />} />
              <Route path="ingredientes" element={<Ingredientes />} />
              <Route path="combos" element={<Combos />} />
              <Route path="engenharia" element={<Engenharia />} />
              <Route path="premissas" element={<Premissas />} />
              <Route path="relatorios" element={<Relatorios />} />
              <Route path="importar-exportar" element={<ImportarExportar />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
