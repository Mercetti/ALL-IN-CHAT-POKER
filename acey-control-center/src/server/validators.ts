import { z } from "zod";

export const AceyOutputSchema = z.object({
  speech: z.string().max(500),
  intents: z.array(z.object({
    type: z.string()
  }))
});
