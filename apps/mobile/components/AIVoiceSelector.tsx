import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileAIService, type AIVoiceStyle } from '../services/ai-service';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/design-system';
import { Card } from './ui/Card';

interface AIVoiceSelectorProps {
  onVoiceSelected: (voiceStyle: AIVoiceStyle) => void;
  selectedVoiceId?: string;
  showCategories?: boolean;
}

export const AIVoiceSelector: React.FC<AIVoiceSelectorProps> = ({
  onVoiceSelected,
  selectedVoiceId,
  showCategories = true,
}) => {
  const [voiceStyles, setVoiceStyles] = useState<AIVoiceStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | AIVoiceStyle['category']>('all');

  useEffect(() => {
    const loadVoiceStyles = async () => {
      try {
        setLoading(true);
        setError(null);
        const styles = await mobileAIService.getVoiceStyles();
        setVoiceStyles(styles);
      } catch (err) {
        console.error('Failed to load voice styles:', err);
        setError('Failed to load voice styles. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadVoiceStyles();
  }, []);

  const filteredVoiceStyles = showCategories && activeCategory !== 'all'
    ? voiceStyles.filter(style => style.category === activeCategory)
    : voiceStyles;

  const categories: { id: string; name: string; icon: string }[] = [
    { id: 'all', name: 'All Styles', icon: 'grid' },
    { id: 'professional', name: 'Professional', icon: 'briefcase' },
    { id: 'creative', name: 'Creative', icon: 'color-palette' },
    { id: 'fun', name: 'Fun', icon: 'happy' },
    { id: 'emotional', name: 'Emotional', icon: 'heart' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading AI Voice Styles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={24} color={Colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <Button 
          title="Retry"
          onPress={() => {
            setLoading(true);
            mobileAIService.getVoiceStyles().then(setVoiceStyles).catch(console.error).finally(() => setLoading(false));
          }}
          variant="outline"
          size="sm"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showCategories && (
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                activeCategory === category.id && styles.activeCategoryButton
              ]}
              onPress={() => setActiveCategory(category.id as any)}
            >
              <Ionicons 
                name={category.icon as any}
                size={16}
                color={activeCategory === category.id ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[
                styles.categoryText,
                activeCategory === category.id && styles.activeCategoryText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      <Text style={styles.sectionTitle}>
        {filteredVoiceStyles.length} AI Voice Styles Available
      </Text>
      
      <ScrollView 
        contentContainerStyle={styles.voiceStylesContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredVoiceStyles.map(voiceStyle => (
          <TouchableOpacity
            key={voiceStyle.id}
            onPress={() => onVoiceSelected(voiceStyle)}
            style={styles.voiceStyleCardContainer}
          >
            <Card 
              variant={selectedVoiceId === voiceStyle.id ? 'highlighted' : 'elevated'}
              style={styles.voiceStyleCard}
            >
              <View style={styles.voiceStyleHeader}>
                <Ionicons 
                  name={voiceStyle.icon as any}
                  size={24}
                  color={Colors.primary}
                />
                {selectedVoiceId === voiceStyle.id && (
                  <Ionicons 
                    name="checkmark-circle"
                    size={20}
                    color={Colors.success}
                    style={styles.selectedIcon}
                  />
                )}
              </View>
              
              <Text style={styles.voiceStyleName}>{voiceStyle.name}</Text>
              <Text style={styles.voiceStyleDescription}>{voiceStyle.description}</Text>
              
              <View style={styles.voiceStyleFooter}>
                <Text style={styles.voiceStyleCategory}>{voiceStyle.category}</Text>
                <TouchableOpacity 
                  style={styles.previewButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    // Would play preview audio
                  }}
                >
                  <Ionicons name="play" size={16} color={Colors.primary} />
                  <Text style={styles.previewButtonText}>Preview</Text>
                </TouchableOpacity>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.screenPadding,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: Typography.body,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    color: Colors.error,
    fontSize: Typography.body,
    marginVertical: Spacing.md,
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeCategoryButton: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    color: Colors.textSecondary,
    fontSize: Typography.bodySmall,
    marginLeft: Spacing.xs,
    fontWeight: Typography.medium,
  },
  activeCategoryText: {
    color: Colors.textPrimary,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    marginBottom: Spacing.md,
  },
  voiceStylesContainer: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  voiceStyleCardContainer: {
    width: '100%',
  },
  voiceStyleCard: {
    padding: Spacing.md,
  },
  voiceStyleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  selectedIcon: {
    marginLeft: 'auto',
  },
  voiceStyleName: {
    color: Colors.textPrimary,
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    marginBottom: Spacing.xs,
  },
  voiceStyleDescription: {
    color: Colors.textSecondary,
    fontSize: Typography.bodySmall,
    marginBottom: Spacing.md,
    lineHeight: Typography.lineHeight.body,
  },
  voiceStyleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceStyleCategory: {
    color: Colors.primary,
    fontSize: Typography.caption,
    fontWeight: Typography.medium,
    textTransform: 'capitalize',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  previewButtonText: {
    color: Colors.primary,
    fontSize: Typography.caption,
    marginLeft: Spacing.xxs,
    fontWeight: Typography.medium,
  },
});
