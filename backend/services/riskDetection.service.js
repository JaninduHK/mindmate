/**
 * Risk Detection Service
 * Analyzes mood entries for high-risk indicators and triggers alerts
 */

export const analyzeRiskLevel = (moodDescription = '', moodType = '') => {
  const highRiskKeywords = [
    'die',
    'suicide',
    'kill myself',
    'end it',
    'hopeless',
    'worthless',
    'cant go on',
    'cannot go on',
    'no point',
    'harm myself',
    'hurt myself',
    'end my life',
    'suicidal',
    'want to die',
    'should be dead',
  ];

  const mediumRiskKeywords = [
    'depression',
    'panic',
    'anxiety',
    'stressed',
    'overwhelmed',
    'anxious',
    'scared',
    'afraid',
    'lonely',
    'isolated',
    'desperate',
  ];

  const text = `${moodDescription || ''} ${moodType || ''}`.toLowerCase();

  // Check for high-risk keywords
  const highRiskKeyword = highRiskKeywords.find((kw) => text.includes(kw));
  if (highRiskKeyword) {
    return {
      level: 'HIGH_RISK',
      severity: 'critical',
      triggerKeyword: highRiskKeyword,
      riskLevel: 'HIGH',
    };
  }

  // Check for medium-risk keywords
  const mediumRiskKeyword = mediumRiskKeywords.find((kw) => text.includes(kw));
  if (mediumRiskKeyword) {
    return {
      level: 'MEDIUM_RISK',
      severity: 'warning',
      triggerKeyword: mediumRiskKeyword,
      riskLevel: 'MEDIUM',
    };
  }

  return {
    level: 'LOW_RISK',
    severity: 'normal',
    triggerKeyword: null,
    riskLevel: 'LOW',
  };
};

/**
 * Check if mood type indicates risk
 */
export const getMoodTypeRiskLevel = (moodType) => {
  const riskMoodTypes = {
    depressed: 'MEDIUM',
    anxious: 'MEDIUM',
    stressed: 'MEDIUM',
    overwhelmed: 'HIGH',
    suicidal: 'HIGH',
  };

  return riskMoodTypes[moodType] || 'LOW';
};

/**
 * Determine content recommendations based on risk level and mood
 */
export const getRecommendedContentTypes = (riskLevel, moodType) => {
  const contentMap = {
    HIGH: ['coping-strategies', 'crisis-support', 'professional-help', 'emergency-resources'],
    MEDIUM: ['self-help-articles', 'meditation-videos', 'mindfulness-exercises', 'support-communities'],
    LOW: ['wellness-tips', 'motivational-content', 'lifestyle-articles'],
  };

  return contentMap[riskLevel] || [];
};
