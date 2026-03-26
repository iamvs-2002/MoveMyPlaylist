const { getFirestore } = require("../config/firebase");

/**
 * Firestore Service for Transfer Statistics
 * Manages all transfer data and statistics in Firestore
 */

class FirestoreService {
  constructor() {
    this.db = null;
    this.transfersCollection = null;
    this.statsCollection = null;
  }

  /**
   * Get database instance with lazy initialization
   */
  getDb() {
    if (!this.db) {
      this.db = getFirestore();
      this.transfersCollection = this.db.collection("transfers");
      this.statsCollection = this.db.collection("transferStats");
    }
    return this.db;
  }

  /**
   * Get transfers collection with lazy initialization
   */
  getTransfersCollection() {
    if (!this.transfersCollection) {
      this.getDb();
    }
    return this.transfersCollection;
  }

  /**
   * Get stats collection with lazy initialization
   */
  getStatsCollection() {
    if (!this.statsCollection) {
      this.getDb();
    }
    return this.statsCollection;
  }

  /**
   * Create a new transfer record
   */
  async createTransfer(transferData) {
    try {
      const transferRef = await this.getTransfersCollection().add({
        ...transferData,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
      });

      // Update global statistics
      await this.updateGlobalStats(transferData, "create");

      return transferRef.id;
    } catch (error) {
      console.error("Error creating transfer record:", error);
      throw error;
    }
  }

  /**
   * Update transfer record
   */
  async updateTransfer(transferId, updateData) {
    try {
      const updatePayload = {
        ...updateData,
        lastUpdatedAt: new Date(),
      };

      await this.getTransfersCollection().doc(transferId).update(updatePayload);

      // Update global statistics if status changed
      if (updateData.status) {
        await this.updateGlobalStats(updateData, "update");
      }

      return true;
    } catch (error) {
      console.error("Error updating transfer record:", error);
      throw error;
    }
  }

  /**
   * Get transfer by ID
   */
  async getTransfer(transferId) {
    try {
      const transferDoc = await this.getTransfersCollection()
        .doc(transferId)
        .get();

      if (!transferDoc.exists) {
        return null;
      }

      return {
        id: transferDoc.id,
        ...transferDoc.data(),
      };
    } catch (error) {
      console.error("Error getting transfer:", error);
      throw error;
    }
  }

  /**
   * Get all transfers (for admin purposes)
   */
  async getAllTransfers(limit = 100) {
    try {
      const snapshot = await this.getTransfersCollection()
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const transfers = [];
      snapshot.forEach((doc) => {
        transfers.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return transfers;
    } catch (error) {
      console.error("Error getting all transfers:", error);
      throw error;
    }
  }

  /**
   * Get transfers by session ID (secure)
   */
  async getTransfersBySessionId(sessionId, limit = 50) {
    try {
      if (!sessionId) return [];

      const snapshot = await this.getTransfersCollection()
        .where("sessionId", "==", sessionId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

      const transfers = [];
      snapshot.forEach((doc) => {
        transfers.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      return transfers;
    } catch (error) {
      console.error("Error getting user transfers:", error);
      throw error;
    }
  }

  /**
   * Get global statistics
   */
  async getGlobalStats() {
    try {
      const statsDoc = await this.getStatsCollection()
        .doc("global_stats")
        .get();

      if (!statsDoc.exists) {
        // Initialize global stats if they don't exist
        return await this.initializeGlobalStats();
      }

      return statsDoc.data();
    } catch (error) {
      console.error("Error getting global stats:", error);
      throw error;
    }
  }

  /**
   * Initialize global statistics
   */
  async initializeGlobalStats() {
    try {
      const initialStats = {
        totalTransfers: 0,
        totalPlaylistsTransferred: 0,
        totalTracksTransferred: 0,
        totalSessions: 0,
        successfulTransfers: 0,
        failedTransfers: 0,
        cancelledTransfers: 0,
        platformUsage: {},
        transferDirections: {},
        trackMatching: {
          totalTracksProcessed: 0,
          totalTracksMatched: 0,
          totalTracksNotFound: 0,
        },
        lastUpdatedAt: new Date(),
      };

      await this.getStatsCollection().doc("global_stats").set(initialStats);
      return initialStats;
    } catch (error) {
      console.error("Error initializing global stats:", error);
      throw error;
    }
  }

  /**
   * Update global statistics
   */
  async updateGlobalStats(transferData, operation) {
    try {
      const statsRef = this.getStatsCollection().doc("global_stats");

      // Use transaction to ensure data consistency
      await this.getDb().runTransaction(async (transaction) => {
        const statsDoc = await transaction.get(statsRef);
        const currentStats = statsDoc.exists
          ? statsDoc.data()
          : await this.initializeGlobalStats();

        let newStats = { ...currentStats };

        if (operation === "create") {
          // New transfer created
          newStats.totalTransfers += 1;
          newStats.totalPlaylistsTransferred += 1;
          newStats.totalTracksTransferred += transferData.tracks?.total || 0;

          // Update platform usage
          newStats = this.updatePlatformUsage(newStats, transferData, "create");

          // Update transfer directions
          newStats = this.updateTransferDirections(
            newStats,
            transferData,
            "create",
          );

          // Update track matching stats
          if (transferData.tracks) {
            newStats.trackMatching.totalTracksProcessed +=
              transferData.tracks.total;
            newStats.trackMatching.totalTracksMatched +=
              transferData.tracks.matched || 0;
            newStats.trackMatching.totalTracksNotFound +=
              transferData.tracks.notFound || 0;
          }
        } else if (operation === "update" && transferData.status) {
          // Transfer status updated
          const oldStatus = transferData.oldStatus; // This should be passed from the controller

          if (oldStatus !== transferData.status) {
            // Update status counts
            if (transferData.status === "completed") {
              newStats.successfulTransfers += 1;
            } else if (transferData.status === "failed") {
              newStats.failedTransfers += 1;
            } else if (transferData.status === "cancelled") {
              newStats.cancelledTransfers += 1;
            }
          }
        }

        newStats.lastUpdatedAt = new Date();

        transaction.set(statsRef, newStats);
      });

      return true;
    } catch (error) {
      console.error("Error updating global stats:", error);
      throw error;
    }
  }

  /**
   * Update platform usage statistics
   */
  updatePlatformUsage(stats, transferData, operation) {
    const { platforms, tracks } = transferData;

    if (!platforms || !tracks) return stats;

    // Initialize platforms if they don't exist
    if (!stats.platformUsage[platforms.from]) {
      stats.platformUsage[platforms.from] = {
        totalTransfers: 0,
        asSource: 0,
        asTarget: 0,
        totalPlaylists: 0,
        totalTracks: 0,
      };
    }

    if (!stats.platformUsage[platforms.to]) {
      stats.platformUsage[platforms.to] = {
        totalTransfers: 0,
        asSource: 0,
        asTarget: 0,
        totalPlaylists: 0,
        totalTracks: 0,
      };
    }

    if (operation === "create") {
      // Update source platform
      stats.platformUsage[platforms.from].totalTransfers += 1;
      stats.platformUsage[platforms.from].asSource += 1;
      stats.platformUsage[platforms.from].totalPlaylists += 1;
      stats.platformUsage[platforms.from].totalTracks += tracks.total;

      // Update target platform
      stats.platformUsage[platforms.to].totalTransfers += 1;
      stats.platformUsage[platforms.to].asTarget += 1;
      stats.platformUsage[platforms.to].totalPlaylists += 1;
      stats.platformUsage[platforms.to].totalTracks += tracks.total;
    }

    return stats;
  }

  /**
   * Update transfer direction statistics
   */
  updateTransferDirections(stats, transferData, operation) {
    const { platforms, tracks } = transferData;

    if (!platforms || !tracks) return stats;

    const directionKey = `${platforms.from}->${platforms.to}`;

    // Initialize direction if it doesn't exist
    if (!stats.transferDirections[directionKey]) {
      stats.transferDirections[directionKey] = {
        totalTransfers: 0,
        successfulTransfers: 0,
        totalPlaylists: 0,
        totalTracks: 0,
      };
    }

    if (operation === "create") {
      stats.transferDirections[directionKey].totalTransfers += 1;
      stats.transferDirections[directionKey].totalPlaylists += 1;
      stats.transferDirections[directionKey].totalTracks += tracks.total;
    }

    return stats;
  }

  /**
   * Get platform-specific statistics
   */
  async getPlatformStats(platform) {
    try {
      const globalStats = await this.getGlobalStats();
      return globalStats.platformUsage[platform] || null;
    } catch (error) {
      console.error("Error getting platform stats:", error);
      throw error;
    }
  }

  /**
   * Get transfer direction statistics
   */
  async getTransferDirectionStats(fromPlatform, toPlatform) {
    try {
      const globalStats = await this.getGlobalStats();
      const directionKey = `${fromPlatform}->${toPlatform}`;
      return globalStats.transferDirections[directionKey] || null;
    } catch (error) {
      console.error("Error getting transfer direction stats:", error);
      throw error;
    }
  }

  /**
   * Reset all statistics (for testing/admin purposes)
   */
  async resetStats() {
    try {
      await this.getStatsCollection().doc("global_stats").delete();
      return await this.initializeGlobalStats();
    } catch (error) {
      console.error("Error resetting stats:", error);
      throw error;
    }
  }
}

module.exports = new FirestoreService();
