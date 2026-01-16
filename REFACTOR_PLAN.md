# Technical Debt Refactoring Plan

## Phase 1: Code Cleanup (High Priority - Quick Wins)
- [x] Fix `variantBlobFree` undefined reference in AIVoicePanel.tsx
- [ ] Remove all unused `setVariantBlobFree`, `setDubbedBlob` references
- [ ] Clean up orphaned state in RecordingStudio.tsx
- [ ] Consolidate duplicated button handlers and state logic

## Phase 2: Module Boundary Separation (High Priority - Architecture)
Split shared package into clear layers:

### Current Problem:
- `persistent-mission-service.ts` imports `postgres-database.ts`
- Both get exposed through main `index.ts`
- Browser tries to bundle Node.js-only `pg` module → build errors

### Solution: Create Package Exports Structure
```
packages/shared/
├── src/
│   ├── index.ts                    # Browser-safe exports only
│   ├── index.server.ts            # Server-only exports  
│   ├── types/                      # Shared types (safe)
│   ├── config/                     # Configuration (safe)
│   ├── utils/                      # Utilities (safe)
│   ├── services/
│   │   ├── database-service.ts     # Interface only (safe)
│   │   ├── postgres-database.ts    # Server-only (NOT in main index)
│   │   ├── localStorage-database.ts # Browser (safe)
│   │   └── mission-service.ts      # Safe interface
│   └── server/                     # NEW: Server-only folder
│       ├── postgres-adapter.ts
│       └── persistent-mission-service.ts
```

### Export Rules:
- **index.ts**: Only types, utilities, browser services, safe configs
- **index.server.ts**: Server-only services (imported only by server code)
- **Direct imports**: Apps/API routes import from service files directly

## Phase 3: TypeScript Tightening (High Priority - Type Safety)
- [ ] Fix prop type mismatches (AudioVersionSource vs string)
- [ ] Replace all `any` types with proper interfaces
- [ ] Add consistent error handling types
- [ ] Create proper SaveResult interface variations
- [ ] Add strict null checks config

## Phase 4: Service Initialization Refactoring (Medium Priority)
Replace smart factory pattern with explicit dependency injection:

### Current:
```typescript
export function createMissionService(database?: DatabaseService) {
  if (database) return new PersistentMissionService(database);
  if (typeof window !== 'undefined') return new PersistentMissionService(createLocalStorageDatabase());
  if (process.env.DATABASE_URL) return new PersistentMissionService(createPostgresDatabase());
  return new PersistentMissionService(createInMemoryDatabase());
}
```

### Proposed:
```typescript
// Client-side: explicit import and initialization
import { createMissionService } from '@voisss/shared/services/mission-service';
const missionService = createMissionService(createLocalStorageDatabase('voisss'));

// Server-side: explicit import and initialization  
import { createMissionService } from '@voisss/shared/services/mission-service';
import { createPostgresDatabase } from '@voisss/shared/server/postgres-adapter';
const missionService = createMissionService(createPostgresDatabase());
```

## Phase 5: Hook Architecture (Medium Priority)
Remove lazy loading workarounds:

### Current Problem:
```typescript
// apps/web/src/hooks/queries/useMissions.ts
function getMissionService() {
  // Lazy dynamic import to avoid bundling postgres
  const { createPersistentMissionService } = require('@voisss/shared/services/persistent-mission-service');
  // ...
}
```

### Solution:
- Create separate client hook: `@voisss/shared/hooks/useMissionService.ts` (browser-safe)
- Server code imports service directly without lazy loading
- Remove dynamic import() workarounds

## Implementation Priority:

1. **Week 1**: Phase 1 (Code Cleanup) + Phase 2 (Package Structure)
   - ~2-3 hours to clean orphaned code
   - ~3-4 hours to reorganize packages and test
   - Total: ~6 hours, unblocks team from build errors

2. **Week 2**: Phase 3 (TypeScript) + Phase 4 (Services)
   - ~3-4 hours for TypeScript fixes
   - ~2-3 hours for service refactoring
   - Total: ~6 hours, improves developer experience

3. **Week 3**: Phase 5 (Hooks) + Testing
   - ~2-3 hours for hook updates
   - ~2-3 hours for integration testing
   - Total: ~5 hours

**Total Estimate**: ~17 hours spread over 3 weeks

## Benefits:
✅ Eliminates browser bundling errors permanently
✅ Reduces prop drilling and lazy loading hacks
✅ Better IDE type checking and autocomplete
✅ Clearer separation of concerns for future features
✅ Easier onboarding for new developers
