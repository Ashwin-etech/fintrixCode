'use client';

import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface TradingViewWidgetFallbackProps {
  title?: string;
  height?: number;
  onRetry?: () => void;
  className?: string;
}

const TradingViewWidgetFallback = ({ 
  title = "Trading View Widget", 
  height = 600, 
  onRetry,
  className = "" 
}: TradingViewWidgetFallbackProps) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    onRetry?.();
    setTimeout(() => setIsRetrying(false), 2000);
  };

  return (
    <div className={`w-full ${className}`}>
      {title && <h3 className="font-semibold text-2xl text-gray-100 mb-5">{title}</h3>}
      <div 
        className="bg-gray-800 border border-gray-700 rounded-lg flex flex-col items-center justify-center"
        style={{ height: `${height}px` }}
      >
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <p className="text-gray-400 text-center mb-4">
          Unable to load TradingView widget
        </p>
        <p className="text-gray-500 text-sm text-center mb-6 max-w-md">
          This may be due to network issues or TradingView service being temporarily unavailable.
        </p>
        {onRetry && (
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Retry'}
          </button>
        )}
      </div>
    </div>
  );
};

export default TradingViewWidgetFallback;
