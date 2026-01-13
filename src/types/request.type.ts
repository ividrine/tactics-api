import { z, ZodType } from "zod";

import matchmakingValidations from "../validations/match.validations.js";
import type { IncomingMessage } from "http";
import type { Request } from "express";
import { AuthPayload } from "./jwt.type.js";
import { AttributeValue } from "@aws-sdk/client-gamelift";

export type RequestSchema = {
  params?: ZodType;
  query?: ZodType;
  body?: ZodType;
  headers?: ZodType;
};

/**
 * Authenticated Requests
 */

export type AuthRequest = Request & { auth: { payload: AuthPayload } };

export type AuthIncomingRequest = IncomingMessage & {
  auth: { payload: AuthPayload };
};
/**
 * Matchmaking
 */

export type StartMatchmakingRequest = {
  attributes: Record<string, AttributeValue>;
  latencies: Record<string, number>;
};

export type StopMatchmakingRequest = z.infer<
  typeof matchmakingValidations.stopMatchmaking.body
>;

export type AcceptMatchRequest = z.infer<
  typeof matchmakingValidations.acceptMatch.body
>;
