import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Search, Wifi, FileX, Image as ImageIcon, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useErrorHandler } from '@/services/errorService';

interface FallbackContentProps {
  type?: 'article' | 'category' | 'image' | 'network' | 'generic';
  title?: string;
  description?: string;
  showRetry?: boolean;
  showHome?: boolean;
  showSearch?: boolean;
  onRetry?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  error?: Error;
  context?: string;
  maxRetries?: number;
}

export const FallbackContent: React.FC<FallbackContentProps> = ({
  type = 'generic',
  title,
  description,
  showRetry = true,
  showHome = true,
  showSearch = false,
  onRetry,
  className,
  size = 'medium',
  error,
  context,
  maxRetries = 3,
}) => {
  const { handleError, isRecoverable, getErrorSeverity } = useErrorHandler();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
    if (error) {
      handleError(error, { component: 'FallbackContent', context });
    }
  }, [error, context, handleError]);
  const getIconAndColors = () => {
    switch (type) {
      case 'article':
        return {
          icon: FileX,
          bgColor: 'bg-blue-100',
          iconColor: 'text-blue-600',
          defaultTitle: 'Article Not Available',
          defaultDescription: 'The article you\'re looking for is currently unavailable or has been removed.',
        };
      case 'category':
        return {
          icon: Search,
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600',
          defaultTitle: 'Category Not Found',
          defaultDescription: 'This category doesn\'t exist or contains no articles at the moment.',
        };
      case 'image':
        return {
          icon: ImageIcon,
          bgColor: 'bg-purple-100',
          iconColor: 'text-purple-600',
          defaultTitle: 'Image Unavailable',
          defaultDescription: 'The image could not be loaded. It may have been moved or deleted.',
        };
      case 'network':
        return {
          icon: Wifi,
          bgColor: 'bg-orange-100',
          iconColor: 'text-orange-600',
          defaultTitle: 'Connection Problem',
          defaultDescription: 'Unable to load content. Please check your internet connection and try again.',
        };
      default:
        return {
          icon: AlertTriangle,
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600',
          defaultTitle: 'Content Unavailable',
          defaultDescription: 'The requested content is currently unavailable. Please try again later.',
        };
    }
  };

  const { icon: Icon, bgColor, iconColor, defaultTitle, defaultDescription } = getIconAndColors();

  const sizeClasses = {
    small: {
      container: 'p-4',
      icon: 'h-8 w-8',
      iconContainer: 'h-12 w-12',
      title: 'text-lg',
      description: 'text-sm',
      button: 'text-sm px-3 py-2',
    },
    medium: {
      container: 'p-6',
      icon: 'h-10 w-10',
      iconContainer: 'h-16 w-16',
      title: 'text-xl',
      description: 'text-base',
      button: 'text-base px-4 py-2',
    },
    large: {
      container: 'p-8',
      icon: 'h-12 w-12',
      iconContainer: 'h-20 w-20',
      title: 'text-2xl',
      description: 'text-lg',
      button: 'text-lg px-6 py-3',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={cn(
            'mx-auto mb-4 flex items-center justify-center rounded-full',
            bgColor,
            sizes.iconContainer
          )}>
            <Icon className={cn(iconColor, sizes.icon)} />
          </div>
          <CardTitle className={cn('font-bold text-gray-900', sizes.title)}>
            {title || defaultTitle}
          </CardTitle>
          <CardDescription className={cn('text-gray-600', sizes.description)}>
            {description || defaultDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className={cn('space-y-4', sizes.container)}>
          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {showRetry && onRetry && (
              <Button 
                onClick={onRetry} 
                className={cn('w-full', sizes.button)}
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            {showHome && (
              <Button 
                asChild
                variant="outline" 
                className={cn('w-full', sizes.button)}
              >
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Homepage
                </Link>
              </Button>
            )}
            
            {showSearch && (
              <Button 
                asChild
                variant="outline" 
                className={cn('w-full', sizes.button)}
              >
                <Link to="/?search=">
                  <Search className="h-4 w-4 mr-2" />
                  Search Articles
                </Link>
              </Button>
            )}
          </div>

          {/* Additional help text based on type */}
          {type === 'network' && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-1">Troubleshooting:</p>
              <ul className="space-y-1">
                <li>• Check your internet connection</li>
                <li>• Refresh the page</li>
                <li>• Try again in a few moments</li>
              </ul>
            </div>
          )}
          
          {type === 'article' && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
              <p className="font-medium mb-1">What you can do:</p>
              <ul className="space-y-1">
                <li>• Check the URL for typos</li>
                <li>• Browse our latest articles</li>
                <li>• Use the search feature</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Specialized fallback components for common use cases
export const ArticleFallback: React.FC<Omit<FallbackContentProps, 'type'>> = (props) => (
  <FallbackContent type="article" showSearch={true} {...props} />
);

export const CategoryFallback: React.FC<Omit<FallbackContentProps, 'type'>> = (props) => (
  <FallbackContent type="category" showSearch={true} {...props} />
);

export const ImageFallback: React.FC<Omit<FallbackContentProps, 'type'>> = (props) => (
  <FallbackContent 
    type="image" 
    size="small" 
    showHome={false} 
    showSearch={false} 
    {...props} 
  />
);

export const NetworkFallback: React.FC<Omit<FallbackContentProps, 'type'>> = (props) => (
  <FallbackContent type="network" {...props} />
);

// Loading fallback component
interface LoadingFallbackProps {
  type?: 'article' | 'category' | 'image' | 'generic';
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  type = 'generic',
  message,
  size = 'medium',
  className,
}) => {
  const getDefaultMessage = () => {
    switch (type) {
      case 'article':
        return 'Loading article...';
      case 'category':
        return 'Loading articles...';
      case 'image':
        return 'Loading image...';
      default:
        return 'Loading content...';
    }
  };

  const sizeClasses = {
    small: {
      spinner: 'h-6 w-6',
      text: 'text-sm',
      container: 'p-4',
    },
    medium: {
      spinner: 'h-8 w-8',
      text: 'text-base',
      container: 'p-6',
    },
    large: {
      spinner: 'h-12 w-12',
      text: 'text-lg',
      container: 'p-8',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex flex-col items-center justify-center', sizes.container, className)}>
      <div 
        className={cn(
          'animate-spin rounded-full border-4 border-solid border-current border-r-transparent',
          sizes.spinner
        )}
        role="status"
        aria-label={message || getDefaultMessage()}
      >
        <span className="sr-only">{message || getDefaultMessage()}</span>
      </div>
      <p className={cn('mt-4 text-gray-600', sizes.text)}>
        {message || getDefaultMessage()}
      </p>
    </div>
  );
};

// Empty state component
interface EmptyStateProps {
  type?: 'articles' | 'search' | 'category' | 'generic';
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}) => {
  const getDefaults = () => {
    switch (type) {
      case 'articles':
        return {
          title: 'No Articles Found',
          description: 'There are no articles available at the moment. Check back later for new content.',
          actionLabel: 'Browse Categories',
          actionHref: '/',
        };
      case 'search':
        return {
          title: 'No Search Results',
          description: 'We couldn\'t find any articles matching your search. Try different keywords or browse our categories.',
          actionLabel: 'Clear Search',
          actionHref: '/',
        };
      case 'category':
        return {
          title: 'No Articles in Category',
          description: 'This category doesn\'t have any articles yet. Check back later or explore other categories.',
          actionLabel: 'Browse All Articles',
          actionHref: '/',
        };
      default:
        return {
          title: 'No Content Available',
          description: 'There\'s no content to display at the moment.',
          actionLabel: 'Go Home',
          actionHref: '/',
        };
    }
  };

  const defaults = getDefaults();

  return (
    <div className={cn('text-center py-12', className)}>
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <Search className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title || defaults.title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description || defaults.description}
      </p>
      {(actionHref || onAction) && (
        <Button
          asChild={!!actionHref}
          onClick={onAction}
          variant="outline"
          size="lg"
        >
          {actionHref ? (
            <Link to={actionHref}>
              {actionLabel || defaults.actionLabel}
            </Link>
          ) : (
            <span>{actionLabel || defaults.actionLabel}</span>
          )}
        </Button>
      )}
    </div>
  );
};