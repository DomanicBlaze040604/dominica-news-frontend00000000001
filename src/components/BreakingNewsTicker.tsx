import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { breakingNewsService } from '../services/breakingNews';
import { BreakingNews } from '../types/api';

interface BreakingNewsTickerProps {
  className?: string;
}

export const BreakingNewsTicker: React.FC<BreakingNewsTickerProps> = ({ className = '' }) => {
  const [breakingNews, setBreakingNews] = useState<BreakingNews | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBreakingNews();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchBreakingNews, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchBreakingNews = async () => {
    try {
      setError(null);
      const news = await breakingNewsService.getActive();
      setBreakingNews(news);
      
      // Reset dismissed state if there's new breaking news
      if (news && (!breakingNews || news.id !== breakingNews.id)) {
        setIsDismissed(false);
      }
    } catch (error) {
      console.error('Failed to fetch breaking news:', error);
      setError('Failed to load breaking news');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Store dismissed state in localStorage to persist across page reloads
    if (breakingNews) {
      localStorage.setItem(`breaking-news-dismissed-${breakingNews.id}`, 'true');
    }
  };

  // Check if this breaking news was previously dismissed
  useEffect(() => {
    if (breakingNews) {
      const wasDismissed = localStorage.getItem(`breaking-news-dismissed-${breakingNews.id}`);
      if (wasDismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, [breakingNews]);

  // Don't render if loading, no breaking news, dismissed, or error
  if (isLoading || !breakingNews || isDismissed || error) {
    return null;
  }

  return (
    <div className={`breaking-news-ticker ${className}`}>
      <div className="breaking-news-container bg-red-600 text-white py-2 px-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="breaking-news-label flex items-center space-x-2 flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-300 animate-pulse" />
            <span className="breaking-text font-bold text-sm bg-yellow-300 text-red-600 px-2 py-1 rounded uppercase tracking-wide">
              BREAKING
            </span>
          </div>
          <div className="breaking-news-content flex-1 min-w-0">
            <div className="breaking-news-text text-sm md:text-base font-medium animate-scroll">
              {breakingNews.text}
            </div>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="breaking-news-dismiss ml-3 p-1 hover:bg-red-700 rounded-full transition-colors duration-200 flex-shrink-0"
          aria-label="Dismiss breaking news"
          title="Dismiss breaking news"
        >
          <X size={18} />
        </button>
      </div>
      
      <style jsx>{`
        .breaking-news-ticker {
          position: relative;
          z-index: 50;
        }
        
        .breaking-news-container {
          animation: slideDown 0.5s ease-out;
        }
        
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-scroll {
          animation: scroll 20s linear infinite;
          white-space: nowrap;
          overflow: hidden;
        }
        
        @keyframes scroll {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        @media (max-width: 768px) {
          .animate-scroll {
            animation: none;
            white-space: normal;
            overflow: visible;
          }
        }
      `}</style>
    </div>
  );
};