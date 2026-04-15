/**
 * High-Risk Keyword Detection Utility
 * Identifies concerning language in mood entries and other user content
 */

const HIGH_RISK_KEYWORDS = {
  critical: [
    'want to die',
    'want to kill myself',
    'want to commit suicide',
    'kill myself',
    'end my life',
    'end it all',
    'take my life',
    'end my suffering',
    'no point living',
    'better off dead',
    'should kill myself',
    'should die',
    'suicide',
    'suicidal',
    'self harm',
    'self-harm',
    'hurt myself',
    'cut myself',
    'bleed',
    "don't want to live",
    'dont want to live',
    'please help me die',
    'i give up',
    'i quit',
    'final goodbye',
    'last goodbye',
    'never coming back',
    'goodbye forever',
  ],
  high: [
    'feel like dying',
    'feel hopeless',
    'feeling empty',
    'so depressed',
    'severe depression',
    'can\'t take it anymore',
    'cant take it anymore',
    'overwhelming pain',
    'unbearable pain',
    'constant suffering',
    'no reason to go on',
    'no reason to live',
    'pointless existence',
    'life is meaningless',
    'hate myself',
    'worthless',
    'embarrassed to exist',
    'burden to everyone',
    'everyone hates me',
    'all alone',
    'severely anxious',
    'panic attacks',
    'severe panic',
    'heart attack',
    'dying',
    'dead inside',
    'numb',
    'disconnected from reality',
  ],
  medium: [
    'very sad',
    'extremely sad',
    'devastated',
    'broken',
    'shattered',
    'lost',
    'confused',
    'stressed out',
    'high stress',
    'exhausted',
    'tired of everything',
    'frustrated',
    'angry',
    'furious',
    'feels like failing',
    'feeling like a failure',
    'not good enough',
    'insecure',
    'anxious',
    'worried',
    'nervous',
  ],
};

/**
 * Detect high-risk keywords in text
 * @param {string} text - Text to check (description, keyword, etc.)
 * @returns {Object} - { hasRiskKeywords: boolean, riskLevel: string, keywords: string[] }
 */
export const detectRiskKeywords = (text) => {
  if (!text) {
    return {
      hasRiskKeywords: false,
      riskLevel: 'none',
      keywords: [],
      foundKeywords: [],
    };
  }

  const lowerText = text.toLowerCase();
  const foundKeywords = [];
  let riskLevel = 'none';

  // Check critical keywords first
  for (const keyword of HIGH_RISK_KEYWORDS.critical) {
    if (lowerText.includes(keyword)) {
      foundKeywords.push(keyword);
      riskLevel = 'critical';
      break; // Stop on first critical keyword
    }
  }

  // If no critical found, check high
  if (riskLevel === 'none') {
    for (const keyword of HIGH_RISK_KEYWORDS.high) {
      if (lowerText.includes(keyword)) {
        foundKeywords.push(keyword);
        riskLevel = 'high';
        break;
      }
    }
  }

  // If no high found, check medium
  if (riskLevel === 'none') {
    for (const keyword of HIGH_RISK_KEYWORDS.medium) {
      if (lowerText.includes(keyword)) {
        foundKeywords.push(keyword);
        riskLevel = 'medium';
        // Continue checking for more medium keywords
      }
    }
  }

  return {
    hasRiskKeywords: riskLevel !== 'none',
    riskLevel, // 'none' | 'medium' | 'high' | 'critical'
    keywords: foundKeywords,
    foundKeywords, // alias
  };
};

/**
 * Calculate overall risk score for a user based on mood patterns
 * @param {Array} moods - Array of mood entries
 * @returns {Object} - Risk assessment object
 */
export const calculateUserRiskScore = (moods) => {
  if (!moods || moods.length === 0) {
    return {
      overallRisk: 'low',
      riskScore: 0,
      factors: [],
      recommendations: [],
    };
  }

  let riskScore = 0;
  const factors = [];
  const recommendations = [];

  // Factor 1: Mood distribution
  const lowMoodCount = moods.filter(m => m.mood === 'Low').length;
  const positiveMoodCount = moods.filter(m => m.mood === 'Positive').length;

  if (lowMoodCount >= 5) {
    riskScore += 25;
    factors.push('Multiple low mood entries');
    recommendations.push('Check in with user regularly');
  }

  if (positiveMoodCount === 0 && moods.length >= 3) {
    riskScore += 20;
    factors.push('No positive mood entries recently');
    recommendations.push('Encourage activities user enjoys');
  }

  // Factor 2: High-risk keywords
  const keywordRisks = moods
    .map(m => ({
      ...m,
      risk: detectRiskKeywords(`${m.keyword} ${m.description}`),
    }))
    .filter(m => m.risk.hasRiskKeywords);

  const criticalKeywords = keywordRisks.filter(m => m.risk.riskLevel === 'critical');
  const highKeywords = keywordRisks.filter(m => m.risk.riskLevel === 'high');

  if (criticalKeywords.length > 0) {
    riskScore += 50;
    factors.push(`${criticalKeywords.length} critical risk keyword(s) detected`);
    recommendations.push('Contact user immediately');
    recommendations.push('Alert emergency services if necessary');
  }

  if (highKeywords.length > 0) {
    riskScore += 30;
    factors.push(`${highKeywords.length} high-risk keyword(s) detected`);
    recommendations.push('Reach out to user soon');
  }

  // Factor 3: Consecutive negative moods
  let consecutiveNeg = 0;
  let maxConsecutiveNeg = 0;
  for (const mood of moods) {
    if (['Low', 'Pressure'].includes(mood.mood)) {
      consecutiveNeg++;
      maxConsecutiveNeg = Math.max(maxConsecutiveNeg, consecutiveNeg);
    } else {
      consecutiveNeg = 0;
    }
  }

  if (maxConsecutiveNeg >= 5) {
    riskScore += 20;
    factors.push(`${maxConsecutiveNeg} consecutive negative mood days`);
    recommendations.push('Suggest professional help');
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  // Determine overall risk level
  let overallRisk = 'low';
  if (riskScore >= 70) {
    overallRisk = 'critical';
  } else if (riskScore >= 50) {
    overallRisk = 'high';
  } else if (riskScore >= 30) {
    overallRisk = 'medium';
  }

  return {
    overallRisk,
    riskScore,
    factors,
    recommendations,
    criticalKeywordCount: criticalKeywords.length,
    highKeywordCount: highKeywords.length,
  };
};

/**
 * Get risk level display info (color, icon, label)
 * @param {string} riskLevel - 'none' | 'medium' | 'high' | 'critical'
 * @returns {Object} - Display information
 */
export const getRiskLevelDisplay = (riskLevel) => {
  const displayMap = {
    none: {
      label: '✅ Low Risk',
      color: 'emerald',
      bgColor: 'emerald-50',
      borderColor: 'emerald-200',
      textColor: 'emerald-900',
      badgeColor: 'emerald-100',
      badgeTextColor: 'emerald-700',
    },
    medium: {
      label: '⚠️ Medium Risk',
      color: 'yellow',
      bgColor: 'yellow-50',
      borderColor: 'yellow-200',
      textColor: 'yellow-900',
      badgeColor: 'yellow-100',
      badgeTextColor: 'yellow-700',
    },
    high: {
      label: '⚠️ High Risk',
      color: 'orange',
      bgColor: 'orange-50',
      borderColor: 'orange-200',
      textColor: 'orange-900',
      badgeColor: 'orange-100',
      badgeTextColor: 'orange-700',
    },
    critical: {
      label: '🚨 CRITICAL RISK',
      color: 'red',
      bgColor: 'red-50',
      borderColor: 'red-200',
      textColor: 'red-900',
      badgeColor: 'red-100',
      badgeTextColor: 'red-700',
    },
  };

  return displayMap[riskLevel] || displayMap.none;
};

/**
 * Check if mood entry has high-risk keywords
 * @param {Object} mood - Mood entry { keyword, description, mood }
 * @returns {Object} - Risk detection result
 */
export const checkMoodRisk = (mood) => {
  if (!mood) return { hasRisk: false, riskLevel: 'none' };

  const fullText = `${mood.keyword || ''} ${mood.description || ''}`;
  const risk = detectRiskKeywords(fullText);

  // Also consider the mood itself
  if (mood.mood === 'Low') {
    if (risk.riskLevel === 'none') {
      risk.riskLevel = 'medium';
      risk.hasRiskKeywords = true;
    }
  }

  return {
    hasRisk: risk.hasRiskKeywords || mood.mood === 'Low',
    riskLevel: risk.riskLevel || (mood.mood === 'Low' ? 'medium' : 'none'),
    foundKeywords: risk.foundKeywords || [],
  };
};

export default {
  detectRiskKeywords,
  calculateUserRiskScore,
  getRiskLevelDisplay,
  checkMoodRisk,
  HIGH_RISK_KEYWORDS,
};
