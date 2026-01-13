import { z } from "zod";
import { AceyIntent } from "../contracts/intents";

export const AceyOutputSchema = z.object({
  speech: z.string().max(500),
  intents: z.array(z.any()) // Accept any valid AceyIntent structure
});
