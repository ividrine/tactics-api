import valkey from "../lib/valkey.js";
import logger from "../config/logger.js";
import {
  CHAT_CHANNEL,
  CHAT_PATTERN,
  MATCHMAKING_CHANNEL
} from "../constants/subscribe.constants.js";
import { broadcastMatchUpdate, broadcastToRoom } from "../websocket.js";
import { OutChatPayload, WSOutgoingMessage } from "../types/ws.type.js";
import { WS_MSG_CHAT } from "../constants/ws.constants.js";

const wsSubscriber = valkey.duplicate();

/**
 * Broadcast messages to clients
 *
 * @param channel - The redis channel name
 * @param message - The json string message to broadcast
 */
const onMessage = async (channel: string, message: string) => {
  if (channel == MATCHMAKING_CHANNEL) {
    broadcastMatchUpdate(message);
  }
};

const onPMessage = async (
  _pattern: string,
  channel: string,
  message: string
) => {
  if (_pattern === CHAT_PATTERN) {
    const room = channel.split(":")[1];

    const chatPayload: OutChatPayload = JSON.parse(message);

    const outMessage: WSOutgoingMessage = {
      type: WS_MSG_CHAT,
      payload: chatPayload
    };

    await broadcastToRoom(room, JSON.stringify(outMessage));
  }
};

/**
 * Callback for when we successfully subscribe to a channel
 *
 * @param err - The error if any
 * @param count - The number of channels subscribed to
 */
const onSubscribeSuccess = (err: Error | null | undefined, count: unknown) => {
  if (err) {
    logger.error("Failed to subscribe: %s", err.message);
  } else {
    logger.info(`wsSubscriber subscribed to ${count} channels.`);
  }
};

/** Subscribe to these redis channels */

const initialize = () => {
  wsSubscriber.subscribe(MATCHMAKING_CHANNEL, onSubscribeSuccess);
  wsSubscriber.psubscribe(`${CHAT_CHANNEL}:*`, onSubscribeSuccess);

  wsSubscriber.on("message", onMessage);
  wsSubscriber.on("pmessage", onPMessage);
};

export default { initialize };
