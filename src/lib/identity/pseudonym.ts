export const AVATAR_OPTIONS = [
  { id: "lotus", label: "Peaceful Lotus", icon: "🌸" },
  { id: "sun", label: "Morning Sun", icon: "☀️" },
  { id: "sprout", label: "New Sprout", icon: "🌱" },
  { id: "cloud", label: "Gentle Cloud", icon: "☁️" },
  { id: "heart", label: "Kind Heart", icon: "💛" },
  { id: "star", label: "Hope Star", icon: "✨" },
  { id: "dove", label: "Graceful Dove", icon: "🕊️" },
  { id: "wave", label: "Quiet Wave", icon: "🌊" },
];

const ADJECTIVES = [
  "Gentle", "Quiet", "Hopeful", "Brave", "Kind", "Patient", "Warm", "Peaceful",
  "Resilient", "Calm", "Graceful", "Tender", "Steady", "Healing", "Bright"
];

const NOUNS = [
  "Heart", "Soul", "Spirit", "Pilgrim", "Seeker", "Walker", "Light", "Sparrow",
  "Listener", "Traveler", "Morning", "Harbor", "Breeze", "Sanctuary", "Companion"
];

export function generateAnonymousHandle(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = Math.floor(100 + Math.random() * 900); // 3 digit number
  return `${adj}${noun}${suffix}`;
}

export function getRandomAvatarId(): string {
  const avatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
  return avatar.id;
}
