import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import { articlesService } from "../services/articles";
import { categoriesService } from "../services/categories";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { CategoryFallback, LoadingFallback, NetworkFallback, EmptyState } from "../components/FallbackContent";
import { ChevronRight, Home } from "lucide-react";

const CategoryPage = () => {
  const { category = "world" } = useParams<{ category: string }>();
  const [page, setPage] = useState(1);

  // Fetch category information
  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ['category', category],
    queryFn: () => categoriesService.getCategoryBySlug(category),
  });

  // Fetch articles for this category
  const { data: articlesData, isLoading: isLoadingArticles, error: articlesError } = useQuery({
    queryKey: ['category-articles', category, { page }],
    queryFn: () => articlesService.getCategoryArticles(category, { page, limit: 12 }),
    enabled: !!category,
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const categoryInfo = categoryData?.data.category;
  const articles = articlesData?.data.articles || [];
  const pagination = articlesData?.data.pagination;
  const categoryTitle = categoryInfo?.name || category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div className="min-h-screen bg-background">
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
          <span className="text-foreground font-medium">{categoryTitle}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-8 animate-fade-in">
          {isLoadingCategory ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96"></div>
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-foreground mb-2 pb-3 border-b-4 border-primary inline-block">
                {categoryTitle}
              </h1>
              <div className="mt-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
                {categoryInfo?.description ? (
                  <p className="text-muted-foreground text-lg">
                    {categoryInfo.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Latest updates and stories from {categoryTitle.toLowerCase()}
                  </p>
                )}
                {pagination && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {pagination.totalArticles} article{pagination.totalArticles !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Articles Grid */}
        {isLoadingArticles ? (
          <LoadingFallback 
            type="category" 
            message={`Loading ${categoryTitle.toLowerCase()} articles...`}
            size="medium"
          />
        ) : articlesError ? (
          <NetworkFallback
            title="Failed to Load Articles"
            description={`Unable to load articles for ${categoryTitle}. Please check your connection and try again.`}
            onRetry={() => window.location.reload()}
          />
        ) : articles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article, index) => (
                <NewsCard
                  key={article.id}
                  id={article.id}
                  title={article.title}
                  excerpt={article.excerpt || ''}
                  image={article.featuredImage || ''}
                  imageAlt={article.featuredImageAlt}
                  category={article.category.name}
                  date={article.publishedAt || article.createdAt}
                  slug={article.slug}
                  author={article.author}
                  animationDelay={100 * (index + 1)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center mt-12 space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            type="category"
            title={`No Articles in ${categoryTitle}`}
            description={`This category doesn't have any articles yet. Check back later or explore other categories.`}
            actionLabel="Browse All Articles"
            actionHref="/"
          />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;
