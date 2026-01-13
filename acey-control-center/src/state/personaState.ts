export interface PersonaState {
  currentMode: "calm" | "hype" | "neutral";
  locked: boolean;
  lastChange: number;
}

export const personaState: PersonaState = {
  currentMode: "neutral",
  locked: false,
  lastChange: Date.now()
};
