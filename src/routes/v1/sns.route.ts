import express from "express";
import snsController from "../../controllers/sns.controller.js";
import { validateSNS } from "../../middlewares/validate.middleware.js";

const router = express.Router();

router.post("/matchmaking", validateSNS, snsController.processMatchmaking);

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
