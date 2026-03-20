'use client';

import React, { memo, useState, useCallback } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import { cn } from "@/lib/utils";
import TradingViewWidgetFallback from "./TradingViewWidgetFallback";

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
}

const TradingViewWidget = ({ title, scriptUrl, config, height = 600, className }: TradingViewWidgetProps) => {
    const [hasError, setHasError] = useState(false);
    const containerRef = useTradingViewWidget(scriptUrl, config, height);

    const handleRetry = useCallback(() => {
        setHasError(false);
        // Force re-render by clearing the container
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
            delete containerRef.current.dataset.loaded;
        }
    }, [containerRef]);

    // Monitor for specific TradingView widget errors
    React.useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            if (event.message && event.message.includes('Failed to load TradingView widget:')) {
                setHasError(true);
            }
        };

        const handleRejection = (event: PromiseRejectionEvent) => {
            if (event.reason && event.reason.toString().includes('Failed to load TradingView widget:')) {
                setHasError(true);
            }
        };

        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);

        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, []);

    if (hasError) {
        return (
            <TradingViewWidgetFallback
                title={title}
                height={height}
                onRetry={handleRetry}
                className={className}
            />
        );
    }

    return (
        <div className="w-full">
            {title && <h3 className="font-semibold text-2xl text-gray-100 mb-5">{title}</h3>}
            <div className={cn('tradingview-widget-container', className)} ref={containerRef}>
                <div className="tradingview-widget-container__widget" style={{ height, width: "100%" }} />
            </div>
        </div>
    );
}

export default memo(TradingViewWidget);
