export interface Player {
  playerId: string;
  playerSessionId?: string;
  playerAttributes?: Record<string, unknown>;
  team?: string;
  latencyInMs?: Record<string, number>; // Latency data by region (e.g., { "us-west-2": 50 })
  accepted?: boolean;
}

export interface Ticket {
  ticketId: string;
  startTime: string;
  players: Player[];
}

export interface RuleEvaluationMetric {
  ruleName: string;
  passedCount: number;
  failedCount: number;
}

export interface GameSessionInfo {
  players: Player[];
  gameSessionArn?: string;
  ipAddress?: string;
  port?: number;
}

export interface SNSPayload {
  Type: "Notification" | "SubscriptionConfirmation" | "UnsubscribeConfirmation";
  MessageId: string;
  TopicArn: string; // ARN of sns topic
  Subject?: string; // Optional, if specified when publishing (for Notification type)
  Message: string; // JSON string of the MatchEvent (for Notification) or confirmation details (for SubscriptionConfirmation/UnsubscribeConfirmation)
  Timestamp: string; // ISO 8601 timestamp
  SignatureVersion: string; // e.g., "1"
  Signature: string; // Base64-encoded signature for verification
  SigningCertURL: string; // URL to the signing certificate
  UnsubscribeURL?: string; // URL to unsubscribe the endpoint (optional for Notification, included in SubscriptionConfirmation)
  Token?: string; // Token for confirming subscription (included in SubscriptionConfirmation)
  SubscribeURL?: string; // URL to confirm subscription (included in SubscriptionConfirmation)
}

export type MatchEvent = {
  version: string;
  id: string;
  "detail-type": string;
  source: string;
  account: string;
  time: string;
  region: string;
  resources: string[];
  detail: MatchEventDetail;
};

export type MatchEventDetail =
  | MatchmakingSearchingDetail
  | PotentialMatchCreatedDetail
  | AcceptMatchDetail
  | AcceptMatchCompletedDetail
  | MatchmakingSucceededDetail
  | MatchmakingTimedOutDetail
  | MatchmakingCancelledDetail
  | MatchmakingFailedDetail;

export interface MatchmakingSearchingDetail {
  type: "MatchmakingSearching";
  tickets: Ticket[];
  estimatedWaitMillis: string | number; // e.g., "NOT_AVAILABLE" or numeric value
  gameSessionInfo?: GameSessionInfo;
}

export interface PotentialMatchCreatedDetail {
  type: "PotentialMatchCreated";
  tickets: Ticket[];
  acceptanceTimeout: number; // Seconds for acceptance
  acceptanceRequired: boolean;
  matchId: string;
  ruleEvaluationMetrics?: RuleEvaluationMetric[];
  gameSessionInfo: GameSessionInfo;
}

export interface AcceptMatchDetail {
  type: "AcceptMatch";
  tickets: Ticket[];
  matchId: string;
  gameSessionInfo: GameSessionInfo; // Includes accepted status for players where applicable
}

export interface AcceptMatchCompletedDetail {
  type: "AcceptMatchCompleted";
  tickets: Ticket[];
  matchId: string;
  acceptance: string; // True if all players accepted
  gameSessionInfo?: GameSessionInfo;
}

export interface MatchmakingSucceededDetail {
  type: "MatchmakingSucceeded";
  tickets: Ticket[];
  matchId: string;
  gameSessionInfo: GameSessionInfo; // Includes connection details like ipAddress, port
}

export interface MatchmakingTimedOutDetail {
  type: "MatchmakingTimedOut";
  tickets: Ticket[];
  reason?: string; // Optional reason for timeout
  ruleEvaluationMetrics: RuleEvaluationMetric[];
  message: string;
  gameSessionInfo: GameSessionInfo;
}

export interface MatchmakingCancelledDetail {
  type: "MatchmakingCancelled";
  tickets: Ticket[];
  reason?: string;
  ruleEvaluationMetrics: RuleEvaluationMetric[];
  message: string;
  gameSessionInfo: GameSessionInfo;
}

export interface MatchmakingFailedDetail {
  type: "MatchmakingFailed";
  tickets: Ticket[];
  reason?: string;
  message: string;
  gameSessionInfo: GameSessionInfo;
}
