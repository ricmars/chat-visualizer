// Platform Transformer Types
// These define the interface for transforming Pega ChatMessage to platform-specific formats

import type { ChatMessage } from "../types";

/**
 * Supported output platforms
 */
export type PlatformType = 
  | "pega"             // Pega native ChatMessage format
  | "adaptive-cards"   // Microsoft Adaptive Cards (Teams, Outlook, etc.)
  | "slack-blocks"     // Slack Block Kit
  | "google-a2ui"      // Google A2UI schema
  | "json-render";     // Vercel json-render (AI → JSON → UI)

/**
 * Platform metadata
 */
export interface PlatformInfo {
  id: PlatformType;
  name: string;
  description: string;
  schemaUrl?: string;
}

/**
 * Transformation result with optional metadata
 */
export interface TransformResult<T = unknown> {
  platform: PlatformType;
  output: T;
  /** Original Pega message */
  source?: ChatMessage;
  /** Any warnings during transformation */
  warnings?: string[];
}

/**
 * Base interface for all platform transformers
 */
export interface PlatformTransformer<T = unknown> {
  /** Platform identifier */
  readonly platform: PlatformType;
  
  /** Human-readable platform name */
  readonly name: string;
  
  /** Transform a Pega ChatMessage to platform-specific format */
  transform(message: ChatMessage): TransformResult<T>;
  
  /** Check if this transformer supports a specific message feature */
  supports?(feature: string): boolean;
}

/**
 * Registry for managing platform transformers
 */
export interface TransformerRegistry {
  /** Get a transformer by platform type */
  get(platform: PlatformType): PlatformTransformer | undefined;
  
  /** Register a new transformer */
  register(transformer: PlatformTransformer): void;
  
  /** Get all registered platforms */
  getPlatforms(): PlatformInfo[];
  
  /** Transform a message to a specific platform */
  transform(message: ChatMessage, platform: PlatformType): TransformResult;
}
