// Lib
import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import logger from "./config/logger.js";
import config from "./config/config.js";
import { TokenType } from "@prisma/client";
import valkey, { publisher } from "./lib/valkey.js";

// Services
import roomService from "./services/room.service.js";
import gameliftService from "./services/gamelift.service.js";

// Constants
import {
  WS_MSG_JOIN_ROOM,
  WS_MSG_LEAVE_ROOM,
  WS_MSG_CHAT_ROOM
} from "./constants/ws.constants.js";

import {
  GL_POTENTIAL_MATCH_CREATED,
  GL_MATCHMAKING_SUCCEEDED,
  GL_ACCEPT_MATCH_COMPLETED,
  GL_ACCEPT_MATCH
} from "./constants/aws.constants.js";

import { CHAT_CHANNEL } from "./constants/subscribe.constants.js";

// Types
import type { MatchEvent } from "./types/aws.type.js";
import type { IncomingMessage, Server } from "http";
import type { AuthPayload } from "./types/jwt.type.js";
import type {
  IncomingChatRoomPayload,
  IncomingJoinRoomPayload,
  IncomingLeaveRoomPayload,
  OutChatPayload,
  OutMatchmakingPayload,
  WSIncomingMessage,
  WSOutgoingMessage
} from "./types/ws.type.js";

export const clients = new Map<string, WebSocket>(); // playerId -> WebSocket
export const serverId = crypto.randomUUID();
// const IDLE_TIMEOUT_MS = 5 * 60 * 1000;

/** Create new instance of web socket server */
const createSocketServer = async (httpServer: Server) => {
  const wss = new WebSocketServer({ server: httpServer });
  wss.on("connection", onConnection);
  wss.on("close", onClose);
  return wss;
};

/** On new client connection */
const onConnection = async (ws: WebSocket, request: IncomingMessage) => {
  const { err, playerId } = authorize(request);

  if (err) {
    ws.close(1008, "Unauthorized");
    return;
  }

  clients.set(playerId, ws);

  // Todo - figure out what to do with this
  await valkey.set(`user:${playerId}`, serverId, "EX", 3600);
  logger.info(`${playerId} connected.`);

  // Bind events
  ws.on("message", async (message: string) => {
    const data: WSIncomingMessage = JSON.parse(message);
    if (data?.type == WS_MSG_JOIN_ROOM) {
      await joinRoom(ws, playerId, data.payload as IncomingJoinRoomPayload);
    } else if (data?.type == WS_MSG_CHAT_ROOM) {
      logger.info("Chat message received");
      await chatRoom(ws, playerId, data.payload as IncomingChatRoomPayload);
    } else if (data?.type == WS_MSG_LEAVE_ROOM) {
      await leaveRoom(playerId, data.payload as IncomingLeaveRoomPayload);
    }
  });

  ws.on("close", async () => {
    logger.info(`${playerId} disconnected.`);
    if (playerId) {
      clients.delete(playerId);
      await valkey.del(`user:${playerId}`);
    }
  });
};

const onClose = () => {
  logger.info("Server closed.");
};

const authorize = (request: IncomingMessage) => {
  try {
    const token = request?.headers.authorization?.split(" ")[1];

    const payload = jwt.verify(
      token as string,
      config.jwt.secret
    ) as AuthPayload;

    if (payload?.type != TokenType.ACCESS) throw new Error("Wrong token type");

    return { err: null, playerId: payload.username };
  } catch {
    return { err: "Unauthorized", playerId: "" };
  }
};

/**
 * Join a room
 * @param ws WebSocket
 * @param playerId Player ID
 * @param payload Room name
 */
export const joinRoom = async (
  ws: WebSocket,
  playerId: string,
  payload: IncomingJoinRoomPayload
) => {
  // Is room name valid ?
  const isValidRoom = roomService.isValidRoom(payload.room);

  if (!isValidRoom) {
    ws.send(JSON.stringify({ type: "error", message: "Invalid room" }));
    return;
  }

  if (payload.room.startsWith("game-session-")) {
    const gameSessionId = payload.room.split("-")[1];

    const isPlayerInGameSession = await gameliftService.isPlayerInGameSession(
      playerId,
      gameSessionId
    );

    if (!isPlayerInGameSession) {
      ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
      return;
    }
  }

  // Is player allowed to join lobby ?
  if (payload.room.startsWith("lobby-")) {
    const lobbyId = payload.room.split("-")[1];
    logger.info("lobbyId", lobbyId);
  }

  // Add player to room
  await roomService.addPlayerToRoom(playerId, payload.room);

  logger.info(`${playerId} joined ${payload.room}.`);
};

export const chatRoom = async (
  ws: WebSocket,
  playerId: string,
  payload: IncomingChatRoomPayload
) => {
  // Is player a member of room
  const isMember = await roomService.isPlayerInRoom(playerId, payload.room);

  if (!isMember) {
    ws.send(JSON.stringify({ type: "error", message: "Unauthorized" }));
    return;
  }

  // Handle chat message
  const chatPayload: OutChatPayload = {
    message: payload?.message,
    sender: playerId
  };

  // Publish to redis
  publisher.publish(
    `${CHAT_CHANNEL}:${payload.room}`,
    JSON.stringify(chatPayload)
  );
};

export const leaveRoom = async (
  playerId: string,
  payload: IncomingLeaveRoomPayload
) => {
  await roomService.removePlayerFromRoom(playerId, payload.room);
  logger.info(`${playerId} left ${payload.room}.`);
};

export const broadcastToRoom = async (room: string, message: string) => {
  const members = await valkey.smembers(`room:${room}`);
  for (const playerId of members) {
    const client = clients.get(playerId);
    if (client && client.readyState == WebSocket.OPEN) {
      client.send(message);
    }
  }
};

export const broadcastMatchUpdate = (message: string) => {
  const matchMessage = JSON.parse(message) as MatchEvent;

  const { type, tickets, gameSessionInfo } = matchMessage.detail;

  if (!tickets) return;

  for (const ticket of tickets) {
    for (const player of ticket.players) {
      const client = clients.get(player.playerId);

      if (client && client.readyState == WebSocket.OPEN) {
        let payload: OutMatchmakingPayload = {};

        if (type == GL_POTENTIAL_MATCH_CREATED) {
          payload = {
            acceptanceTimeout: matchMessage.detail.acceptanceTimeout,
            acceptanceRequired: matchMessage.detail.acceptanceRequired
          };
        } else if (type == GL_MATCHMAKING_SUCCEEDED) {
          payload = {
            playerId: player.playerId,
            playerSessionId: player.playerSessionId as string,
            // TODO load some additional player data (avatarUrl) to use for pre match loading ?
            players: gameSessionInfo?.players,
            gameSessionInfo: {
              ipAddress: gameSessionInfo?.ipAddress as string,
              port: gameSessionInfo?.port as number
            }
          };
        } else if (type == GL_ACCEPT_MATCH) {
          logger.info("Accept match", player.accepted);
          payload = { accepted: player.accepted as boolean };
        } else if (type == GL_ACCEPT_MATCH_COMPLETED) {
          payload = { acceptance: matchMessage.detail.acceptance };
        }

        const outMsg: WSOutgoingMessage = {
          type,
          payload
        };

        client.send(JSON.stringify(outMsg));
      }
    }
  }
};

export default {
  createSocketServer
};
