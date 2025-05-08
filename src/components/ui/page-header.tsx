
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  onNewItem?: () => void;
  newItemLabel?: string;
}

export function PageHeader({
  title,
  description,
  onNewItem,
  newItemLabel = "Novo Item"
}: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {onNewItem && (
        <Button onClick={onNewItem}>
          <Plus className="mr-2 h-4 w-4" />
          {newItemLabel}
        </Button>
      )}
    </div>
  );
}
