import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { categoriesService } from "../services/categories";
import { LazyImage } from "./LazyImage";
import { cn } from "@/lib/utils";
import { ChevronDown, Clock, User } from "lucide-react";

interface CategoryDropdownProps {
  categorySlug: string;
  categoryName: string;
  isActive: boolean;
}

export const CategoryDropdown = ({ categorySlug, categoryName, isActive }: CategoryDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const timeoutRef = useRef<number>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch category preview data when hovering
  const { data: previewData, isLoading } = useQuery({
    queryKey: ['category-preview', categorySlug],
    queryFn: () => categoriesService.getCategoryPreview(categorySlug, 5),
    enabled: isHovering, // Only fetch when hovering
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const articles = previewData?.data.articles || [];

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsHovering(true);
    // Add a small delay before showing dropdown to prevent accidental triggers
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 100);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsHovering(false);
    }, 200); // Slightly longer delay to prevent flickering
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={dropdownRef}
    >
      {/* Category Link */}
      <div className="flex items-center gap-1">
        <Link
          to={`/category/${categorySlug}`}
          className={cn(
            "text-sm font-medium transition-all duration-300 relative",
            "hover:text-primary group-hover:text-primary",
            "animate-fade-in",
            isActive
              ? "text-primary border-b-2 border-primary pb-1"
              : "text-foreground/80"
          )}
        >
          {categoryName}
        </Link>
        <ChevronDown 
          className={cn(
            "h-3 w-3 transition-all duration-300 text-muted-foreground",
            "group-hover:text-primary",
            isOpen ? "rotate-180" : "rotate-0"
          )}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-96 bg-card border border-border rounded-lg shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
          {/* Arrow pointer */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
            <div className="w-4 h-4 bg-card border-l border-t border-border rotate-45"></div>
          </div>
          
          <div className="p-4 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base text-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                Latest in {categoryName}
              </h3>
              <Link 
                to={`/category/${categorySlug}`}
                className="text-xs text-primary hover:text-primary/80 font-medium transition-colors px-2 py-1 rounded hover:bg-primary/10"
              >
                View All →
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-14 h-14 bg-muted rounded-md"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-3/4"></div>
                      <div className="h-2 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="space-y-2">
                {articles.slice(0, 4).map((article, index) => (
                  <Link
                    key={article.id}
                    to={`/articles/${article.slug}`}
                    className="flex gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 group border border-transparent hover:border-border/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Thumbnail */}
                    <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-muted group-hover:scale-105 transition-transform duration-200">
                      {article.featuredImage ? (
                        <LazyImage
                          src={article.featuredImage}
                          alt={article.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <span className="text-sm text-muted-foreground font-bold">
                            {categoryName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Article Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight mb-2">
                        {article.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {article.author && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="truncate max-w-20">{article.author.name}</span>
                          </div>
                        )}
                        {article.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(article.publishedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                
                {articles.length > 4 && (
                  <div className="pt-2 border-t border-border/50">
                    <Link
                      to={`/category/${categorySlug}`}
                      className="block text-center text-sm text-primary hover:text-primary/80 font-medium py-2 rounded-md hover:bg-primary/10 transition-colors"
                    >
                      +{articles.length - 4} more articles
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-lg text-muted-foreground font-bold">
                    {categoryName.charAt(0)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">No articles available yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Check back soon for updates</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};