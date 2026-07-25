import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Button, Card, Screen, ScreenHeader } from '@/ui';

/** Scan & Pay — simulated QR scanner (center tab action). */
export default function ScanAndPay() {
  const router = useRouter();
  const [found, setFound] = useState(false);
  const sweep = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sweep, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    const t = setTimeout(() => setFound(true), 3800);
    return () => { loop.stop(); clearTimeout(t); };
  }, [sweep]);

  const translateY = sweep.interpolate({ inputRange: [0, 1], outputRange: [8, 212] });

  return (
    <Screen backgroundColor={colors.primaryDeep} padded={false}>
      <ScreenHeader title="Scan & Pay" light />
      <Text style={styles.hint}>Point your camera at a CirclePay QR code to pay a merchant, agent or friend.</Text>

      <View style={styles.frameWrap}>
        <View style={styles.frame}>
          {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
            <View key={c} style={[styles.corner, cornerPos[c]]} />
          ))}
          {!found && <Animated.View style={[styles.sweep, { transform: [{ translateY }] }]} />}
          {found && (
            <View style={styles.foundBubble}>
              <Ionicons name="qr-code" size={40} color={colors.onPrimary} />
            </View>
          )}
        </View>
      </View>

      {found ? (
        <Card style={styles.result}>
          <Text style={styles.resultTitle}>Mega Plaza Kiosk</Text>
          <Text style={styles.resultMeta}>Agent · AGT-24580 · Yaba, Lagos</Text>
          <Button
            title="Pay this Agent"
            style={{ marginTop: spacing.lg }}
            onPress={() => router.push({ pathname: '/wallet/transfer', params: { to: 'Mega Plaza Kiosk' } })}
          />
        </Card>
      ) : (
        <Text style={styles.scanning}>Scanning…</Text>
      )}
    </Screen>
  );
}

const cornerPos = {
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
} as const;

const styles = StyleSheet.create({
  hint: {
    fontFamily: fonts.medium, fontSize: 13, color: colors.onPrimaryDim,
    textAlign: 'center', lineHeight: 19, marginBottom: spacing.xxl,
  },
  frameWrap: { alignItems: 'center', marginVertical: spacing.xl },
  frame: {
    width: 250, height: 250, borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  corner: { position: 'absolute', width: 34, height: 34, borderColor: colors.lavender, borderRadius: 2 },
  sweep: {
    position: 'absolute', top: 0, left: 12, right: 12, height: 3,
    borderRadius: 2, backgroundColor: colors.accent, opacity: 0.9,
  },
  foundBubble: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center',
  },
  scanning: {
    fontFamily: fonts.semibold, fontSize: 13, color: colors.onPrimaryDim,
    textAlign: 'center', marginTop: spacing.xl,
  },
  result: { marginTop: spacing.xl },
  resultTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  resultMeta: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub, marginTop: 3 },
});
