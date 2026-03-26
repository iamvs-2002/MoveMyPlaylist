import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Music,
  CheckCircle,
  AlertCircle,
  Clock,
  Play,
  Pause,
  X,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import axios from "axios";

const TransferProgress = ({
  transferId,
  onTransferComplete,
  onTransferError,
  onCancelTransfer,
  onNewTransfer,
}) => {
  const [isCancelling, setIsCancelling] = useState(false);

  // Poll transfer status
  const {
    data: transferStatus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["transferStatus", transferId],
    queryFn: async () => {
      const response = await axios.get(`/api/transfer/${transferId}`, {
        withCredentials: true,
      });
      return response.data.data;
    },
    refetchInterval: (data) => {
      // Stop polling when transfer is complete or failed
      if (data && ["completed", "failed", "cancelled"].includes(data.status)) {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    refetchIntervalInBackground: false,
  });

  const handleCancel = async () => {
    if (
      !transferStatus ||
      ["completed", "failed", "cancelled"].includes(transferStatus.status)
    ) {
      return;
    }

    setIsCancelling(true);
    try {
      await axios.delete(`/api/transfer/${transferId}`, {
        withCredentials: true,
      });
      // The query will refetch and show the cancelled status
    } catch (error) {
      console.error("Failed to cancel transfer:", error);
    } finally {
      setIsCancelling(false);
    }
  };

  // Call completion handlers when status changes
  React.useEffect(() => {
    if (
      transferStatus &&
      ["completed", "failed", "cancelled"].includes(transferStatus.status)
    ) {
      if (transferStatus.status === "completed") {
        onTransferComplete?.(transferStatus);
      } else if (transferStatus.status === "failed") {
        onTransferError?.(transferStatus);
      }
    }
  }, [transferStatus, onTransferComplete, onTransferError]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "starting":
      case "processing":
        return (
          <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-pulse" />
        );
      case "completed":
        return <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-success" />;
      case "failed":
        return <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />;
      case "cancelled":
        return <X className="w-6 h-6 sm:w-8 sm:h-8 text-white/40" />;
      default:
        return <Music className="w-6 h-6 sm:w-8 sm:h-8 text-white/40" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "starting":
      case "processing":
        return "text-primary";
      case "completed":
        return "text-success";
      case "failed":
        return "text-red-500";
      case "cancelled":
        return "text-white/40";
      default:
        return "text-white/40";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "starting":
        return "Starting transfer...";
      case "processing":
        return "Processing tracks...";
      case "completed":
        return "Transfer completed successfully!";
      case "failed":
        return "Transfer failed";
      case "cancelled":
        return "Transfer cancelled";
      default:
        return "Unknown status";
    }
  };

  const getProgressBarColor = (status) => {
    switch (status) {
      case "starting":
      case "processing":
        return "bg-primary shadow-[0_0_10px_rgba(217,70,239,0.5)]";
      case "completed":
        return "bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)]";
      case "failed":
        return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
      case "cancelled":
        return "bg-white/20";
      default:
        return "bg-white/20";
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 sm:py-12">
        <div className="inline-block relative">
          <div className="w-10 h-10 border-4 border-white/10 border-t-primary rounded-full animate-spin relative z-10 mx-auto mb-3 sm:mb-4"></div>
          <div className="absolute inset-0 w-10 h-10 bg-primary/20 blur-xl rounded-full"></div>
        </div>
        <p className="text-white/60 text-sm sm:text-base tracking-wide mt-2">
          Loading transfer status...
        </p>
      </div>
    );
  }

  if (error || !transferStatus) {
    return (
      <div className="text-center py-8 sm:py-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-glass">
        <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-3 sm:mb-4" />
        <h1 className="text-xl sm:text-2xl font-display font-bold text-white mb-3 sm:mb-4">
          Transfer Not Found
        </h1>
        <p className="text-white/60 mb-6 sm:mb-8 text-sm sm:text-base">
          The requested transfer could not be found or has expired.
        </p>
        <button onClick={onNewTransfer} className="btn-primary">
          Start New Transfer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <button
          onClick={onNewTransfer}
          className="flex items-center space-x-2 text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base font-medium">
            Back to Transfer
          </span>
        </button>

        {transferStatus.status === "processing" && (
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-500/10 transition-colors disabled:opacity-50 w-full sm:w-auto justify-center font-medium"
          >
            {isCancelling ? (
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <X className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
            <span className="text-sm sm:text-base">
              {isCancelling ? "Cancelling..." : "Cancel Transfer"}
            </span>
          </button>
        )}
      </div>

      {/* Transfer Status Card */}
      <div className="bg-black/40 backdrop-blur-xl rounded-3xl shadow-glass border border-white/10 p-4 sm:p-6 md:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mb-3 sm:mb-4 flex justify-center">
            {getStatusIcon(transferStatus.status)}
          </div>
          <h1
            className={`text-2xl sm:text-3xl font-display font-bold mb-2 ${getStatusColor(transferStatus.status)} drop-shadow-lg`}
          >
            {getStatusText(transferStatus.status)}
          </h1>
          <p className="text-white/60 text-sm sm:text-base">
            Transferring from{" "}
            <span className="font-semibold text-white/80 capitalize">
              {transferStatus.sourcePlatform}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-white/80 capitalize">
              {transferStatus.targetPlatform}
            </span>
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs sm:text-sm font-semibold text-white/70 uppercase tracking-wider">
              Progress
            </span>
            <span className="text-xs sm:text-sm font-bold text-white">
              {transferStatus.progress}%
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 sm:h-3 border border-white/10 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(transferStatus.status)} relative`}
              style={{ width: `${transferStatus.progress}%` }}
            >
              {transferStatus.status === "processing" && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]"></div>
              )}
            </div>
          </div>
        </div>

        {/* Transfer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-base sm:text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary/70"></span>{" "}
              Transfer Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center group">
                <span className="text-white/50 text-xs sm:text-sm group-hover:text-white/70 transition-colors">
                  Source:
                </span>
                <span className="font-semibold text-white capitalize text-xs sm:text-sm bg-white/5 px-2 py-1 rounded-md">
                  {transferStatus.sourcePlatform}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-white/50 text-xs sm:text-sm group-hover:text-white/70 transition-colors">
                  Target:
                </span>
                <span className="font-semibold text-white capitalize text-xs sm:text-sm bg-white/5 px-2 py-1 rounded-md">
                  {transferStatus.targetPlatform}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-white/50 text-xs sm:text-sm group-hover:text-white/70 transition-colors">
                  Playlist:
                </span>
                <span className="font-medium text-white/90 text-xs sm:text-sm truncate max-w-[150px]">
                  {transferStatus.playlistName}
                </span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-white/50 text-xs sm:text-sm group-hover:text-white/70 transition-colors">
                  Started:
                </span>
                <span className="font-mono text-white/70 text-xs shadow-inner bg-black/30 px-2 py-1 rounded-md">
                  {new Date(transferStatus.startedAt).toLocaleString()}
                </span>
              </div>
              {transferStatus.completedAt && (
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-success/70 text-xs sm:text-sm font-medium">
                    Completed:
                  </span>
                  <span className="font-mono text-success text-xs shadow-inner bg-success/10 px-2 py-1 rounded-md">
                    {new Date(transferStatus.completedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-base sm:text-lg font-display font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary/70"></span>{" "}
              Statistics
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-white/50 text-xs sm:text-sm flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5" /> Total Tracks
                </span>
                <span className="font-display font-bold text-white text-sm bg-white/10 px-2.5 py-0.5 rounded shadow-inner">
                  {transferStatus.tracksTotal || 0}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-white/50 text-xs sm:text-sm">
                  Processed
                </span>
                <span className="font-display font-semibold text-primary text-sm">
                  {transferStatus.tracksProcessed || 0}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-white/50 text-xs sm:text-sm">
                  Matched
                </span>
                <span className="font-display font-semibold text-success text-sm px-2 bg-success/10 rounded">
                  {transferStatus.tracksMatched || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/50 text-xs sm:text-sm">
                  Not Found
                </span>
                <span className="font-display font-semibold text-red-400 text-sm px-2 bg-red-500/10 rounded">
                  {transferStatus.tracksNotFound || 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {transferStatus.error && (
          <div className="mb-6 sm:mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-red-400 tracking-wide">
                  Transfer Error
                </h3>
                <p className="text-red-300 text-sm mt-1 leading-relaxed">
                  {transferStatus.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success Actions */}
        {transferStatus.status === "completed" &&
          transferStatus.targetPlaylistUrl && (
            <div className="text-center">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mt-8">
                <a
                  href={transferStatus.targetPlaylistUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Playlist on {transferStatus.targetPlatform}</span>
                </a>

                <button onClick={onNewTransfer} className="btn-outline">
                  Transfer Another
                </button>
              </div>
            </div>
          )}

        {/* Failed Transfer Actions */}
        {transferStatus.status === "failed" && (
          <div className="text-center mt-6">
            <button
              onClick={onNewTransfer}
              className="btn-primary !bg-red-500 hover:!bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Cancelled Transfer Actions */}
        {transferStatus.status === "cancelled" && (
          <div className="text-center mt-6">
            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl">
              <X className="w-6 h-6 text-white/40 mx-auto mb-2" />
              <h3 className="text-base sm:text-lg font-semibold text-white/80 mb-1">
                Transfer Cancelled
              </h3>
              <p className="text-white/50 text-sm">
                The transfer was cancelled. No changes were made to your
                playlists.
              </p>
            </div>

            <button onClick={onNewTransfer} className="btn-primary">
              Start New Transfer
            </button>
          </div>
        )}
      </div>

      {/* Real-time Updates */}
      {transferStatus.status === "processing" && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-glass animate-slide-up">
          <h3 className="text-sm font-semibold text-white/50 tracking-wider uppercase mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(217,70,239,0.8)]"></span>
            Syncing
          </h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                <Music className="w-3 h-3 text-primary" />
              </div>
              <span className="text-sm font-medium text-white/80">
                Processing track{" "}
                <span className="font-display font-bold text-white text-base mx-1">
                  {transferStatus.tracksProcessed}
                </span>{" "}
                of {transferStatus.tracksTotal}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-success" />
              </div>
              <span className="text-sm font-medium text-white/80">
                <span className="font-display font-bold text-success text-base mr-1">
                  {transferStatus.tracksMatched}
                </span>{" "}
                tracks matched
              </span>
            </div>
            {transferStatus.tracksNotFound > 0 && (
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-3 h-3 text-red-500" />
                </div>
                <span className="text-sm font-medium text-white/80">
                  <span className="font-display font-bold text-red-400 text-base mr-1">
                    {transferStatus.tracksNotFound}
                  </span>{" "}
                  tracks skipped
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferProgress;
