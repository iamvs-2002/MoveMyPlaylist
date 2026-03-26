import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { get } from "./utils/enhancedApi";

// Pages
import LandingPage from "./pages/LandingPage";
import TransferPage from "./pages/TransferPage";
import AuthError from "./pages/AuthError";
import Documentation from "./pages/Documentation";
import FAQPage from "./pages/FAQPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import NotFoundPage from "./pages/NotFoundPage";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";
import ToastContainer from "./components/ToastContainer";
import ErrorBoundary from "./components/ErrorBoundary";

// Hooks
import ScrollToTop from "./components/ScrollToTop";

// API functions
const checkAuthStatus = async () => {
  return await get("/auth/status");
};

function App() {
  const { data: authStatus } = useQuery({
    queryKey: ["authStatus"],
    queryFn: checkAuthStatus,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#050505] text-foreground flex flex-col">
        <ScrollToTop />
        <Header authStatus={authStatus} />

        <main className="flex-1">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/transfer" element={<TransferPage />} />
            <Route path="/auth/error" element={<AuthError />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Redirect dashboard to transfer */}
            <Route
              path="/dashboard"
              element={<Navigate to="/transfer" replace />}
            />

            {/* Catch all route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  );
}

export default App;
