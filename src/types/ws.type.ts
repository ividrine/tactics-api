/**
 * Incoming data fron clients
 */

export interface WSIncomingMessage {
  type: string;
  payload:
    | IncomingJoinRoomPayload
    | IncomingChatRoomPayload
    | IncomingLeaveRoomPayload;
}

export type IncomingJoinRoomPayload = {
  room: string;
  password?: string;
};

export type IncomingChatRoomPayload = {
  room: string;
  message: string;
};

export type IncomingLeaveRoomPayload = {
  room: string;
};

/**
 * Outgoing data to clients
 */

export interface WSOutgoingMessage {
  type: string;
  payload?: OutChatPayload | OutMatchmakingPayload;
}

export type OutChatPayload = {
  message: string;
  sender: string;
};

export type OutMatchmakingPayload =
  | OutMatchCreatedPayload
  | OutMatchSucceededPayload
  | OutMatchCancelledPayload
  | OutMatchFailedPayload
  | OutMatchTimedOutPayload
  | OutAcceptMatchCompletedPayload
  | OutAcceptMatchPayload
  | Record<string, never>;

export type OutMatchCreatedPayload = {
  acceptanceTimeout: number;
  acceptanceRequired: boolean;
};

export type OutMatchSucceededPayload = {
  playerId: string;
  playerSessionId: string;
  gameSessionInfo: { ipAddress: string; port: number };
  players?: Array<{ playerId: string; avatarUrl?: string }>;
};

export type OutAcceptMatchPayload = {
  accepted: boolean;
};

export type OutAcceptMatchCompletedPayload = {
  acceptance: string;
};

export type OutMatchTimedOutPayload = { metadata: string };

export type OutMatchFailedPayload = { metadata: string };

export type OutMatchCancelledPayload = { metadata: string };
