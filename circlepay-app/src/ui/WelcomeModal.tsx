import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';

import { AmountText } from './AmountText';
import { Button } from './Button';
import { Card } from './Card';
import { BrandMark, FadeSlideIn, useReducedMotion } from './motion';

interface Props {
  visible: boolean;
  /** "Explore first" and backdrop dismissal. */
  onClose: () => void;
  /** "Join your first circle". */
  onPrimary: () => void;
}

/**
 * First-run greeting: the mark, the user's name, the money already sitting in
 * their wallet, and one door into the product. Shown once after onboarding.
 *
 * Uses RN's <Modal transparent> rather than an absolutely-positioned view so it
 * escapes the screen's stacking context on native and still renders correctly
 * on react-native-web.
 */
export function WelcomeModal({ visible, onClose, onPrimary }: Props) {
  const name = useStore((s) => s.user.name);
  const available = useStore((s) => s.wallet.available);
  const reduced = useReducedMotion();

  const [head] = name.trim().split(/\s+/);
  const firstName = head && head.length > 0 ? head : name;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root} accessibilityViewIsModal>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss welcome"
          accessibilityHint="Closes this message and lets you explore on your own"
        />

        {/* Keyed on `visible` so the entrance replays every time it reopens. */}
        <FadeSlideIn
          key={visible ? 'open' : 'closed'}
          offset={reduced ? 0 : 22}
          duration={reduced ? 0 : 420}
          style={styles.cardWrap}>
          <Card style={styles.card}>
            <View style={styles.mark}>
              <BrandMark size={64} />
            </View>

            <Text style={styles.title} accessibilityRole="header">
              Welcome to CirclePay, {firstName}
            </Text>

            <View style={styles.balance}>
              <Text style={styles.balanceLabel}>Your wallet is ready</Text>
              <AmountText amount={available} size={30} />
            </View>

            <Text style={styles.copy}>
              Ajo, esusu, adashi — saving together is how it has always worked. CirclePay
              just keeps the books, holds the money safely and pays out on time.
            </Text>

            <Button title="Join your first circle" onPress={onPrimary} />
            <Button
              title="Explore first"
              variant="ghost"
              onPress={onClose}
              style={styles.secondary}
            />
          </Card>
        </FadeSlideIn>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primaryDeep,
    opacity: 0.62,
  },
  cardWrap: { width: '100%', maxWidth: 420 },
  card: { alignItems: 'stretch', gap: spacing.md, padding: spacing.xl },
  mark: { alignItems: 'center', marginBottom: spacing.xs },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    lineHeight: 29,
    color: colors.ink,
    textAlign: 'center',
  },
  balance: { alignItems: 'center', gap: spacing.xs },
  balanceLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.faint,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  copy: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.sub,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  secondary: { marginTop: -spacing.xs },
});
