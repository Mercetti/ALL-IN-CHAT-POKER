import { AceyIntent } from "./intents";

export interface AceyOutput {
  speech: string;
  intents: AceyIntent[];
}
