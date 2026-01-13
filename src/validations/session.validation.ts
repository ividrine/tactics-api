import * as z from "zod";

const createPlayerSession = {
  body: z.object({
    playerId: z.string().min(1, "Player Id required"),
    gameSessionId: z.string().min(1, "Game Session Id required")
  })
};

export default {
  createPlayerSession
};
