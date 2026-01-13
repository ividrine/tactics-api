import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import snsService from "../services/sns.service.js";
import type { SNSPayload } from "../types/aws.type.js";

import {
  SNS_SUBSCRIPTION_CONFIRMATION,
  SNS_NOTIFICATION
} from "../constants/aws.constants.js";
import ApiError from "../utils/ApiError.js";

const processMatchmaking = catchAsync(async (req, res) => {
  const message = res.locals.input.body as SNSPayload;
  if (message.Type === SNS_SUBSCRIPTION_CONFIRMATION) {
    await snsService.confirmSubscription(message);
  } else if (message.Type === SNS_NOTIFICATION) {
    await snsService.notifyMatchmaking(message);
  } else {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid message type");
  }

  res.status(httpStatus.OK).send();
});

export default {
  processMatchmaking
};
