import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import NewsCard from "@/components/NewsCard";
import { AccessibleImage } from "@/components/AccessibleImage";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { articlesService } from "../services/articles";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { ArticleFallback, LoadingFallback, NetworkFallback } from "../components/FallbackContent";
import { ChevronRight, Home, Calendar, User, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { format } from "date-fns";

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();

  // Fetch article data
  const { data: articleData, isLoading: isLoadingArticle, error: articleError } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => articlesService.getArticleBySlug(slug!),
    enabled: !!slug,
  });

  // Fetch related articles
  const { data: relatedData, isLoading: isLoadingRelated } = useQuery({
    queryKey: ['related-articles', slug],
    queryFn: () => articlesService.getRelatedArticles(slug!, 4),
    enabled: !!slug,
  });

  const article = articleData?.data.article;
  const relatedArticles = relatedData?.data.articles || [];

  // Share functions
  const shareUrl = window.location.href;
  const shareTitle = article?.title || '';

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    // You could add a toast notification here
  };

  if (isLoadingArticle) {
    return (
      <div className="min-h-screen bg-background">
        <Header>
          <Navbar />
        </Header>
        <main className="container mx-auto px-4 py-8">
          <LoadingFallback 
            type="article" 
            message="Loading article..." 
            size="large"
          />
        </main>
        <Footer />
      </div>
    );
  }

  if (articleError || !article) {
    return (
      <div className="min-h-screen bg-background">
        <Header>
          <Navbar />
        </Header>
        <main className="container mx-auto px-4 py-8">
          <ArticleFallback
            title="Article Not Found"
            description="The article you're looking for doesn't exist or has been removed."
            onRetry={() => window.location.reload()}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO Head with structured data */}
      {article && <SEOHead article={article} />}
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
          <Link 
            to={`/category/${article.category.slug}`}
            className="hover:text-primary transition-colors"
          >
            {article.category.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium truncate max-w-xs">
            {article.title}
          </span>
        </nav>

        <article className="max-w-4xl mx-auto">
          {/* Article Header */}
          <header className="mb-8 animate-fade-in">
            <div className="mb-4">
              <Badge className="mb-4">
                {article.category.name}
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {article.seoTitle || article.title}
            </h1>

            {article.excerpt && (
              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Article Meta */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground border-b pb-6">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>By {article.author.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(article.publishedAt || article.createdAt), 'MMMM d, yyyy')}
                </span>
              </div>
              
              {/* Share Buttons */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="flex items-center gap-1">
                  <Share2 className="h-4 w-4" />
                  Share:
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareOnFacebook}
                  className="p-1 h-8 w-8"
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareOnTwitter}
                  className="p-1 h-8 w-8"
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={shareOnLinkedIn}
                  className="p-1 h-8 w-8"
                >
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  className="p-1 h-8 w-8"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {article.featuredImage && (
            <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <AccessibleImage
                src={article.featuredImage}
                alt={article.featuredImageAlt || article.title}
                className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                priority={true}
                variant="large"
                breakpoints={{
                  mobile: { width: 768, variant: "medium" },
                  tablet: { width: 1024, variant: "large" },
                  desktop: { width: 1920, variant: "large" }
                }}
                showLoadingIndicator={true}
                fetchPriority="high"
                showCaption={false}
                description={`Featured image for article: ${article.title}`}
              />
            </div>
          )}

          {/* Article Content */}
          <div 
            className="prose prose-lg max-w-none mb-12 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <div 
              className="article-content leading-relaxed text-foreground"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>

          {/* Article Footer */}
          <footer className="border-t pt-8 mb-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Published in{' '}
                  <Link 
                    to={`/category/${article.category.slug}`}
                    className="text-primary hover:underline"
                  >
                    {article.category.name}
                  </Link>
                </p>
              </div>
              
              {/* Share Buttons (Mobile) */}
              <div className="flex items-center gap-2 md:hidden">
                <span className="text-sm text-muted-foreground">Share:</span>
                <Button variant="outline" size="sm" onClick={shareOnFacebook}>
                  <Facebook className="h-4 w-4 mr-1" />
                  Facebook
                </Button>
                <Button variant="outline" size="sm" onClick={shareOnTwitter}>
                  <Twitter className="h-4 w-4 mr-1" />
                  Twitter
                </Button>
              </div>
            </div>
          </footer>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="max-w-6xl mx-auto animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <h2 className="text-2xl font-bold text-foreground mb-6 pb-2 border-b-2 border-primary inline-block">
              More {article.category.name} News
            </h2>
            
            {isLoadingRelated ? (
              <LoadingFallback 
                type="article" 
                message="Loading related articles..." 
                size="small"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedArticles.map((relatedArticle, index) => (
                  <NewsCard
                    key={relatedArticle.id}
                    id={relatedArticle.id}
                    title={relatedArticle.title}
                    excerpt={relatedArticle.excerpt || ''}
                    image={relatedArticle.featuredImage || ''}
                    imageAlt={relatedArticle.featuredImageAlt}
                    category={relatedArticle.category.name}
                    date={relatedArticle.publishedAt || relatedArticle.createdAt}
                    slug={relatedArticle.slug}
                    author={relatedArticle.author}
                    animationDelay={100 * (index + 1)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ArticlePage;