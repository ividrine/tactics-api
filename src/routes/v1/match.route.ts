import express from "express";
import authorize from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import matchValidation from "../../validations/match.validations.js";
import matchController from "../../controllers/match.controller.js";
import {
  START_MATCHMAKING,
  STOP_MATCHMAKING,
  ACCEPT_MATCH
} from "../../constants/permission.constants.js";

const router = express.Router();

router.post(
  "/start",
  authorize(START_MATCHMAKING),
  validate(matchValidation.startMatchmaking),
  matchController.startMatchmaking
);

router.post(
  "/stop",
  authorize(STOP_MATCHMAKING),
  validate(matchValidation.stopMatchmaking),
  matchController.stopMatchmaking
);

router.post(
  "/accept",
  authorize(ACCEPT_MATCH),
  validate(matchValidation.acceptMatch),
  matchController.acceptMatch
);

export default router;

/**
 * @openapi
 * tags:
 *   name: Match
 *   description: Player matchmaking
 */

/**
 * @openapi
 * /match/start:
 *   post:
 *     summary: Start matchmaking
 *     description: Sends Gamelift StartMatchmaking request.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - playerId
 *             properties:
 *               playerId:
 *                 type: string
 *                 description: this value should be the player's username
 *               attributes:
 *                 type: object
 *                 description: Gamelift PlayerAttributeMap
 *               latencies:
 *                 type: object
 *                 description: Gamelift LatencyMap
 *             example:
 *               playerId: coolusername
 *               attributes: {}
 *               latencies: {}
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *                $ref: '#/components/schemas/User'
 *       "400":
 *         $ref: '#/components/responses/DuplicateEmail'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 */
