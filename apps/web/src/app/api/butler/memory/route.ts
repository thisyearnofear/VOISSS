import { NextRequest, NextResponse } from 'next/server';
import {
  saveUserPreferences,
  getUserPreferences,
  getVoiceRecommendations,
  getProactiveSuggestions,
  type ButlerUserPreference,
} from '../../../../../../../packages/shared/src/services/butler-memory-service';

/**
 * Butler Memory API
 *
 * POST /api/butler/memory - Save user preferences
 * GET /api/butler/memory - Retrieve user preferences
 * POST /api/butler/recommendations - Get personalized voice recommendations
 * POST /api/butler/suggestions - Get proactive suggestions
 */

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, userId, walletAddress, preferences } = body;

    switch (action) {
      case 'save-preferences':
        if (!preferences) {
          return NextResponse.json(
            { success: false, error: 'Missing preferences data' },
            { status: 400 }
          );
        }

        const result = await saveUserPreferences(preferences);
        return NextResponse.json({
          success: result.success,
          entityId: result.entityId,
          error: result.error,
        });

      case 'get-recommendations':
        if (!userId && !walletAddress) {
          return NextResponse.json(
            { success: false, error: 'Missing userId or walletAddress' },
            { status: 400 }
          );
        }

        const userPrefs = await getUserPreferences({ userId, walletAddress });
        if (!userPrefs) {
          return NextResponse.json({
            success: true,
            recommendations: [],
            message: 'No preferences found. Start using voices to get personalized recommendations!',
          });
        }

        // Mock available voices - in production, fetch from your voice catalog
        const availableVoices = [
          { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', tags: ['female', 'professional', 'corporate'] },
          { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Domi', tags: ['female', 'energetic', 'commercial'] },
          { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', tags: ['female', 'soft', 'narration'] },
          { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli', tags: ['female', 'casual', 'podcast'] },
          { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Antoni', tags: ['male', 'professional', 'corporate'] },
        ];

        const recommendations = await getVoiceRecommendations(userPrefs, availableVoices);
        return NextResponse.json({
          success: true,
          recommendations,
          userPreferences: userPrefs,
        });

      case 'get-suggestions':
        if (!userId && !walletAddress) {
          return NextResponse.json(
            { success: false, error: 'Missing userId or walletAddress' },
            { status: 400 }
          );
        }

        const prefs = await getUserPreferences({ userId, walletAddress });
        if (!prefs) {
          return NextResponse.json({
            success: true,
            suggestions: ['Welcome! Start by generating your first voice to unlock personalized suggestions.'],
          });
        }

        const recentActivity = body.recentActivity || {};
        const suggestions = getProactiveSuggestions(prefs, recentActivity);
        return NextResponse.json({
          success: true,
          suggestions,
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: save-preferences, get-recommendations, or get-suggestions' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Butler memory error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');

    if (!userId && !walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or walletAddress query parameter' },
        { status: 400 }
      );
    }

    const preferences = await getUserPreferences({ userId, walletAddress });

    if (!preferences) {
      return NextResponse.json({
        success: true,
        preferences: null,
        message: 'No preferences found yet. Start using the Butler to build your profile!',
      });
    }

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Butler memory GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
