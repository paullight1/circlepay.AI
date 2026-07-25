/**
 * Curated remote imagery.
 *
 * Fixed URLs rather than a random-image API: the brand looks the same every
 * launch, each image caches deterministically on disk, and the subjects are
 * hand-picked for West African context rather than whatever a random endpoint
 * returns.
 *
 * Source is Unsplash. The Unsplash License permits free commercial use without
 * attribution and explicitly allows hotlinking.
 *
 * Every URL here was verified to return HTTP 200 and was visually inspected —
 * do not add an entry you have not opened. `tint` is the backdrop shown while
 * the image loads, so it should roughly match the photo's dominant tone.
 */

const UNSPLASH = 'https://images.unsplash.com/photo-';

/** Build a sized Unsplash URL. Width is capped for mobile bandwidth. */
function photo(id: string, w = 900): string {
  return `${UNSPLASH}${id}?w=${w}&q=75&auto=format&fit=crop`;
}

export interface RemoteImageSource {
  uri: string;
  /** Backdrop colour while loading — avoids a white flash and layout shift. */
  tint: string;
  /** Describes the image for screen readers. */
  alt: string;
}

export const IMAGERY = {
  /** Slide 1 — women in wax print at a community gathering. */
  introCircles: {
    uri: photo('1509099955921-f0b4ed0c175c'),
    tint: '#5A4632',
    alt: 'Women in wax-print dress gathered at a community meeting',
  },
  /** Slide 2 — young man smiling at his phone. */
  introPartPay: {
    uri: photo('1622556498246-755f44ca76f3'),
    tint: '#6B7A78',
    alt: 'Young man smiling while using his phone',
  },
  /** Slide 3 — group of women in matching attire, celebrating together. */
  introSupport: {
    uri: photo('1593114638431-5805138c696e'),
    tint: '#7A5560',
    alt: 'Group of women in matching attire supporting one another',
  },
  /** Slide 4 — West African market traders. */
  introAgent: {
    uri: photo('1625989744655-9bff7a23dac4'),
    tint: '#4E5B6B',
    alt: 'Traders at a busy West African open-air market',
  },
  /** KYC hero — warm, trustworthy portrait. */
  kycHero: {
    uri: photo('1530785602389-07594beb8b73', 600),
    tint: '#5C4038',
    alt: 'Smiling woman wearing an Ankara headwrap',
  },
} as const satisfies Record<string, RemoteImageSource>;

export type ImageryKey = keyof typeof IMAGERY;

/**
 * Portrait photos for member avatars, keyed by seed member name.
 *
 * Deliberately partial: only names with a visually-verified portrait appear
 * here. Everyone else falls back to the initials avatar, which is why
 * `Avatar` treats `photoUri` as optional rather than required.
 */
export const MEMBER_PHOTOS: Record<string, string> = {
  'Godfrey Okoro': photo('1622556498246-755f44ca76f3', 240),
  'Blessing A.': photo('1530785602389-07594beb8b73', 240),
};

/** Portrait URL for a member, or undefined to fall back to initials. */
export function memberPhoto(name: string): string | undefined {
  return MEMBER_PHOTOS[name];
}
