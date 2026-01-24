// Pega Transformer - Pass-through for native ChatMessage format

import type { ChatMessage } from "../types";
import type { PlatformTransformer, TransformResult } from "./types";

/**
 * Pass-through transformer for Pega ChatMessage format
 * This is used when the client supports our native format directly
 */
export class PegaTransformer implements PlatformTransformer<ChatMessage> {
  readonly platform = "pega" as const;
  readonly name = "Pega";

  transform(message: ChatMessage): TransformResult<ChatMessage> {
    return {
      platform: this.platform,
      output: message,
      source: message,
    };
  }

  supports(_feature: string): boolean {
    // Pega format supports all features
    return true;
  }
}
