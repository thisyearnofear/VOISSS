# Release Readiness Checklist

## Current Status

### ✅ Completed (v2026-08-26)
- [x] Deterministic homepage demo — `QuickVoicePreview` always shows 3 playable voices
- [x] Voice detail pages — SSR `/marketplace/voices/[voiceId]` with Product/Offer structured data
- [x] Purchase loop — webhook handles license entitlements, receipts, and disputes
- [x] First-win conversion telemetry — client-side funnel tracking to GA4
- [x] Startup cost reduction — VoiceAssistant lazy-loaded, GA scripts in `<head>`

### 🔲 In Progress
- [ ] Mobile privacy/sign-in compliance (iOS/Play Store submission blockers)
- [ ] Stripe/webhook end-to-end test

---

## 1. Mobile Privacy & Sign-In Compliance

### iOS: Microphone Permission (`PrivacyInfo.xcprivacy`)

**Blocker**: `ios/VOISSS/Info.plist` uses a generic `NSMicrophoneUsageDescription`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to access your microphone</string>
```

**Required changes:**

1. Replace the generic description with a recording-purpose explanation:
   ```xml
   <key>NSMicrophoneUsageDescription</key>
   <string>VOISSS uses your microphone to record voice samples for AI voice licensing. Recordings are stored locally and uploaded to the VOISSS marketplace only when you choose to publish.</string>
   ```

2. Create `PrivacyInfo.xcprivacy` — Apple requires this for App Store submissions since iOS 17+.
   Must declare the following usage keys:
   - `NSPrivacyAccessedAPICategoryFileTimestamp` — not needed (skip)
   - `NSPrivacyAccessedAPICategoryUserDefaults` — not needed (skip)
   - **`NSPrivacyAccessedAPICategorySystemBootTime`** — used by expo-av for recording timing
   - **`NSPrivacyAccessedAPICategoryUserDefaults`** — used by onboardingService localStorage

   Minimal `PrivacyInfo.xcprivacy`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
     "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
     <key>NSPrivacyTracking</key>
     <false/>
     <key>NSPrivacyTrackingDomains</key>
     <array/>
   </dict>
   </plist>
   ```

3. Update `app.json` to reference the privacy file:
   ```json
   "ios": {
     "supportsTablet": true,
     "bundleIdentifier": "com.anonymous.voisss-mobile",
     "privacyManifests": {
       "privacyInfoUris": ["ios/VOISSS/PrivacyInfo.xcprivacy"]
     }
   }
   ```

### iOS: Sign In With Apple

**Blocker**: `components/OnboardingScreen.tsx` offers "Continue with Google" but:
- It's a **mock** — just calls `onboardingService.setupWalletWithSocialLogin('google')` with a `setTimeout`
- Apple requires **Sign In with Apple** if any third-party login is offered

**Two paths:**

**Option A (quick):** Remove Google sign-in entirely until properly implemented.
- Users sign in with wallet only (already supported via `Connect Wallet` option)

**Option B (complete):** Implement Sign In with Apple via `expo-auth-session` or `react-native-apple-authentication`.
- Requires Apple Developer Program membership ($99/yr)
- Apple ID entitlement in App Store Connect
- OAuth flow with `expo-auth-session/providers/apple`

**Recommendation:** Option A for initial submission. Add Sign In with Apple later when the App Store submission is in review and Apple requests it.

### Android: Google Sign-In

If Android submission is planned, Google Sign-In needs:
- `google-services.json` from Firebase Console
- Proper OAuth client IDs configured
- The current mock would need real implementation via `expo-auth-session/providers/google`

---

## 2. Stripe/Webhook End-to-End Test

### Test Plan

**Prerequisites:**
- Stripe CLI installed: `stripe --version`
- Stripe account with `checkout.sessions.create` and `webhooks` permissions
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in `.env.local`

### Test 1: Credit Pack Purchase Flow

```bash
# 1. Create a test checkout session
curl -X POST http://localhost:4445/api/payments/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "pack": "starter",
    "agentAddress": "0x1234567890123456789012345678901234567890",
    "context": {"voiceId": "test-voice-1", "voiceName": "Demo Voice"}
  }'

# Should return: { success: true, data: { sessionId: "cs_...", url: "https://checkout.stripe.com/..." } }

# 2. Check DB for entitlement record (after Stripe completes)
# The webhook should create a record in voisss_voice_licenses
```

### Test 2: Webhook Signature Verification

```bash
# 1. Start Stripe CLI forwarding to localhost
stripe listen --forward-to localhost:4445/api/payments/stripe/webhook

# 2. Trigger test event
stripe trigger checkout.session.completed

# 3. Verify logs show:
# [Stripe Webhook] Credits payment. Adding ...
# [Stripe Webhook] ✅ Credits added to ...
```

### Test 3: License Purchase Flow

```bash
# Simulate a voice license purchase via webhook metadata
# The license purchase path activates when session.metadata.voiceId is present
# This comes from BuyCreditsModal's context prop

# Trigger with custom metadata:
stripe triggers checkout.session.completed \
  --add "checkout.session.completed:metadata[voiceId]=test-voice-1" \
  --add "checkout.session.completed:metadata[voiceName]=Demo Voice" \
  --add "checkout.session.completed:metadata[agentAddress]=0x1234567890123456789012345678901234567890"
```

### Test 4: Entitlement Verification

After webhook processes the event, verify:

```sql
-- Check the license entitlement was created
SELECT * FROM voisss_voice_licenses
WHERE stripe_session_id = 'cs_test_xxx'
  AND status = 'active';

-- Expected columns:
-- id, voiceId, licenseeAddress, licenseType, stripeSessionId,
-- receiptNumber, amountPaid, currency, status, purchasedAt, expiresAt
```

### Test 5: Dispute Handling

```bash
# Simulate a dispute
stripe triggers charge.dispute.created

# Verify dispute record exists:
SELECT * FROM voisss_disputes
WHERE payment_intent = 'pi_xxx';
```

### Acceptance Criteria

| Test | Pass Condition |
|------|---------------|
| Credit pack purchase | `checkout.session.completed` → credits added via `addCreditsToAgent` |
| License purchase | `checkout.session.completed` with `voiceId` → `createLicenseEntitlement` → record in DB |
| Receipt number | Format `RCPT-{last 8 of session ID}`, uppercase |
| Webhook signature | Invalid signature returns 400 |
| Dispute handling | `charge.dispute.created` → record in `voisss_disputes` |
| Success URL | Redirects to `/studio?credits=success&pack=X&voiceId=Y` |
| Cancel URL | Redirects to `/studio?credits=cancelled` |

---

## 3. Pre-Submission Checklist

### App Store (iOS)
- [ ] Replace `NSMicrophoneUsageDescription` with recording-specific explanation
- [ ] Add `PrivacyInfo.xcprivacy` with correct usage keys
- [ ] Remove or implement Google sign-in (Sign In with Apple required if any third-party login exists)
- [ ] Update `CFBundleShortVersionString` and `CFBundleVersion`
- [ ] Update `bundleIdentifier` from `com.anonymous.voisss-mobile`
- [ ] Generate App Icon and Launch Screen assets
- [ ] Set up Apple Developer Program membership

### Play Store (Android)
- [ ] Remove or implement Google sign-in properly
- [ ] Update package name and keystore
- [ ] Generate signed APK/AAB
- [ ] Set up Play Console listing

### Web (Netlify)
- [ ] Verify `NEXT_PUBLIC_BASE_URL` is set to production URL
- [ ] Verify `STRIPE_SECRET_KEY` is configured
- [ ] Verify `STRIPE_WEBHOOK_SECRET` endpoint is registered in Stripe dashboard
- [ ] Verify `DATABASE_URL` is configured for entitlement storage
- [ ] Verify GA tracking works on production
