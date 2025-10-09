// Utility functions for VOISSS platform

/**
 * Format duration from milliseconds to human-readable string
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Generate unique ID for recordings
 */
export function generateRecordingId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate Starknet address format
 */
export function isValidStarknetAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{63,64}$/.test(address);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Debounce function for search and input handling
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Calculate audio quality score based on metadata
 */
export function calculateQualityScore(metadata: {
  sampleRate: number;
  bitRate: number;
  channels: number;
}): number {
  const { sampleRate, bitRate, channels } = metadata;

  // Normalize values (0-1 scale)
  const sampleRateScore = Math.min(sampleRate / 48000, 1);
  const bitRateScore = Math.min(bitRate / 320000, 1);
  const channelsScore = channels >= 2 ? 1 : 0.7;

  // Weighted average
  return (sampleRateScore * 0.4 + bitRateScore * 0.4 + channelsScore * 0.2) * 100;
}


