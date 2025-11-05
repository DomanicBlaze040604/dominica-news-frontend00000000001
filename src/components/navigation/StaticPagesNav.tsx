import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { staticPagesService } from '../../services/staticPages';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StaticPagesNavProps {
  className?: string;
  variant?: 'horizontal' | 'dropdown';
}

export const StaticPagesNav: React.FC<StaticPagesNavProps> = ({ 
  className = '', 
  variant = 'horizontal' 
}) => {
  const { data: menuPagesData } = useQuery({
    queryKey: ['static-pages', 'menu'],
    queryFn: () => staticPagesService.getMenuPages(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const menuPages = menuPagesData?.data || [];

  if (menuPages.length === 0) {
    return null;
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className={`flex items-center space-x-1 ${className}`}>
          <span>Pages</span>
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {menuPages.map((page) => (
            <DropdownMenuItem key={page.id} asChild>
              <Link 
                to={`/pages/${page.slug}`}
                className="w-full"
              >
                {page.title}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <nav className={`flex items-center space-x-6 ${className}`}>
      {menuPages.map((page) => (
        <Link
          key={page.id}
          to={`/pages/${page.slug}`}
          className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
        >
          {page.title}
        </Link>
      ))}
    </nav>
  );
};

// Hook for getting menu pages
export const useMenuPages = () => {
  return useQuery({
    queryKey: ['static-pages', 'menu'],
    queryFn: () => staticPagesService.getMenuPages(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};