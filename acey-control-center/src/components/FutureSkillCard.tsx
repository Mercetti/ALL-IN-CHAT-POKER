/**
 * Future Skill Card Component
 * Displays upcoming skills with pre-purchase and wishlist functionality
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FutureSkill, LLMPreparationStatus } from '../types/futureSkill';

interface Props {
  skill: FutureSkill;
  onPrePurchase: () => void;
  onWishlist: () => void;
  prePurchasing?: boolean;
  llmPreparationStatus?: LLMPreparationStatus;
}

export const FutureSkillCard: React.FC<Props> = ({ 
  skill, 
  onPrePurchase, 
  onWishlist, 
  prePurchasing = false,
  llmPreparationStatus 
}) => {
  const releaseDate = new Date(skill.releaseDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const daysUntilRelease = Math.ceil((new Date(skill.releaseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isComingSoon = daysUntilRelease <= 30;
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'creative': return 'palette';
      case 'analytics': return 'analytics';
      case 'social': return 'people';
      case 'ops_automation': return 'auto-fix-high';
      case 'monitoring': return 'visibility';
      default: return 'extension';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'creative': return '#9C27B0';
      case 'analytics': return '#2196F3';
      case 'social': return '#FF9800';
      case 'ops_automation': return '#F44336';
      case 'monitoring': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getPreparationStatusIcon = (status: string) => {
    switch (status) {
      case 'not_started': return 'hourglass-empty';
      case 'data_collection': return 'cloud-download';
      case 'model_training': return 'psychology';
      case 'testing': return 'bug-report';
      case 'ready': return 'check-circle';
      default: return 'help';
    }
  };

  const getPreparationStatusColor = (status: string) => {
    switch (status) {
      case 'not_started': return '#9E9E9E';
      case 'data_collection': return '#FF9800';
      case 'model_training': return '#2196F3';
      case 'testing': return '#9C27B0';
      case 'ready': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const discountedPrice = skill.earlyAccessDiscount 
    ? skill.price * (1 - skill.earlyAccessDiscount / 100)
    : skill.price;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(skill.category) }]}>
            <Icon name={getCategoryIcon(skill.category)} size={20} color="#FFFFFF" />
          </View>
          <View style={styles.titleText}>
            <Text style={styles.name}>{skill.name}</Text>
            <Text style={styles.category}>{skill.category.replace('_', ' ')}</Text>
          </View>
        </View>
        
        <View style={styles.pricingSection}>
          {skill.earlyAccessDiscount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{skill.earlyAccessDiscount}%</Text>
            </View>
          )}
          <Text style={styles.price}>
            ${skill.earlyAccessDiscount ? discountedPrice.toFixed(2) : skill.price}/mo
          </Text>
          {skill.earlyAccessDiscount && (
            <Text style={styles.originalPrice}>${skill.price}/mo</Text>
          )}
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{skill.description}</Text>

      {/* Features */}
      {skill.features && skill.features.length > 0 && (
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Key Features:</Text>
          <View style={styles.featuresList}>
            {skill.features.slice(0, 3).map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Icon name="check-circle" size={14} color="#4CAF50" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            {skill.features.length > 3 && (
              <Text style={styles.moreFeatures}>+{skill.features.length - 3} more</Text>
            )}
          </View>
        </View>
      )}

      {/* Progress */}
      {skill.progressPercentage !== undefined && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Development Progress</Text>
            <Text style={styles.progressPercentage}>{skill.progressPercentage}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${skill.progressPercentage}%` }]} />
          </View>
          {skill.estimatedDevelopmentDays && (
            <Text style={styles.estimatedDays}>~{skill.estimatedDevelopmentDays} days estimated</Text>
          )}
        </View>
      )}

      {/* LLM Preparation Status */}
      {llmPreparationStatus && (
        <View style={styles.llmSection}>
          <View style={styles.llmHeader}>
            <Icon 
              name={getPreparationStatusIcon(llmPreparationStatus.status)} 
              size={16} 
              color={getPreparationStatusColor(llmPreparationStatus.status)} 
            />
            <Text style={styles.llmTitle}>LLM Preparation</Text>
            <Text style={[styles.llmStatus, { color: getPreparationStatusColor(llmPreparationStatus.status) }]}>
              {llmPreparationStatus.status.replace('_', ' ')}
            </Text>
          </View>
          
          <View style={styles.llmProgress}>
            <Text style={styles.llmProgressText}>
              Dataset: {llmPreparationStatus.datasetEntries}/{llmPreparationStatus.targetDatasetEntries}
            </Text>
            <View style={styles.llmProgressBar}>
              <View 
                style={[
                  styles.llmProgressFill, 
                  { 
                    width: `${(llmPreparationStatus.datasetEntries / llmPreparationStatus.targetDatasetEntries) * 100}%` 
                  }
                ]} 
              />
            </View>
          </View>
          
          {llmPreparationStatus.modelAccuracy && (
            <Text style={styles.llmAccuracy}>
              Model Accuracy: {llmPreparationStatus.modelAccuracy}%
            </Text>
          )}
        </View>
      )}

      {/* Release Info */}
      <View style={styles.releaseSection}>
        <View style={styles.releaseInfo}>
          <Icon name="event" size={16} color="#9E9E9E" />
          <Text style={styles.releaseDate}>Releases {releaseDate}</Text>
          <Text style={styles.daysUntil}>
            {isComingSoon ? 'Coming Soon!' : `${daysUntilRelease} days`}
          </Text>
        </View>
        
        <View style={styles.tierBadge}>
          <Text style={styles.tierText}>{skill.requiredTierId}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[
            styles.prePurchaseButton,
            skill.prePurchased && styles.prePurchasedButton,
            prePurchasing && styles.disabledButton
          ]}
          onPress={onPrePurchase}
          disabled={skill.prePurchased || prePurchasing}
        >
          {prePurchasing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Icon name="shopping-cart" size={16} color="#FFFFFF" />
              <Text style={styles.prePurchaseButtonText}>
                {skill.prePurchased ? 'Pre-Purchased' : 'Pre-Purchase'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.wishlistButton,
            skill.wishlisted && styles.wishlistedButton
          ]}
          onPress={onWishlist}
        >
          <Icon 
            name={skill.wishlisted ? "favorite" : "favorite-border"} 
            size={16} 
            color={skill.wishlisted ? "#F44336" : "#FFFFFF"} 
          />
          <Text style={[
            styles.wishlistButtonText,
            skill.wishlisted && styles.wishlistedButtonText
          ]}>
            {skill.wishlisted ? 'Wishlisted' : 'Wishlist'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleText: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: '#9E9E9E',
    textTransform: 'capitalize',
  },
  pricingSection: {
    alignItems: 'flex-end',
  },
  discountBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9E9E9E',
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: 14,
    color: '#E0E0E0',
    marginBottom: 12,
    lineHeight: 20,
  },
  featuresSection: {
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 6,
  },
  featuresList: {
    gap: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#E0E0E0',
    marginLeft: 6,
  },
  moreFeatures: {
    fontSize: 11,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  progressSection: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E0E0E0',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  estimatedDays: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
  },
  llmSection: {
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  llmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  llmTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E0E0E0',
    marginLeft: 6,
    flex: 1,
  },
  llmStatus: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  llmProgress: {
    marginBottom: 6,
  },
  llmProgressText: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 4,
  },
  llmProgressBar: {
    height: 3,
    backgroundColor: '#333333',
    borderRadius: 1.5,
  },
  llmProgressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 1.5,
  },
  llmAccuracy: {
    fontSize: 11,
    color: '#4CAF50',
  },
  releaseSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  releaseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  releaseDate: {
    fontSize: 14,
    color: '#E0E0E0',
    marginLeft: 6,
  },
  daysUntil: {
    fontSize: 12,
    color: '#FF9800',
    marginLeft: 8,
    fontWeight: '600',
  },
  tierBadge: {
    backgroundColor: '#333333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 11,
    color: '#E0E0E0',
    fontWeight: '600',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  prePurchaseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  prePurchasedButton: {
    backgroundColor: '#4CAF50',
  },
  disabledButton: {
    backgroundColor: '#666666',
    opacity: 0.6,
  },
  prePurchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  wishlistButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  wishlistedButton: {
    backgroundColor: '#F44336',
  },
  wishlistButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  wishlistedButtonText: {
    color: '#FFFFFF',
  },
});
