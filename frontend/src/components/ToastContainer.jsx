import React, { useState, useCallback } from "react";
import Toast from "./Toast";

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showSuccess = useCallback(
    (title, message, options = {}) => {
      return addToast({ type: "success", title, message, ...options });
    },
    [addToast],
  );

  const showError = useCallback(
    (title, message, options = {}) => {
      return addToast({ type: "error", title, message, ...options });
    },
    [addToast],
  );

  const showWarning = useCallback(
    (title, message, options = {}) => {
      return addToast({ type: "warning", title, message, ...options });
    },
    [addToast],
  );

  const showInfo = useCallback(
    (title, message, options = {}) => {
      return addToast({ type: "info", title, message, ...options });
    },
    [addToast],
  );

  // Expose methods globally for easy access
  React.useEffect(() => {
    window.showToast = {
      success: showSuccess,
      error: showError,
      warning: showWarning,
      info: showInfo,
    };
  }, [showSuccess, showError, showWarning, showInfo]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </div>
  );
};

export default ToastContainer;
