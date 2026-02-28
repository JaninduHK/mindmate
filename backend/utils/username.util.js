const ADJECTIVES = [
  'Calm', 'Gentle', 'Hopeful', 'Bright', 'Serene', 'Kind', 'Warm', 'Tender',
  'Peaceful', 'Brave', 'Caring', 'Joyful', 'Mindful', 'Resilient', 'Sunny',
  'Radiant', 'Graceful', 'Steady', 'Vibrant', 'Cherished', 'Blissful', 'Daring',
  'Earnest', 'Faithful', 'Golden', 'Humble', 'Inspired', 'Lively', 'Noble',
];

const NOUNS = [
  'Eagle', 'River', 'Sunrise', 'Garden', 'Ocean', 'Mountain', 'Forest', 'Meadow',
  'Star', 'Bloom', 'Journey', 'Horizon', 'Lighthouse', 'Phoenix', 'Butterfly',
  'Rainbow', 'Willow', 'Petal', 'Breeze', 'Lantern', 'Compass', 'Harbor',
  'Canopy', 'Spark', 'Anchor', 'Blossom', 'Ember', 'Tide', 'Summit',
];

/**
 * Generates a friendly, positive username like "CalmEagle4827"
 */
export const generateUsername = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${adj}${noun}${num}`;
};
