
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/layout";
import HomePage from "./pages/HomePage";
import FichasTecnicas from "./pages/FichasTecnicas";
import Ingredientes from "./pages/Ingredientes";
import Combos from "./pages/Combos";
import Engenharia from "./pages/Engenharia";
import Premissas from "./pages/Premissas";
import Relatorios from "./pages/Relatorios";
import ImportarExportar from "./pages/ImportarExportar";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
