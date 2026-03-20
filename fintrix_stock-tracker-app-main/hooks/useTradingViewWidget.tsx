'use client';
import { useEffect, useRef, useCallback } from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const scriptRef = useRef<HTMLScriptElement | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const cleanup = useCallback(() => {
        if (containerRef.current) {
            // Remove script element if exists
            if (scriptRef.current && scriptRef.current.parentNode) {
                scriptRef.current.parentNode.removeChild(scriptRef.current);
            }
            containerRef.current.innerHTML = '';
            delete containerRef.current.dataset.loaded;
            scriptRef.current = null;
        }
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        // Prevent duplicate script loading
        if (containerRef.current.dataset.loaded === 'true') return;

        // Cleanup any existing content
        cleanup();

        // Create widget container
        containerRef.current.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${height}px;"></div>`;

        // Create and configure script
        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.defer = true;
        script.type = 'text/javascript';

        // Set script content with proper JSON stringification
        try {
            script.textContent = JSON.stringify(config);
        } catch (error) {
            console.error('Error stringifying config:', error);
            // Dispatch custom error event for the component to catch
            window.dispatchEvent(new ErrorEvent('error', {
                message: `Failed to load TradingView widget: ${scriptUrl} - Config error`,
                error: error as Error
            }));
            return cleanup;
        }

        // Add timeout for script loading
        timeoutRef.current = setTimeout(() => {
            console.warn(`TradingView widget loading timeout: ${scriptUrl}`);
            // Dispatch custom error event for the component to catch
            window.dispatchEvent(new ErrorEvent('error', {
                message: `Failed to load TradingView widget: ${scriptUrl} - Timeout`,
                error: new Error('Widget loading timeout')
            }));
            cleanup();
        }, 10000); // 10 second timeout

        // Add error handling
        script.onerror = (error) => {
            const errorMessage = `Failed to load TradingView widget: ${scriptUrl}`;
            console.error(errorMessage, error);
            // Dispatch custom error event for the component to catch
            window.dispatchEvent(new ErrorEvent('error', {
                message: errorMessage,
                error: error instanceof Error ? error : new Error(String(error))
            }));
            cleanup();
        };

        script.onload = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            console.log(`TradingView widget loaded successfully: ${scriptUrl}`);
        };

        // Append script to container
        try {
            containerRef.current.appendChild(script);
            scriptRef.current = script;
            containerRef.current.dataset.loaded = 'true';
        } catch (error) {
            console.error('Error appending script:', error);
            // Dispatch custom error event for the component to catch
            window.dispatchEvent(new ErrorEvent('error', {
                message: `Failed to load TradingView widget: ${scriptUrl} - Append error`,
                error: error as Error
            }));
            cleanup();
        }

        return cleanup;
    }, [scriptUrl, config, height, cleanup]);

    return containerRef;
}

export default useTradingViewWidget;
