import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/theme/tokens';

import { Button } from './Button';
import { Card } from './Card';
import { Pulse } from './motion';

interface Props {
  visible: boolean;
  /** The element to spotlight. Must already be laid out when `visible` flips true. */
  targetRef: RefObject<View | null>;
  title: string;
  body: string;
  /** "Got it" — advances to the next mark. Also fired when the target cannot be measured. */
  onDismiss: () => void;
  /** "Skip tour" — ends the whole tour. */
  onSkipAll: () => void;
}

interface Spot {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A spot plus the mark it was measured for. */
interface Measurement {
  target: RefObject<View | null>;
  title: string;
  spot: Spot;
}

/** Breathing room between the target's box and the spotlight ring. */
const PAD = spacing.sm;
/** Distance between the spotlight and the tooltip bubble. */
const GAP = spacing.md;
/** Height budget used to pick a side before the bubble has been laid out. */
const BUBBLE_ESTIMATE = 196;
const MEASURE_ATTEMPTS = 4;
const MEASURE_DELAY = 60;

/**
 * One step of the product tour: dims the screen, cuts a lit rectangle around a
 * target element and floats an explanatory bubble beside it.
 *
 * The target is measured lazily — when `visible` flips true, never on mount —
 * because the element it points at is frequently still mid-layout. If it still
 * measures zero after a few retries the mark quietly skips itself via
 * `onDismiss` rather than painting a spotlight in the corner of the screen.
 */
export function CoachMark({ visible, targetRef, title, body, onDismiss, onSkipAll }: Props) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();
  const [measured, setMeasured] = useState<Measurement | null>(null);

  // A measurement only counts for the mark it was taken for, so a stale spot can
  // never paint the previous step's rectangle for a frame.
  const spot =
    visible && measured !== null && measured.target === targetRef && measured.title === title
      ? measured.spot
      : null;

  // Kept in a ref so re-measurement is driven purely by `visible`/the target,
  // never by the parent re-creating its callbacks.
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!visible) return;

    let alive = true;
    let attempt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const retryOrSkip = () => {
      if (!alive) return;
      attempt += 1;
      if (attempt >= MEASURE_ATTEMPTS) {
        // Never laid out — skip this mark instead of rendering a broken overlay.
        dismissRef.current();
        return;
      }
      timer = setTimeout(measure, MEASURE_DELAY);
    };

    const measure = () => {
      if (!alive) return;
      const node = targetRef.current;
      if (!node) {
        retryOrSkip();
        return;
      }
      node.measureInWindow((x, y, width, height) => {
        if (!alive) return;
        const usable =
          width > 0 && height > 0 && Number.isFinite(x) && Number.isFinite(y);
        if (usable) setMeasured({ target: targetRef, title, spot: { x, y, width, height } });
        else retryOrSkip();
      });
    };

    // Defer one tick so a target mounted in the same commit has been laid out.
    timer = setTimeout(measure, 0);

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [visible, targetRef, title]);

  let overlay: ReactNode = null;

  if (spot) {
    const left = Math.max(0, spot.x - PAD);
    const top = Math.max(0, spot.y - PAD);
    const width = spot.width + PAD * 2;
    const height = spot.height + PAD * 2;
    const bottomEdge = top + height;

    const roomBelow = winH - insets.bottom - bottomEdge - GAP;
    const roomAbove = top - insets.top - GAP;
    const below = roomBelow >= BUBBLE_ESTIMATE || roomBelow >= roomAbove;

    // Clamped so the bubble never rides off-screen or under the notch/home indicator.
    const placement: ViewStyle = below
      ? {
          top: Math.max(
            insets.top + spacing.md,
            Math.min(bottomEdge + GAP, winH - insets.bottom - BUBBLE_ESTIMATE)
          ),
        }
      : {
          bottom: Math.max(
            insets.bottom + spacing.md,
            Math.min(winH - top + GAP, winH - insets.top - BUBBLE_ESTIMATE)
          ),
        };

    overlay = (
      <View style={styles.root} accessibilityViewIsModal>
        {/* Four dim panels leave the target itself unclouded — a cutout without a mask. */}
        <View style={[styles.dim, { left: 0, right: 0, top: 0, height: top }]} />
        <View style={[styles.dim, { left: 0, right: 0, top: bottomEdge, bottom: 0 }]} />
        <View style={[styles.dim, { left: 0, top, width: left, height }]} />
        <View style={[styles.dim, { left: left + width, right: 0, top, height }]} />

        <Pulse to={1.04} duration={1500} style={[styles.spot, { left, top, width, height }]}>
          <View style={styles.ring} />
        </Pulse>

        <View style={[styles.bubble, placement]}>
          <Card style={styles.card}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            <Text style={styles.body}>{body}</Text>
            <View style={styles.actions}>
              <Pressable
                onPress={onSkipAll}
                hitSlop={spacing.md}
                accessibilityRole="button"
                accessibilityLabel="Skip tour"
                accessibilityHint="Ends the walkthrough and closes these tips"
                style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
                <Text style={styles.skipLabel}>Skip tour</Text>
              </Pressable>
              <Button title="Got it" small onPress={onDismiss} />
            </View>
          </Card>
        </View>
      </View>
    );
  }

  return (
    <Modal
      visible={visible && spot !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onSkipAll}>
      {overlay}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  dim: { position: 'absolute', backgroundColor: colors.primaryDeep, opacity: 0.62 },
  spot: { position: 'absolute' },
  ring: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.lavender,
  },
  bubble: { position: 'absolute', left: spacing.lg, right: spacing.lg },
  card: { gap: spacing.sm, padding: spacing.lg },
  title: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.sub },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  skip: { paddingVertical: spacing.sm, paddingRight: spacing.md },
  skipLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.faint },
  pressed: { opacity: 0.6 },
});
