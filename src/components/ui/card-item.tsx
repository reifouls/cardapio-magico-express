
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatarPercentual } from "@/lib/utils";

interface CardItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  price?: number | null;
  cost?: number | null;
  margin?: number | null;
  category?: string;
  onClick?: () => void;
}

export function CardItem({
  title,
  subtitle,
  description,
  image,
  price,
  cost,
  margin,
  category,
  onClick,
}: CardItemProps) {
  return (
    <Card 
      className="overflow-hidden transition-all hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      {image && (
        <div className="w-full h-40 overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
          {category && (
            <Badge variant="outline" className="ml-2">
              {category}
            </Badge>
          )}
        </div>
      </CardHeader>
      {description && (
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </CardContent>
      )}
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="space-y-1">
          {price !== undefined && price !== null && (
            <div className="text-sm font-medium">Preço: {formatCurrency(price)}</div>
          )}
          {cost !== undefined && cost !== null && (
            <div className="text-sm">Custo: {formatCurrency(cost)}</div>
          )}
          {margin !== undefined && margin !== null && (
            <div className="text-sm">Margem: {formatarPercentual(margin)}</div>
          )}
        </div>
        <Button variant="ghost" size="sm">
          Detalhes
        </Button>
      </CardFooter>
    </Card>
  );
}
