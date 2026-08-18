import Groq from "groq-sdk";
import { config } from "./config.js";

export const groq = new Groq({
  apiKey: config.groqApiKey,
});
