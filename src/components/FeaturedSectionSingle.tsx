import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
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

interface FeaturedSectionSingleProps {
  articles: Article[];
  isLoading: boolean;
}

const FeaturedSectionSingle = ({ articles, isLoading }: FeaturedSectionSingleProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  const featuredArticle = articles[0];
  const dominicanDateTime = formatDominicanDateTime(featuredArticle.publishedAt || featuredArticle.createdAt);

  return (
    <Link 
      to={`/articles/${featuredArticle.slug}`} 
      className="group block animate-fade-in-up"
    >
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="relative overflow-hidden bg-muted h-64 lg:h-80">
          <AccessibleImage
            src={featuredArticle.featuredImage || ''}
            alt={featuredArticle.featuredImageAlt || featuredArticle.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            priority={true}
            variant="large"
            breakpoints={{
              mobile: { width: 768, variant: "medium" },
              tablet: { width: 1024, variant: "large" },
              desktop: { width: 1920, variant: "large" }
            }}
            showLoadingIndicator={true}
            fetchPriority="high"
          />
          <div className="absolute top-4 left-4 animate-scale-in" style={{ animationDelay: '200ms' }}>
            <Badge className="bg-primary text-primary-foreground shadow-md">
              {featuredArticle.category.name}
            </Badge>
          </div>
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <CardHeader className="pb-4">
          <h3 className="font-headline font-black text-4xl leading-tight transition-colors duration-300 group-hover:text-primary line-clamp-2">
            {featuredArticle.title}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="article-excerpt mb-5 line-clamp-2 text-lg">
            {featuredArticle.excerpt || ''}
          </p>
          
          {/* Author Information - Enhanced for featured article */}
          <div className="mb-5 pb-4 border-b border-border/50">
            <div className="flex items-center gap-3 mb-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <p className="author-name text-lg text-foreground">
                {featuredArticle.author.name}
              </p>
            </div>
            {featuredArticle.author.role && (
              <p className="author-role ml-8 text-base">
                {featuredArticle.author.role}
              </p>
            )}
          </div>
          
          {/* Publication Date and Time - Dominican timezone */}
          <div className="flex items-start gap-3 text-muted-foreground">
            <Calendar className="h-5 w-5 mt-1 flex-shrink-0" />
            <div className="flex flex-col">
              <span className="article-meta text-base text-foreground/90">
                {dominicanDateTime.publishedFormat}
              </span>
              <span className="text-sm opacity-75 mt-1">
                Commonwealth of Dominica Time (AST)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default FeaturedSectionSingle;