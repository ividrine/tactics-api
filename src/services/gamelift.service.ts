import {
  DescribePlayerSessionsInput,
  DescribePlayerSessionsCommand,
  StartMatchmakingInput,
  StartMatchmakingCommand,
  StopMatchmakingInput,
  StopMatchmakingCommand,
  AcceptMatchInput,
  AcceptMatchCommand,
  AttributeValue
} from "@aws-sdk/client-gamelift";

import gamelift from "../lib/gamelift.js";

const isPlayerInGameSession = async (
  playerId: string,
  gameSessionId: string
) => {
  const input: DescribePlayerSessionsInput = {
    PlayerSessionId: playerId,
    GameSessionId: gameSessionId
  };

  const command = new DescribePlayerSessionsCommand(input);
  const response = await gamelift.send(command);

  const isValid =
    response?.PlayerSessions?.length &&
    response?.PlayerSessions[0].Status == "ACTIVE";

  return isValid;
};

const startMatchmaking = async (
  playerId: string,
  attributes: Record<string, AttributeValue>,
  latencies: Record<string, number>
) => {
  const input: StartMatchmakingInput = {
    ConfigurationName: "GameMatchmakingConfig",
    Players: [
      {
        PlayerId: playerId,
        PlayerAttributes: attributes || {},
        LatencyInMs: latencies || {}
      }
    ]
  };

  const command = new StartMatchmakingCommand(input);
  const result = await gamelift.send(command);

  return result;
};

const stopMatchmaking = async (playerId: string, ticketId: string) => {
  const input: StopMatchmakingInput = { TicketId: ticketId };
  const command = new StopMatchmakingCommand(input);
  await gamelift.send(command);
};

const acceptMatch = async (
  playerId: string,
  ticketId: string,
  accept: boolean
) => {
  const input: AcceptMatchInput = {
    TicketId: ticketId,
    PlayerIds: [playerId],
    AcceptanceType: accept ? "ACCEPT" : "REJECT"
  };
  const command = new AcceptMatchCommand(input);
  await gamelift.send(command);
};

export default {
  isPlayerInGameSession,
  startMatchmaking,
  stopMatchmaking,
  acceptMatch
};
