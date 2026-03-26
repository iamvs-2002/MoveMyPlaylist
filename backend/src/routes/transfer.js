const express = require("express");
const transferController = require("../controllers/transferController");
const { requireAuth } = require("../middleware/auth");
const { validateTransferRequest } = require("../middleware/validation");

const router = express.Router();

/**
 * @route GET /api/transfer/platforms
 * @desc Get available platforms for transfer
 * @access Public (no auth required)
 */
router.get("/platforms", transferController.getAvailablePlatforms);

/**
 * @route POST /api/transfer
 * @desc Transfer playlist from one platform to another
 * @access Private (requires both platform auths)
 */
router.post(
  "/",
  requireAuth("both"),
  validateTransferRequest,
  transferController.transferPlaylist,
);

/**
 * @route GET /api/transfer/:id
 * @desc Get transfer status and progress
 * @access Private
 */
router.get("/:id", transferController.getTransferStatus);

/**
 * @route GET /api/transfer
 * @desc Get user's transfer history
 * @access Private
 */
router.get("/", transferController.getTransferHistory);

/**
 * @route DELETE /api/transfer/:id
 * @desc Cancel ongoing transfer
 * @access Private
 */
router.delete("/:id", transferController.cancelTransfer);

/**
 * @route POST /api/transfer/validate
 * @desc Validate playlist before transfer (dry run)
 * @access Private (requires both platform auths)
 */
router.post(
  "/validate",
  requireAuth("both"),
  validateTransferRequest,
  transferController.validateTransfer,
);

/**
 * @route GET /api/transfer/stats/global
 * @desc Get global transfer statistics
 * @access Public (no auth required)
 */
router.get("/stats/global", transferController.getTransferStats);

module.exports = router;
