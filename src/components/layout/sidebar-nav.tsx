
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLocation, Link } from "react-router-dom";
import {
  Settings,
  ShoppingBasket,
  ClipboardList,
  LineChart,
  Package,
  FileText,
  Download,
} from "lucide-react";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon: React.ReactNode;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const location = useLocation();

  return (
    <nav
      className={cn(
        "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
        className
      )}
      {...props}
    >
      {items.map((item) => (
        <Button
          key={item.href}
          variant={location.pathname === item.href ? "default" : "ghost"}
          className={cn(
            "justify-start",
            location.pathname === item.href
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          )}
          asChild
        >
          <Link to={item.href}>
            {item.icon}
            <span className="ml-2">{item.title}</span>
          </Link>
        </Button>
      ))}
    </nav>
  );
}

export function getNavItems() {
  return [
    {
      title: "Premissas",
      href: "/premissas",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      title: "Ingredientes",
      href: "/ingredientes",
      icon: <ShoppingBasket className="h-5 w-5" />,
    },
    {
      title: "Fichas Técnicas",
      href: "/fichas-tecnicas",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      title: "Engenharia",
      href: "/engenharia",
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      title: "Combos",
      href: "/combos",
      icon: <Package className="h-5 w-5" />,
    },
    {
      title: "Relatórios",
      href: "/relatorios",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Importar/Exportar",
      href: "/importar-exportar",
      icon: <Download className="h-5 w-5" />,
    },
  ];
}
