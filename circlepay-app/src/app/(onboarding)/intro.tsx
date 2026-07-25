import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IMAGERY, type RemoteImageSource } from '@/lib/imagery';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Button, RemoteImage } from '@/ui';
import { FadeSlideIn } from '@/ui/motion';

interface Slide {
  key: string;
  image: RemoteImageSource;
  headline: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    key: 'circles',
    image: IMAGERY.introCircles,
    headline: 'Save together, the way you always have',
    body: 'Ajo, Esusu, Adashi — now automated, transparent, and protected by escrow.',
  },
  {
    key: 'partpay',
    image: IMAGERY.introPartPay,
    headline: 'Split what matters into pieces you can manage',
    body: 'Rent, school fees, medical bills — pay gradually, no stress.',
  },
  {
    key: 'support',
    image: IMAGERY.introSupport,
    headline: 'When life happens, your community shows up',
    body: 'Raise funds for burials, weddings and emergencies — every naira tracked.',
  },
  {
    key: 'agent',
    image: IMAGERY.introAgent,
    headline: 'No smartphone? No bank? Still covered.',
    body: 'Save and cash out at any CirclePay agent or kiosk, with scratch cards.',
  },
];

export default function Intro() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const setSeenOnboarding = useStore((s) => s.setSeenOnboarding);

  const scrollRef = useRef<Animated.ScrollView>(null);
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);

  const heroHeight = Math.round(height * 0.45);
  const last = index === SLIDES.length - 1;

  // Page index is derived from scroll position rather than onMomentumScrollEnd,
  // which react-native-web does not fire reliably — and web is a deploy target.
  const page = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
      const next = Math.round(e.contentOffset.x / Math.max(width, 1));
      if (next !== page.value) {
        page.value = next;
        runOnJS(setIndex)(next);
      }
    },
  });

  const finish = () => {
    setSeenOnboarding(true);
    router.replace('/(auth)/phone');
  };

  const next = () => {
    if (last) {
      finish();
      return;
    }
    scrollRef.current?.scrollTo({ x: (index + 1) * width, animated: true });
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Skip stays reachable on every slide */}
      <View style={styles.skipRow}>
        <Pressable
          onPress={finish}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Skip introduction">
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        style={styles.flex}>
        {SLIDES.map((slide, i) => (
          <SlideView
            key={slide.key}
            slide={slide}
            index={i}
            width={width}
            heroHeight={heroHeight}
            scrollX={scrollX}
          />
        ))}
      </Animated.ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
        <View style={styles.dots} accessibilityRole="tablist">
          {SLIDES.map((s, i) => (
            <Dot key={s.key} index={i} width={width} scrollX={scrollX} />
          ))}
        </View>

        <Button title={last ? 'Get Started' : 'Next'} onPress={next} />
      </View>
    </View>
  );
}

/** One slide. The hero drifts at half scroll speed for depth. */
function SlideView({
  slide,
  index,
  width,
  heroHeight,
  scrollX,
}: {
  slide: Slide;
  index: number;
  width: number;
  heroHeight: number;
  scrollX: SharedValue<number>;
}) {
  const parallax = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          scrollX.value,
          [(index - 1) * width, index * width, (index + 1) * width],
          [width * 0.22, 0, -width * 0.22],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  return (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.heroClip, { height: heroHeight }]}>
        <Animated.View style={[styles.heroInner, parallax]}>
          <RemoteImage source={slide.image} style={styles.heroImage} fallbackMark={72} />
        </Animated.View>
      </View>

      <View style={styles.copy}>
        <FadeSlideIn delay={80}>
          <Text style={styles.headline}>{slide.headline}</Text>
        </FadeSlideIn>
        <FadeSlideIn delay={160}>
          <Text style={styles.body}>{slide.body}</Text>
        </FadeSlideIn>
      </View>
    </View>
  );
}

/** Progress dot — the active one stretches into a pill. */
function Dot({
  index,
  width,
  scrollX,
}: {
  index: number;
  width: number;
  scrollX: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const range = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      width: interpolate(scrollX.value, range, [8, 26, 8], Extrapolation.CLAMP),
      opacity: interpolate(scrollX.value, range, [0.3, 1, 0.3], Extrapolation.CLAMP),
    };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  skip: { fontFamily: fonts.bold, fontSize: 14, color: colors.sub, padding: spacing.xs },
  slide: { flex: 1 },
  // Clip the parallax overshoot so neighbouring slides never bleed through.
  heroClip: { overflow: 'hidden', marginHorizontal: spacing.xl, borderRadius: radius.xl },
  // Wider than the slide so there is image to travel into.
  heroInner: { width: '144%', height: '100%', marginLeft: '-22%' },
  heroImage: { flex: 1 },
  copy: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  headline: {
    fontFamily: fonts.extrabold,
    fontSize: 29,
    lineHeight: 36,
    letterSpacing: -0.7,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 23,
    color: colors.sub,
    marginTop: spacing.md,
  },
  footer: { paddingHorizontal: spacing.xl, gap: spacing.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
