import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, RefreshCw, Home } from "lucide-react";

const AuthError = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  const getErrorDetails = (errorCode) => {
    switch (errorCode) {
      case "login_cancelled":
        return {
          title: "Login Cancelled",
          message:
            "You cancelled the login process. This is required to transfer your playlists.",
          suggestion:
            "Please try connecting again and complete the login process.",
        };
      case "security_check_failed":
        return {
          title: "Security Check Failed",
          message:
            "The login request could not be verified for security reasons.",
          suggestion: "Please try connecting again from the beginning.",
        };
      case "login_incomplete":
        return {
          title: "Login Incomplete",
          message: "The login process was not completed properly.",
          suggestion:
            "Please try connecting again and complete the full login process.",
        };
      case "login_failed":
        return {
          title: "Login Failed",
          message: "We were unable to complete the login process.",
          suggestion:
            "Please try again. If the problem persists, check your internet connection.",
        };
      case "access_denied":
        return {
          title: "Access Denied",
          message:
            "You denied access to your account. This is required to transfer playlists.",
          suggestion:
            "Please try connecting again and grant the necessary permissions.",
        };
      default:
        return {
          title: "Login Error",
          message: "An unexpected error occurred during the login process.",
          suggestion:
            "Please try again or contact support if the problem persists.",
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Icon */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
          </div>
        </div>

        {/* Error Details */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
              {errorDetails.title}
            </h1>
            <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
              {errorDetails.message}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <p className="text-blue-800 text-sm sm:text-base">
                <strong>Suggestion:</strong> {errorDetails.suggestion}
              </p>
            </div>
          </div>

          {/* Error Code (for debugging) */}
          {error && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-600">
                <strong>Error Code:</strong> {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => navigate("/auth")}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <button
              onClick={() => navigate("/")}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors w-full sm:w-auto"
            >
              <Home className="w-4 h-4" />
              <span>Go Home</span>
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 text-center">
            Need Help?
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                  Check Your Connection
                </h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Ensure you have a stable internet connection and can access
                  the music platform.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                  Clear Browser Cache
                </h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Sometimes clearing your browser cache and cookies can resolve
                  authentication issues.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 sm:space-x-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                  Try Different Browser
                </h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  If the problem persists, try using a different web browser.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-6 sm:mt-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm sm:text-base">Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthError;
