import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mobileAIService, type AIVoiceStyle } from '../services/ai-service';
import { colors } from '@voisss/ui';
import { Button } from './ui/Button';
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
        <ActivityIndicator size="large" color={colors.dark.primary} />
        <Text style={styles.loadingText}>Loading AI Voice Styles...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={24} color={colors.dark.error} />
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
                color={activeCategory === category.id ? colors.dark.primary : colors.dark.textSecondary}
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
                  color={colors.dark.primary}
                />
                {selectedVoiceId === voiceStyle.id && (
                  <Ionicons 
                    name="checkmark-circle"
                    size={20}
                    color={colors.dark.success}
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
                  <Ionicons name="play" size={16} color={colors.dark.primary} />
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
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: colors.dark.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    color: colors.dark.error,
    fontSize: 16,
    marginVertical: 16,
    textAlign: 'center',
  },
  categoriesContainer: {
    paddingVertical: 12,
    gap: 12,
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: colors.dark.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  activeCategoryButton: {
    backgroundColor: colors.dark.primary,
    borderColor: colors.dark.primary,
  },
  categoryText: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  activeCategoryText: {
    color: colors.dark.text,
  },
  sectionTitle: {
    color: colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  voiceStylesContainer: {
    gap: 16,
    paddingBottom: 32,
  },
  voiceStyleCardContainer: {
    width: '100%',
  },
  voiceStyleCard: {
    padding: 16,
  },
  voiceStyleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedIcon: {
    marginLeft: 'auto',
  },
  voiceStyleName: {
    color: colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  voiceStyleDescription: {
    color: colors.dark.textSecondary,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 24,
  },
  voiceStyleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voiceStyleCategory: {
    color: colors.dark.primary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.dark.surfaceLight,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  previewButtonText: {
    color: colors.dark.primary,
    fontSize: 12,
    marginLeft: 2,
    fontWeight: '500',
  },
});