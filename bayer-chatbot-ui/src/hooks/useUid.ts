import { useCallback } from "react";

/**
 * Generate a unique ID using crypto.randomUUID with timestamp fallback
 */
function generateUid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

/**
 * Hook providing a stable UID generator
 */
export function useUid() {
  return useCallback((prefix = "") => `${prefix}${generateUid()}`, []);
}

/**
 * Standalone UID generator for use outside components
 */
export const uid = generateUid;
