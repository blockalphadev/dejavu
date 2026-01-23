
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App.tsx";
import "./styles/index.css";

// Suppress MetaMask extension errors (doesn't affect functionality)
// This error occurs when multiple wallet extensions try to set window.ethereum
if (typeof window !== 'undefined') {
    // Suppress errors from MetaMask's inpage script
    window.addEventListener('error', (event) => {
        const errorMessage = event.message || '';
        if (errorMessage.includes('MetaMask encountered an error setting the global Ethereum provider') ||
            errorMessage.includes('Cannot assign to read only property \'ethereum\'') ||
            errorMessage.includes('read only property \'ethereum\'')) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }, true);

    // Also suppress console errors
    const originalError = console.error;
    console.error = (...args: any[]) => {
        const errorMessage = args[0]?.toString() || '';
        // Suppress MetaMask provider injection errors
        if (errorMessage.includes('MetaMask encountered an error setting the global Ethereum provider') ||
            errorMessage.includes('Cannot assign to read only property \'ethereum\'') ||
            errorMessage.includes('read only property \'ethereum\'')) {
            // Silently ignore - this is a known MetaMask extension issue
            return;
        }
        originalError.apply(console, args);
    };
}

// Create a client with "Anti-Throttling" defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds - dedupe requests
      gcTime: 1000 * 60 * 5, // 5 minutes garbage collection
      refetchOnWindowFocus: false, // Prevent aggressive refetching
      retry: 1, // Fail fast after 1 retry
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
