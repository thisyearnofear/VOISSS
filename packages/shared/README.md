# @voisss/shared

Shared types, services, and utilities for the VOISSS platform.

## Core Principles

- **ENHANCEMENT FIRST**: Always enhance existing components over creating new ones
- **CONSOLIDATION**: Single source of truth for all shared logic
- **DRY**: No duplication across packages
- **CLEAN**: Clear separation of concerns
- **MODULAR**: Composable, testable, independent modules
- **PERFORMANT**: Optimized for production use

## Features

### Mission System
- Mission creation and management
- Reward distribution with milestones
- Quality validation
- Geographic targeting

### Engagement System (NEW)
- **Referral tracking** with automatic rewards
- **Streak mechanics** with daily recording incentives
- **Leaderboards** (daily, weekly, monthly, all-time)
- **Achievement system** with unlockable badges
- **Notification center** for user engagement
- **Analytics** and user metrics

### Token Access
- Tier-based feature gating
- Balance checking with caching
- Multi-chain support

## Usage

### Engagement Service

```typescript
import { EngagementService, getEngagementService } from '@voisss/shared';
import { createLocalStorageDatabase } from '@voisss/shared';

// Initialize
const db = createLocalStorageDatabase('voisss');
const engagement = getEngagementService(db);

// Track referrals
const code = await engagement.generateReferralCode(userId, recordingId);
await engagement.trackShare(userId, recordingId, 'twitter', code.code);

// Update streaks
const streak = await engagement.updateStreak(userId);

// Check achievements
const newAchievements = await engagement.checkAchievements(userId);

// Get leaderboard
const leaderboard = await engagement.getLeaderboard('weekly', 'earnings');
```

### React Hook

```typescript
import { useEngagement } from '@voisss/shared';

function MyComponent() {
  const {
    streak,
    updateStreak,
    generateReferralCode,
    trackShare,
    leaderboard,
    notifications,
    unreadCount,
    metrics,
  } = useEngagement(engagementService, {
    userId: currentUser.id,
    autoRefresh: true,
  });

  return (
    <div>
      <StreakDisplay 
        currentStreak={streak?.currentStreak || 0}
        longestStreak={streak?.longestStreak || 0}
      />
      <NotificationBell
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={markRead}
      />
    </div>
  );
}
```

### Enhanced Social Sharing

```typescript
import { SocialShare } from '@voisss/ui';

<SocialShare
  recording={recording}
  userId={currentUser.id}
  generateReferralCode={async (userId, recordingId) => {
    const code = await engagement.generateReferralCode(userId, recordingId);
    return code.code;
  }}
  onShare={async (platform, url, referralCode) => {
    await engagement.trackShare(userId, recording.id, platform, referralCode);
  }}
/>
```

## Architecture

### Database Collections

- `missions` - Mission definitions
- `mission_responses` - User submissions
- `referral_codes` - Generated referral codes
- `referral_conversions` - Successful referrals
- `share_events` - Social sharing tracking
- `user_streaks` - Daily recording streaks
- `achievements` - Achievement definitions
- `user_achievements` - Unlocked achievements
- `notifications` - User notifications
- `user_engagement_metrics` - Aggregated user stats

### Reward Flow

1. User completes action (recording, referral, streak)
2. Service checks eligibility and calculates reward
3. Reward record created with status 'pending'
4. Notification sent to user
5. User claims reward
6. Status updated to 'claimed'
7. Transaction hash recorded

## Development

```bash
# Build
pnpm build

# Test
pnpm test

# Type check
pnpm typecheck
```

## License

MIT
