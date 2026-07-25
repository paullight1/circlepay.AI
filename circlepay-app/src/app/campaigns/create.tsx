import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Clipboard, Share, StyleSheet, Text, View } from 'react-native';

import { useStore } from '@/store/useStore';
import type { Campaign, CampaignCategory } from '@/store/types';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Button, Card, Chip, Field, Screen, ScreenHeader } from '@/ui';

const CATEGORIES: CampaignCategory[] = [
  'Burial', 'Birthday', 'Medical', 'Wedding', 'School Fees', 'Community',
];
const DEADLINES = [3, 7, 14, 30];

const CONFETTI: Array<{ color: string; top: number; left: number; size: number; rotate: string }> = [
  { color: colors.warning, top: 4, left: 30, size: 8, rotate: '18deg' },
  { color: colors.primary, top: 22, left: 8, size: 6, rotate: '-24deg' },
  { color: colors.danger, top: 58, left: 20, size: 7, rotate: '40deg' },
  { color: colors.success, top: 10, left: 92, size: 6, rotate: '-12deg' },
  { color: colors.accent, top: 44, left: 104, size: 8, rotate: '30deg' },
  { color: colors.warning, top: 78, left: 98, size: 5, rotate: '-36deg' },
];

/** Create a Support Campaign — form + "campaign is live" success state. */
export default function CreateCampaign() {
  const router = useRouter();
  const createCampaign = useStore((s) => s.createCampaign);

  const [category, setCategory] = useState<CampaignCategory>('Burial');
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [about, setAbout] = useState('');
  const [errors, setErrors] = useState<{ title?: string; target?: string; about?: string }>({});
  const [created, setCreated] = useState<Campaign | null>(null);
  const [copied, setCopied] = useState(false);

  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (created) {
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
    }
  }, [created, pop]);

  const launch = () => {
    const amount = Number(target.replace(/[^0-9]/g, ''));
    const next: typeof errors = {};
    if (!title.trim()) next.title = 'Give your campaign a title.';
    if (!amount || amount <= 0) next.target = 'Enter a valid target amount.';
    if (!about.trim()) next.about = 'Tell supporters what this campaign is about.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const campaign = createCampaign({
      title: title.trim(),
      category,
      target: amount,
      deadlineDays,
      about: about.trim(),
    });
    setCreated(campaign);
  };

  if (created) {
    const link = `circlepay.app/c/${created.code}`;
    const share = () =>
      Share.share({
        message: `Support "${created.title}" on CirclePay AI — donate here: https://${link}`,
      }).catch(() => undefined);
    return (
      <Screen>
        <ScreenHeader title="Campaign Live" noBack />
        <View style={styles.successWrap}>
          <Animated.View style={[styles.halo, { transform: [{ scale: pop }] }]}>
            {CONFETTI.map((cf, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  top: cf.top, left: cf.left,
                  width: cf.size, height: cf.size,
                  borderRadius: 2, backgroundColor: cf.color,
                  transform: [{ rotate: cf.rotate }],
                }}
              />
            ))}
            <View style={styles.check}>
              <Ionicons name="checkmark" size={34} color={colors.onPrimary} />
            </View>
          </Animated.View>
          <Text style={styles.successTitle}>Your campaign is live!</Text>
          <Text style={styles.successBody}>
            Share your campaign link so friends, family and community can start supporting.
          </Text>
          <Card style={styles.linkCard}>
            <Text style={styles.linkLabel}>Shareable link</Text>
            <Text style={styles.link}>{link}</Text>
            <View style={styles.linkActions}>
              <Button
                title={copied ? 'Copied!' : 'Copy Link'}
                variant="secondary"
                small
                icon={<Ionicons name="copy-outline" size={15} color={colors.primary} />}
                onPress={() => {
                  Clipboard.setString(`https://${link}`);
                  setCopied(true);
                }}
                style={styles.linkBtn}
              />
              <Button
                title="Share"
                variant="secondary"
                small
                icon={<Ionicons name="share-social-outline" size={15} color={colors.primary} />}
                onPress={share}
                style={styles.linkBtn}
              />
            </View>
          </Card>
          <Button
            title="View Campaign"
            onPress={() => router.replace(`/campaigns/${created.id}`)}
            style={styles.viewBtn}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Create Campaign" />

      <Text style={styles.label}>Event type</Text>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
        ))}
      </View>

      <Field
        label="Campaign title"
        placeholder="Support for Mama Chinedu's Burial"
        value={title}
        onChangeText={(t) => { setTitle(t); if (errors.title) setErrors((e) => ({ ...e, title: undefined })); }}
        error={errors.title}
      />

      <Field
        label="Target amount"
        placeholder="500,000"
        keyboardType="number-pad"
        value={target}
        onChangeText={(t) => { setTarget(t); if (errors.target) setErrors((e) => ({ ...e, target: undefined })); }}
        error={errors.target}
        left={<Text style={styles.naira}>₦</Text>}
      />

      <Text style={styles.label}>Deadline</Text>
      <View style={styles.chips}>
        {DEADLINES.map((d) => (
          <Chip
            key={d}
            label={`${d} days`}
            selected={deadlineDays === d}
            onPress={() => setDeadlineDays(d)}
          />
        ))}
      </View>

      <Field
        label="About this campaign"
        placeholder="Tell your story — what are you raising funds for?"
        value={about}
        onChangeText={(t) => { setAbout(t); if (errors.about) setErrors((e) => ({ ...e, about: undefined })); }}
        error={errors.about}
        multiline
        numberOfLines={4}
        style={styles.aboutInput}
      />

      <View style={styles.feeNote}>
        <Ionicons name="information-circle" size={18} color={colors.primary} />
        <Text style={styles.feeText}>CirclePay charges a 2% platform fee on funds raised.</Text>
      </View>

      <Button title="Launch Campaign" onPress={launch} style={styles.launchBtn} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fonts.semibold, fontSize: 13, color: colors.ink, marginBottom: 7 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  naira: { fontFamily: fonts.bold, fontSize: 15, color: colors.primary },
  aboutInput: { minHeight: 96, textAlignVertical: 'top', paddingTop: 14 },
  feeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.chip,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  feeText: { flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.primaryDark },
  launchBtn: { marginTop: spacing.sm },

  successWrap: { alignItems: 'center', paddingTop: spacing.xxl },
  halo: {
    width: 116, height: 116, borderRadius: 58,
    backgroundColor: colors.successBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  check: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontFamily: fonts.extrabold, fontSize: 21, color: colors.ink, letterSpacing: -0.4 },
  successBody: {
    fontFamily: fonts.medium, fontSize: 13, color: colors.sub,
    textAlign: 'center', marginTop: spacing.sm, lineHeight: 19, paddingHorizontal: spacing.lg,
  },
  linkCard: { alignSelf: 'stretch', marginTop: spacing.xl, alignItems: 'center' },
  linkLabel: { fontFamily: fonts.semibold, fontSize: 12, color: colors.sub },
  link: { fontFamily: fonts.mono, fontSize: 15.5, color: colors.primary, marginTop: 6 },
  linkActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  linkBtn: { flex: 1 },
  viewBtn: { alignSelf: 'stretch', marginTop: spacing.xl },
});
