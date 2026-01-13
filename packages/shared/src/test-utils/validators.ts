/**
 * Test Utilities - Interface Validators
 * 
 * Simple validation functions that follow our core principles:
 * - CLEAN: Clear validation logic
 * - DRY: Reusable validation patterns
 * - MODULAR: Independent validation functions
 */

import {
  ScrollVoiceChallenge,
  VoiceChallengeSubmission,
  ScrollLeaderboardEntry,
  ScrollAchievement,
  UserAchievementProgress,
  AIVoiceStyle,
  AIEnhancementOption
} from '../types/audio';

/**
 * Validate ScrollVoiceChallenge interface
 */
export function validateScrollVoiceChallenge(challenge: ScrollVoiceChallenge): boolean {
  const requiredFields: (keyof ScrollVoiceChallenge)[] = [
    'id', 'title', 'description', 'theme', 'difficulty', 'reward',
    'chainSpecific', 'startDate', 'endDate', 'isActive'
  ];

  for (const field of requiredFields) {
    if (challenge[field] === undefined) {
      console.error(`Missing required field in ScrollVoiceChallenge: ${field}`);
      return false;
    }
  }

  // Validate difficulty
  const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
  if (!validDifficulties.includes(challenge.difficulty)) {
    console.error(`Invalid difficulty in ScrollVoiceChallenge: ${challenge.difficulty}`);
    return false;
  }

  // Validate chainSpecific
  const validChains = ['scroll', 'starknet', 'both'];
  if (!validChains.includes(challenge.chainSpecific)) {
    console.error(`Invalid chainSpecific in ScrollVoiceChallenge: ${challenge.chainSpecific}`);
    return false;
  }

  // Validate dates
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.error(`Invalid dates in ScrollVoiceChallenge`);
    return false;
  }

  if (startDate > endDate) {
    console.error(`Start date after end date in ScrollVoiceChallenge`);
    return false;
  }

  console.log(`✅ ScrollVoiceChallenge validated: ${challenge.title}`);
  return true;
}

/**
 * Validate VoiceChallengeSubmission interface
 */
export function validateVoiceChallengeSubmission(submission: VoiceChallengeSubmission): boolean {
  const requiredFields: (keyof VoiceChallengeSubmission)[] = [
    'challengeId', 'userAddress', 'recordingId', 'submissionDate',
    'voiceStyleUsed', 'enhancementsUsed', 'status'
  ];

  for (const field of requiredFields) {
    if (submission[field] === undefined) {
      console.error(`Missing required field in VoiceChallengeSubmission: ${field}`);
      return false;
    }
  }

  // Validate status
  const validStatuses = ['pending', 'approved', 'rejected', 'winner'];
  if (!validStatuses.includes(submission.status)) {
    console.error(`Invalid status in VoiceChallengeSubmission: ${submission.status}`);
    return false;
  }

  // Validate date
  const submissionDate = new Date(submission.submissionDate);
  if (isNaN(submissionDate.getTime())) {
    console.error(`Invalid submissionDate in VoiceChallengeSubmission`);
    return false;
  }

  console.log(`✅ VoiceChallengeSubmission validated for challenge: ${submission.challengeId}`);
  return true;
}

/**
 * Validate ScrollLeaderboardEntry interface
 */
export function validateScrollLeaderboardEntry(entry: ScrollLeaderboardEntry): boolean {
  const requiredFields: (keyof ScrollLeaderboardEntry)[] = [
    'userAddress', 'username', 'score', 'rank', 'challengesCompleted',
    'challengesWon', 'totalRecordings', 'privateRecordings', 'lastActive'
  ];

  for (const field of requiredFields) {
    if (entry[field] === undefined) {
      console.error(`Missing required field in ScrollLeaderboardEntry: ${field}`);
      return false;
    }
  }

  // Validate that rank is positive
  if (entry.rank <= 0) {
    console.error(`Invalid rank in ScrollLeaderboardEntry: ${entry.rank}`);
    return false;
  }

  // Validate date
  const lastActive = new Date(entry.lastActive);
  if (isNaN(lastActive.getTime())) {
    console.error(`Invalid lastActive date in ScrollLeaderboardEntry`);
    return false;
  }

  console.log(`✅ ScrollLeaderboardEntry validated: ${entry.username} (Rank ${entry.rank})`);
  return true;
}

/**
 * Validate ScrollAchievement interface
 */
export function validateScrollAchievement(achievement: ScrollAchievement): boolean {
  const requiredFields: (keyof ScrollAchievement)[] = [
    'id', 'name', 'description', 'criteria', 'points', 'chainSpecific'
  ];

  for (const field of requiredFields) {
    if (achievement[field] === undefined) {
      console.error(`Missing required field in ScrollAchievement: ${field}`);
      return false;
    }
  }

  // Validate chainSpecific
  const validChains = ['scroll', 'starknet', 'both'];
  if (!validChains.includes(achievement.chainSpecific)) {
    console.error(`Invalid chainSpecific in ScrollAchievement: ${achievement.chainSpecific}`);
    return false;
  }

  // Validate points
  if (achievement.points <= 0) {
    console.error(`Invalid points in ScrollAchievement: ${achievement.points}`);
    return false;
  }

  console.log(`✅ ScrollAchievement validated: ${achievement.name} (${achievement.points} points)`);
  return true;
}

/**
 * Validate UserAchievementProgress interface
 */
export function validateUserAchievementProgress(progress: UserAchievementProgress): boolean {
  const requiredFields: (keyof UserAchievementProgress)[] = [
    'achievementId', 'userAddress', 'progress', 'completed'
  ];

  for (const field of requiredFields) {
    if (progress[field] === undefined) {
      console.error(`Missing required field in UserAchievementProgress: ${field}`);
      return false;
    }
  }

  // Validate progress range
  if (progress.progress < 0 || progress.progress > 100) {
    console.error(`Invalid progress in UserAchievementProgress: ${progress.progress}`);
    return false;
  }

  // Validate completion date if completed
  if (progress.completed && progress.completionDate) {
    const completionDate = new Date(progress.completionDate);
    if (isNaN(completionDate.getTime())) {
      console.error(`Invalid completionDate in UserAchievementProgress`);
      return false;
    }
  }

  console.log(`✅ UserAchievementProgress validated: ${progress.progress}% for ${progress.achievementId}`);
  return true;
}

/**
 * Validate AIVoiceStyle interface
 */
export function validateAIVoiceStyle(style: AIVoiceStyle): boolean {
  const requiredFields: (keyof AIVoiceStyle)[] = [
    'id', 'name', 'description', 'voiceId', 'category', 'previewText', 'icon'
  ];

  for (const field of requiredFields) {
    if (style[field] === undefined) {
      console.error(`Missing required field in AIVoiceStyle: ${field}`);
      return false;
    }
  }

  // Validate category
  const validCategories = ['professional', 'creative', 'fun', 'emotional'];
  if (!validCategories.includes(style.category)) {
    console.error(`Invalid category in AIVoiceStyle: ${style.category}`);
    return false;
  }

  console.log(`✅ AIVoiceStyle validated: ${style.name}`);
  return true;
}

/**
 * Validate AIEnhancementOption interface
 */
export function validateAIEnhancementOption(option: AIEnhancementOption): boolean {
  const requiredFields: (keyof AIEnhancementOption)[] = [
    'id', 'name', 'description', 'type', 'values'
  ];

  for (const field of requiredFields) {
    if (option[field] === undefined) {
      console.error(`Missing required field in AIEnhancementOption: ${field}`);
      return false;
    }
  }

  // Validate type
  const validTypes = ['style', 'emotion', 'effect', 'language'];
  if (!validTypes.includes(option.type)) {
    console.error(`Invalid type in AIEnhancementOption: ${option.type}`);
    return false;
  }

  // Validate values is array
  if (!Array.isArray(option.values) || option.values.length === 0) {
    console.error(`Values must be a non-empty array in AIEnhancementOption`);
    return false;
  }

  console.log(`✅ AIEnhancementOption validated: ${option.name}`);
  return true;
}

/**
 * Validate array of items
 */
export function validateArray<T>(items: T[], validator: (item: T) => boolean, itemName: string): boolean {
  if (!Array.isArray(items)) {
    console.error(`Expected array of ${itemName}, got ${typeof items}`);
    return false;
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!validator(item)) {
      console.error(`${itemName} validation failed at index ${i}`);
      return false;
    }
  }

  console.log(`✅ All ${items.length} ${itemName}(s) validated successfully`);
  return true;
}