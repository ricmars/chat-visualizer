// Platform Transformer Registry
// Central registry for all platform transformers

import type { ChatMessage } from "../types";
import type { 
  PlatformType, 
  PlatformInfo, 
  PlatformTransformer, 
  TransformResult,
  TransformerRegistry 
} from "./types";
import { PegaTransformer } from "./pega";
import { AdaptiveCardsTransformer } from "./adaptive-cards";
import { JsonRenderTransformer } from "./json-render";
import { GoogleA2UITransformer } from "./google-a2ui";

// Re-export types
export type { 
  PlatformType, 
  PlatformInfo, 
  PlatformTransformer, 
  TransformResult,
  TransformerRegistry 
} from "./types";

// Re-export transformers
export { PegaTransformer } from "./pega";
export { AdaptiveCardsTransformer, type AdaptiveCard } from "./adaptive-cards";
export { JsonRenderTransformer, type JsonRenderTree, type JsonRenderElement } from "./json-render";
export { GoogleA2UITransformer, type A2UIDocument, type A2UIElement } from "./google-a2ui";

/**
 * Default transformer registry implementation
 */
class DefaultTransformerRegistry implements TransformerRegistry {
  private transformers = new Map<PlatformType, PlatformTransformer>();

  get(platform: PlatformType): PlatformTransformer | undefined {
    return this.transformers.get(platform);
  }

  register(transformer: PlatformTransformer): void {
    this.transformers.set(transformer.platform, transformer);
  }

  getPlatforms(): PlatformInfo[] {
    return Array.from(this.transformers.values()).map((t) => ({
      id: t.platform,
      name: t.name,
      description: `Transform to ${t.name} format`,
    }));
  }

  transform(message: ChatMessage, platform: PlatformType): TransformResult {
    const transformer = this.transformers.get(platform);
    if (!transformer) {
      throw new Error(`No transformer registered for platform: ${platform}`);
    }
    return transformer.transform(message);
  }
}

// Create and populate default registry
const registry = new DefaultTransformerRegistry();

// Register built-in transformers
registry.register(new PegaTransformer());
registry.register(new AdaptiveCardsTransformer());
registry.register(new JsonRenderTransformer());
registry.register(new GoogleA2UITransformer());

/**
 * Get the global transformer registry
 */
export function getTransformerRegistry(): TransformerRegistry {
  return registry;
}

/**
 * Convenience function to transform a message
 */
export function transformMessage(
  message: ChatMessage, 
  platform: PlatformType
): TransformResult {
  return registry.transform(message, platform);
}

/**
 * Get all available platforms
 */
export function getAvailablePlatforms(): PlatformInfo[] {
  return registry.getPlatforms();
}

/**
 * Transform a full conversation to a specific platform
 */
export function transformConversation(
  messages: ChatMessage[], 
  platform: PlatformType
): TransformResult[] {
  return messages.map((msg) => registry.transform(msg, platform));
}
