import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { staticPagesService } from "../services/staticPages";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { TemplateRenderer } from "../components/templates/TemplateRenderer";
import { ChevronRight, Home } from "lucide-react";

const StaticPageDisplay = () => {
  const { slug } = useParams<{ slug: string }>();

  // Fetch static page data
  const { data: pageData, isLoading, error } = useQuery({
    queryKey: ['static-page', slug],
    queryFn: () => staticPagesService.getPageBySlug(slug!),
    enabled: !!slug,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - static pages don't change often
  });

  const page = pageData?.data?.page;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header>
          <Navbar />
        </Header>
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse max-w-4xl mx-auto">
            <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen bg-background">
        <Header>
          <Navbar />
        </Header>
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-8 text-lg">
              The page you're looking for doesn't exist or has been removed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/">Back to Home</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Head with page metadata */}
      <SEOHead 
        title={page.seoTitle || page.title}
        description={page.seoDescription || `${page.title} - Dominica News`}
        keywords={page.seoKeywords}
        canonicalUrl={`${window.location.origin}/${page.slug}`}
      />
      
      <Header>
        <Navbar />
      </Header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6 animate-fade-in">
          <Link to="/" className="flex items-center hover:text-primary transition-colors">
            <Home className="h-4 w-4 mr-1" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">
            {page.title}
          </span>
        </nav>

        {/* Page Content */}
        <article className="max-w-4xl mx-auto animate-fade-in">
          <header className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              {page.title}
            </h1>
            
            {page.excerpt && (
              <p className="text-xl text-muted-foreground leading-relaxed">
                {page.excerpt}
              </p>
            )}
          </header>

          {/* Render content using template system */}
          <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <TemplateRenderer 
              template={page.template || 'default'}
              content={page.content}
              page={page}
            />
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default StaticPageDisplay;