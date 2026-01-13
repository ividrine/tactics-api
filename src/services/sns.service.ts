import logger from "../config/logger.js";
import axios from "axios";
import { publisher } from "../lib/valkey.js";
import type { SNSPayload } from "../types/aws.type.js";

import { MATCHMAKING_CHANNEL } from "../constants/subscribe.constants.js";

const notifyMatchmaking = async (payload: SNSPayload) => {
  publisher.publish(MATCHMAKING_CHANNEL, payload.Message);
};

const confirmSubscription = async (message: SNSPayload) => {
  await axios.get(message.SubscribeURL as string);
  logger.info("SNS subscription confirmed");
};

export default {
  confirmSubscription,
  notifyMatchmaking
};
