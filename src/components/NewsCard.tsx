import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccessibleImage } from "./AccessibleImage";
import { formatDominicanDateTime } from "@/utils/dateUtils";

interface NewsCardProps {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  imageAlt?: string;
  slug?: string;
  author?: {
    name: string;
    role?: string;
  };
  featured?: boolean;
  animationDelay?: number;
}

const NewsCard = ({ 
  id, 
  title, 
  excerpt, 
  category, 
  date, 
  image, 
  imageAlt,
  slug,
  author,
  featured = false,
  animationDelay = 0 
}: NewsCardProps) => {
  // Format date and time for Dominican timezone
  const dominicanDateTime = formatDominicanDateTime(date);
  return (
    <Link 
      to={slug ? `/articles/${slug}` : `/news/${id}`} 
      className="group block animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
        featured ? "lg:col-span-2" : ""
      )}>
        <div className={cn(
          "relative overflow-hidden bg-muted",
          featured ? "h-64 lg:h-80" : "h-48"
        )}>
          <AccessibleImage
            src={image}
            alt={imageAlt || title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            priority={featured}
            variant={featured ? "large" : "medium"}
            breakpoints={{
              mobile: { width: 768, variant: "small" },
              tablet: { width: 1024, variant: "medium" },
              desktop: { width: 1920, variant: featured ? "large" : "medium" }
            }}
            showLoadingIndicator={true}
            fetchPriority={featured ? "high" : "auto"}
          />
          <div className="absolute top-4 left-4 animate-scale-in" style={{ animationDelay: `${animationDelay + 200}ms` }}>
            <Badge className="bg-primary text-primary-foreground shadow-md">
              {category}
            </Badge>
          </div>
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        <CardHeader className="pb-4">
          <h3 className={cn(
            "font-headline font-black leading-tight transition-colors duration-300",
            "group-hover:text-primary line-clamp-2",
            featured ? "text-4xl font-black" : "text-2xl font-bold"
          )}>
            {title}
          </h3>
        </CardHeader>
        <CardContent>
          <p className="article-excerpt mb-4 line-clamp-2">
            {excerpt}
          </p>
          
          {/* Author Information - Enhanced styling */}
          {author && (
            <div className="mb-4 pb-3 border-b border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="author-name text-foreground">
                  {author.name}
                </p>
              </div>
              {author.role && (
                <p className="author-role ml-6">
                  {author.role}
                </p>
              )}
            </div>
          )}
          
          {/* Publication Date and Time - Dominican timezone */}
          <div className="flex items-start gap-2 text-muted-foreground">
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
};

export default NewsCard;
