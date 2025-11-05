import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccessibleImage } from "./AccessibleImage";
import { formatDominicanDateTime } from "@/utils/dateUtils";

interface Article {
  id: string;
  title: string;
  excerpt?: string;
  category: {
    name: string;
  };
  author: {
    name: string;
    role?: string;
  };
  publishedAt?: string;
  createdAt: string;
  featuredImage?: string;
  featuredImageAlt?: string;
  slug: string;
}

interface FeaturedSectionCardsProps {
  articles: Article[];
  isLoading: boolean;
}

const FeaturedSectionCards = ({ articles, isLoading }: FeaturedSectionCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
            <div className="bg-gray-200 h-4 rounded mb-2"></div>
            <div className="bg-gray-200 h-3 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No featured articles available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.slice(0, 3).map((article, index) => {
        const dominicanDateTime = formatDominicanDateTime(article.publishedAt || article.createdAt);

        return (
          <Link 
            key={article.id}
            to={`/articles/${article.slug}`} 
            className="group block animate-fade-in-up"
            style={{ animationDelay: `${100 * (index + 1)}ms` }}
          >
            <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full">
              <div className="relative overflow-hidden bg-muted h-48">
                <AccessibleImage
                  src={article.featuredImage || ''}
                  alt={article.featuredImageAlt || article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  priority={index === 0}
                  variant="medium"
                  breakpoints={{
                    mobile: { width: 768, variant: "small" },
                    tablet: { width: 1024, variant: "medium" },
                    desktop: { width: 1920, variant: "medium" }
                  }}
                  showLoadingIndicator={true}
                  fetchPriority={index === 0 ? "high" : "auto"}
                />
                <div className="absolute top-4 left-4 animate-scale-in" style={{ animationDelay: `${100 * (index + 1) + 200}ms` }}>
                  <Badge className="bg-primary text-primary-foreground shadow-md">
                    {article.category.name}
                  </Badge>
                </div>
                {/* Overlay gradient on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <CardHeader className="pb-4">
                <h3 className="font-headline font-bold text-xl leading-tight transition-colors duration-300 group-hover:text-primary line-clamp-2">
                  {article.title}
                </h3>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <p className="article-excerpt mb-4 line-clamp-2">
                  {article.excerpt || ''}
                </p>
                
                {/* Author Information */}
                <div className="mb-3 pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="author-name text-foreground">
                      {article.author.name}
                    </p>
                  </div>
                  {article.author.role && (
                    <p className="author-role ml-6">
                      {article.author.role}
                    </p>
                  )}
                </div>
                
                {/* Publication Date and Time - Dominican timezone */}
                <div className="flex items-start gap-2 text-muted-foreground mt-auto">
                  <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="article-meta text-foreground/90">
                      Published on: {dominicanDateTime.date}
                    </span>
                    <span className="text-xs opacity-75 mt-0.5">
                      {dominicanDateTime.time}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
};

export default FeaturedSectionCards;