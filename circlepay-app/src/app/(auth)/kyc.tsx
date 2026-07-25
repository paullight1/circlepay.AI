import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IMAGERY } from '@/lib/imagery';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import {
  AuthProgress,
  Button,
  Card,
  Chip,
  Field,
  RemoteImage,
  Screen,
  ScreenHeader,
  Stepper,
} from '@/ui';
import { FadeSlideIn, PressableScale } from '@/ui/motion';

const ID_TYPES = ['National ID', "Driver's License", "Voter's Card", 'International Passport'];

const TIERS = [
  { title: 'Tier 1 · Basic', body: 'Verify BVN/NIN and a valid ID. Save and contribute up to ₦50,000/day.' },
  { title: 'Tier 2 · Standard', body: 'Add address verification to unlock payouts and PartPay up to ₦500,000.' },
  { title: 'Tier 3 · Full', body: 'Full verification — unlimited circles, payouts and installments.' },
];

/** Entrance stagger between sections, in ms. */
const STEP = 70;

export default function VerifyIdentity() {
  const router = useRouter();
  const setKycTier = useStore((s) => s.setKycTier);

  const [bvn, setBvn] = useState('');
  const [bvnError, setBvnError] = useState<string | undefined>();
  const [idType, setIdType] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const canVerify = bvn.length === 11 && !!idType && uploaded;

  const onVerify = () => {
    if (bvn.length !== 11) {
      setBvnError('Enter the 11-digit number on your BVN/NIN.');
      return;
    }
    setKycTier(1);
    router.push('/(auth)/secure');
  };

  return (
    <Screen>
      <ScreenHeader title="Verify Identity (KYC)" />

      <AuthProgress current="Identity" />

      {/* Hero band — a face here steadies nerves on the screen people abandon most.
          The heading rides on the scrim so the photo costs almost no vertical space. */}
      <FadeSlideIn delay={0}>
        <View style={styles.hero}>
          <RemoteImage source={IMAGERY.kycHero} style={styles.heroImage} fallbackMark={48} />
          <LinearGradient
            colors={['transparent', colors.primaryDeep] as const}
            style={styles.heroScrim}
            pointerEvents="none"
          />
          <View style={styles.heroTexts}>
            <Text style={styles.heading}>Verify your identity</Text>
            <Text style={styles.sub}>
              Complete KYC to unlock higher limits, payouts and installments.
            </Text>
          </View>
        </View>
      </FadeSlideIn>

      {/* Tier explainer */}
      <FadeSlideIn delay={STEP}>
        <Card style={styles.tierCard}>
          <View style={styles.cardHead}>
            <View style={styles.cardIcon}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            </View>
            <Text style={styles.cardTitle}>KYC tiers</Text>
          </View>
          <Stepper steps={TIERS} current={0} />
        </Card>
      </FadeSlideIn>

      {/* BVN / NIN */}
      <FadeSlideIn delay={STEP * 2}>
        <Field
          label="BVN or NIN number"
          placeholder="22345678891"
          keyboardType="number-pad"
          maxLength={11}
          value={bvn}
          onChangeText={(t) => {
            setBvn(t.replace(/\D/g, ''));
            setBvnError(undefined);
          }}
          error={bvnError}
          hint={bvnError ? undefined : `${bvn.length}/11 digits`}
        />
      </FadeSlideIn>

      {/* ID type */}
      <FadeSlideIn delay={STEP * 3}>
        <Text style={styles.label}>ID type</Text>
        <View style={styles.chips}>
          {ID_TYPES.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={idType === t}
              onPress={() => setIdType(t)}
              // A tick, not just a tint — selection must not rest on colour alone.
              icon={
                idType === t ? (
                  <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
                ) : undefined
              }
            />
          ))}
        </View>
      </FadeSlideIn>

      {/* Upload tile (simulated) */}
      <FadeSlideIn delay={STEP * 4}>
        <Text style={styles.label}>ID photo</Text>
        <PressableScale
          onPress={() => setUploaded((u) => !u)}
          haptic
          style={[styles.upload, uploaded && styles.uploadDone]}
          accessibilityLabel={uploaded ? 'ID photo uploaded' : 'Upload a photo of your ID'}
          accessibilityHint={uploaded ? 'Tap to retake the photo' : 'Tap to capture the front of your ID'}>
          <View style={[styles.uploadIcon, uploaded && styles.uploadIconDone]}>
            <Ionicons
              name={uploaded ? 'checkmark-circle' : 'camera'}
              size={22}
              color={uploaded ? colors.success : colors.primary}
            />
          </View>
          <View style={styles.uploadTexts}>
            <Text style={[styles.uploadTitle, uploaded && { color: colors.success }]}>
              {uploaded ? 'ID photo uploaded' : 'Upload a photo of your ID'}
            </Text>
            <Text style={styles.uploadBody}>
              {uploaded
                ? 'Looks good — ready for review. Tap to retake.'
                : 'Front of the ID you selected above. Tap to capture.'}
            </Text>
          </View>
          <Ionicons
            name={uploaded ? 'refresh' : 'chevron-forward'}
            size={18}
            color={uploaded ? colors.success : colors.primary}
          />
        </PressableScale>
      </FadeSlideIn>

      <FadeSlideIn delay={STEP * 5} style={styles.bottom}>
        <Button title="Verify Identity" onPress={onVerify} disabled={!canVerify} />
        {/* Escape hatch — nobody gets trapped behind KYC. */}
        <PressableScale
          onPress={() => router.push('/(auth)/secure')}
          to={0.94}
          style={styles.skipHit}
          accessibilityLabel="Skip verification for now"
          accessibilityHint="You can verify later from Settings">
          <Text style={styles.skip}>Skip for now</Text>
        </PressableScale>
      </FadeSlideIn>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 150,
    borderRadius: radius.xl,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginBottom: spacing.xl,
  },
  heroImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: radius.xl },
  heroScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '82%' },
  heroTexts: { padding: spacing.lg },
  heading: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.onPrimary,
  },
  sub: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.onPrimaryDim,
    marginTop: 4,
  },
  tierCard: { marginBottom: spacing.xl },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 14.5,
    color: colors.ink,
  },
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, marginBottom: 7 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.lavender,
    backgroundColor: colors.card,
  },
  uploadDone: {
    borderStyle: 'solid',
    borderColor: colors.success,
    backgroundColor: colors.successBg,
  },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconDone: { backgroundColor: colors.card },
  uploadTexts: { flex: 1 },
  uploadTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  uploadBody: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  bottom: { marginTop: spacing.xxl, gap: spacing.sm },
  skipHit: { paddingVertical: spacing.md },
  skip: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.primary,
    textAlign: 'center',
  },
});
