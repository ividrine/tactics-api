import * as z from "zod";

const startMatchmaking = {
  body: z
    .object({
      attributes: z.record(z.string(), z.any()).optional(),
      latencies: z.record(z.string(), z.coerce.number()).optional()
    })
    .optional()
};

const stopMatchmaking = {
  body: z.object({
    ticketId: z.string().min(1, "ticketId required")
  })
};

const acceptMatch = {
  body: z.object({
    ticketId: z.string().min(1, "ticketId required"),
    accept: z.boolean("accept is required")
  })
};

export default {
  startMatchmaking,
  stopMatchmaking,
  acceptMatch
};
