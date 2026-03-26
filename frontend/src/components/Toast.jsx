import React, { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";

const Toast = ({
  id,
  type = "info",
  title,
  message,
  duration = 5000,
  onClose,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.(id);
    }, 200);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "info":
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getToastStyles = () => {
    const baseStyles =
      "flex items-start space-x-3 p-4 rounded-lg shadow-lg border transition-all duration-200 transform";

    switch (type) {
      case "success":
        return `${baseStyles} bg-green-50 border-green-200 ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}`;
      case "error":
        return `${baseStyles} bg-red-50 border-red-200 ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}`;
      case "warning":
        return `${baseStyles} bg-yellow-50 border-yellow-200 ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}`;
      case "info":
      default:
        return `${baseStyles} bg-blue-50 border-blue-200 ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}`;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={getToastStyles()}>
      <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

      <div className="flex-1 min-w-0">
        {title && (
          <p className="text-sm font-medium text-gray-900 mb-1">{title}</p>
        )}
        {message && <p className="text-sm text-gray-600">{message}</p>}
        {action && (
          <div className="mt-2">
            {action.type === "button" ? (
              <button
                onClick={action.onClick}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 underline"
              >
                {action.text}
              </button>
            ) : (
              action
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 ml-4 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
