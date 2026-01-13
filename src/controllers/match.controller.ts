import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import { gameliftService } from "../services/index.js";
import { AuthRequest } from "../types/request.type.js";

const startMatchmaking = catchAsync(async (req, res) => {
  const { attributes, latencies } = res.locals.input.body || {};

  const matchResponse = await gameliftService.startMatchmaking(
    (req as AuthRequest).auth.payload.username,
    attributes,
    latencies
  );

  const { TicketId, Status, EstimatedWaitTime } =
    matchResponse?.MatchmakingTicket || {};

  res.status(httpStatus.CREATED).send({
    ticketId: TicketId,
    status: Status,
    estimatedWaitTime: EstimatedWaitTime
  });
});

const stopMatchmaking = catchAsync(async (req, res) => {
  const { ticketId } = res.locals.input.body;
  await gameliftService.stopMatchmaking(
    (req as AuthRequest).auth.payload.username,
    ticketId
  );
  res.status(httpStatus.OK).send();
});

const acceptMatch = catchAsync(async (req, res) => {
  const { ticketId, accept } = res.locals.input.body;
  const matchResponse = await gameliftService.acceptMatch(
    (req as AuthRequest).auth.payload.username,
    ticketId,
    accept
  );
  res.status(httpStatus.OK).send({ matchResponse });
});
export default {
  startMatchmaking,
  stopMatchmaking,
  acceptMatch
};
