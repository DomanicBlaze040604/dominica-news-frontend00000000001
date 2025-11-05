import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staticPagesService } from '../../services/staticPages';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GripVertical, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import type { StaticPage } from '../../services/staticPages';

interface MenuReorderProps {
  pages: (StaticPage & { showInMenu?: boolean; menuOrder?: number })[];
  onClose?: () => void;
}

export const MenuReorder: React.FC<MenuReorderProps> = ({ pages, onClose }) => {
  const queryClient = useQueryClient();
  
  // Filter and sort menu pages
  const menuPages = pages
    .filter(page => page.showInMenu)
    .sort((a, b) => (a.menuOrder || 0) - (b.menuOrder || 0));

  const [pageOrders, setPageOrders] = useState(
    menuPages.map((page, index) => ({
      id: page.id,
      title: page.title,
      menuOrder: page.menuOrder || index,
    }))
  );

  const reorderMutation = useMutation({
    mutationFn: (orders: { id: string; menuOrder: number }[]) =>
      staticPagesService.reorderMenuPages(orders),
    onSuccess: () => {
      toast.success('Menu order updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['static-pages'] });
      onClose?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update menu order');
    },
  });

  const handleOrderChange = (id: string, newOrder: number) => {
    setPageOrders(prev =>
      prev.map(page =>
        page.id === id ? { ...page, menuOrder: newOrder } : page
      ).sort((a, b) => a.menuOrder - b.menuOrder)
    );
  };

  const handleSave = () => {
    const orders = pageOrders.map(({ id, menuOrder }) => ({ id, menuOrder }));
    reorderMutation.mutate(orders);
  };

  const handleReset = () => {
    setPageOrders(
      menuPages.map((page, index) => ({
        id: page.id,
        title: page.title,
        menuOrder: page.menuOrder || index,
      }))
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrders = [...pageOrders];
    const temp = newOrders[index].menuOrder;
    newOrders[index].menuOrder = newOrders[index - 1].menuOrder;
    newOrders[index - 1].menuOrder = temp;
    setPageOrders(newOrders.sort((a, b) => a.menuOrder - b.menuOrder));
  };

  const moveDown = (index: number) => {
    if (index === pageOrders.length - 1) return;
    const newOrders = [...pageOrders];
    const temp = newOrders[index].menuOrder;
    newOrders[index].menuOrder = newOrders[index + 1].menuOrder;
    newOrders[index + 1].menuOrder = temp;
    setPageOrders(newOrders.sort((a, b) => a.menuOrder - b.menuOrder));
  };

  if (menuPages.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No pages are currently set to show in the menu.</p>
          <p className="text-sm text-gray-400 mt-2">
            Enable "Show in Navigation Menu" for pages to manage their order here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Menu Order Management</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={reorderMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={reorderMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {reorderMutation.isPending ? 'Saving...' : 'Save Order'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Drag items or use the order inputs to rearrange menu items. Lower numbers appear first.
        </p>
        
        <div className="space-y-3">
          {pageOrders.map((page, index) => (
            <div
              key={page.id}
              className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-2">
                <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                <Badge variant="outline" className="text-xs">
                  {index + 1}
                </Badge>
              </div>
              
              <div className="flex-1">
                <p className="font-medium text-gray-900">{page.title}</p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor={`order-${page.id}`} className="text-sm">
                  Order:
                </Label>
                <Input
                  id={`order-${page.id}`}
                  type="number"
                  min="0"
                  value={page.menuOrder}
                  onChange={(e) => handleOrderChange(page.id, parseInt(e.target.value) || 0)}
                  className="w-20"
                />
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="h-8 w-8 p-0"
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => moveDown(index)}
                  disabled={index === pageOrders.length - 1}
                  className="h-8 w-8 p-0"
                >
                  ↓
                </Button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t">
          <h4 className="font-medium text-gray-900 mb-2">Preview Order:</h4>
          <div className="flex flex-wrap gap-2">
            {pageOrders.map((page, index) => (
              <Badge key={page.id} variant="secondary">
                {index + 1}. {page.title}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};