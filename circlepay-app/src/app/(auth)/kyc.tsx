import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Button, Card, Chip, Field, Screen, ScreenHeader, Stepper } from '@/ui';

const ID_TYPES = ['National ID', "Driver's License", "Voter's Card", 'International Passport'];

const TIERS = [
  { title: 'Tier 1 · Basic', body: 'Verify BVN/NIN and a valid ID. Save and contribute up to ₦50,000/day.' },
  { title: 'Tier 2 · Standard', body: 'Add address verification to unlock payouts and PartPay up to ₦500,000.' },
  { title: 'Tier 3 · Full', body: 'Full verification — unlimited circles, payouts and installments.' },
];

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

      <Text style={styles.heading}>Verify your identity</Text>
      <Text style={styles.sub}>
        Complete KYC to unlock higher limits, payouts and installments.
      </Text>

      {/* Tier explainer */}
      <Card style={styles.tierCard}>
        <Text style={styles.cardTitle}>KYC tiers</Text>
        <Stepper steps={TIERS} current={0} />
      </Card>

      {/* BVN / NIN */}
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

      {/* ID type */}
      <Text style={styles.label}>ID type</Text>
      <View style={styles.chips}>
        {ID_TYPES.map((t) => (
          <Chip key={t} label={t} selected={idType === t} onPress={() => setIdType(t)} />
        ))}
      </View>

      {/* Upload tile (simulated) */}
      <Text style={styles.label}>ID photo</Text>
      <Pressable
        onPress={() => setUploaded((u) => !u)}
        style={({ pressed }) => [
          styles.upload,
          uploaded && styles.uploadDone,
          pressed && { opacity: 0.85 },
        ]}>
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
      </Pressable>

      <View style={styles.bottom}>
        <Button title="Verify Identity" onPress={onVerify} disabled={!canVerify} />
        <Pressable onPress={() => router.push('/(auth)/secure')} hitSlop={8}>
          <Text style={styles.skip}>Skip for now</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  sub: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.sub,
    marginTop: 6,
    marginBottom: spacing.xl,
  },
  tierCard: { marginBottom: spacing.xl },
  cardTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 14.5,
    color: colors.ink,
    marginBottom: spacing.md,
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
  bottom: { marginTop: spacing.xxl, gap: spacing.lg },
  skip: {
    fontFamily: fonts.bold,
    fontSize: 13.5,
    color: colors.primary,
    textAlign: 'center',
  },
});
