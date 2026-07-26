import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { daysUntil, formatNaira } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { colors, fonts, gradients, radius, spacing } from '@/theme/tokens';
import {
  AmountText, Avatar, Button, Card, ProgressBar, Screen, ScreenHeader, SectionHeader,
} from '@/ui';

const CATEGORIES: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}[] = [
  { label: 'Burial', icon: 'heart', color: colors.primary, bg: colors.chip },
  { label: 'Birthday', icon: 'gift', color: colors.warning, bg: colors.warningBg },
  { label: 'Medical', icon: 'medkit', color: colors.danger, bg: colors.dangerBg },
  { label: 'Wedding', icon: 'star', color: colors.info, bg: colors.infoBg },
  { label: 'School Fees', icon: 'book', color: colors.success, bg: colors.successBg },
  { label: 'More', icon: 'ellipsis-horizontal', color: colors.sub, bg: colors.cardAlt },
];

/** Screen 18 — Support / Donations home (CircleSupport), pushed from Home/More. */
export default function Support() {
  const router = useRouter();
  const campaigns = useStore((s) => s.campaigns);

  const active = campaigns.filter((c) => c.status === 'active');
  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const totalSupporters = campaigns.reduce((sum, c) => sum + c.supporters, 0);

  return (
    <Screen>
      {/* This screen used to be a tab root with its own heading row and a
          decorative bell. Now that it is pushed, ScreenHeader carries the
          title — a second heading just repeated it. */}
      <ScreenHeader title="CircleSupport" subtitle="Support / Donations" />

      {/* Create campaign CTA banner */}
      <LinearGradient
        colors={gradients.balance}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}>
        <View style={styles.bannerBody}>
          <Text style={styles.bannerTitle}>Create a Support Campaign</Text>
          <Text style={styles.bannerSub}>Raise funds for what matters</Text>
          <Button
            title="Create Campaign"
            small
            onPress={() => router.push('/campaigns/create')}
            style={styles.bannerBtn}
          />
        </View>
        <View style={styles.bannerBubble}>
          <Ionicons name="heart" size={26} color={colors.onPrimary} />
        </View>
      </LinearGradient>

      {/* Category icon row */}
      <View style={styles.catRow}>
        {CATEGORIES.map((cat) => (
          <View key={cat.label} style={styles.catItem}>
            <View style={[styles.catBubble, { backgroundColor: cat.bg }]}>
              <Ionicons name={cat.icon} size={19} color={cat.color} />
            </View>
            <Text style={styles.catLabel} numberOfLines={1}>{cat.label}</Text>
          </View>
        ))}
      </View>

      {/* Active campaigns */}
      <SectionHeader title="Active Campaigns" actionLabel="See all" />
      <View style={styles.list}>
        {active.map((c) => {
          const pct = Math.min(100, Math.round((c.raised / c.target) * 100));
          const left = daysUntil(c.deadline);
          return (
            <Card key={c.id} onPress={() => router.push(`/campaigns/${c.id}`)}>
              <View style={styles.campaignTop}>
                <Avatar name={c.organizer} size={38} />
                <View style={styles.campaignTitles}>
                  <Text style={styles.campaignTitle} numberOfLines={1}>{c.title}</Text>
                  <Text style={styles.campaignBy}>by {c.organizer}</Text>
                </View>
              </View>
              <View style={styles.raisedRow}>
                <AmountText amount={c.raised} size={16} color={colors.primary} />
                <Text style={styles.raisedOf}> raised of {formatNaira(c.target)} goal</Text>
                <Text style={styles.pct}>{pct}%</Text>
              </View>
              <ProgressBar progress={c.raised / c.target} color={colors.primary} height={7} />
              <View style={styles.metaRow}>
                <Text style={styles.supporters}>{c.supporters} Supporters</Text>
                <Text style={styles.daysLeft}>{left} days left</Text>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Totals footer card */}
      <LinearGradient
        colors={gradients.payout}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.totals}>
        <Text style={styles.totalsLabel}>Total Raised Across All Campaigns</Text>
        <AmountText amount={totalRaised} decimals={2} size={26} color={colors.onPrimary} />
        <View style={styles.totalsRow}>
          <View style={styles.totalsCol}>
            <Text style={styles.totalsColLabel}>Total Campaigns</Text>
            <Text style={styles.totalsColValue}>{campaigns.length}</Text>
          </View>
          <View style={styles.totalsDivider} />
          <View style={styles.totalsCol}>
            <Text style={styles.totalsColLabel}>Total Supporters</Text>
            <Text style={styles.totalsColValue}>{totalSupporters.toLocaleString('en-US')}</Text>
          </View>
        </View>
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bannerBody: { flex: 1 },
  bannerTitle: { fontFamily: fonts.extrabold, fontSize: 16.5, color: colors.onPrimary },
  bannerSub: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.onPrimaryDim, marginTop: 3 },
  bannerBtn: { alignSelf: 'flex-start', marginTop: spacing.md, backgroundColor: colors.card },
  bannerBubble: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  catItem: { alignItems: 'center', width: 50 },
  catBubble: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  catLabel: { fontFamily: fonts.semibold, fontSize: 10, color: colors.sub, marginTop: 5 },
  list: { gap: spacing.md },
  campaignTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  campaignTitles: { flex: 1 },
  campaignTitle: { fontFamily: fonts.bold, fontSize: 14.5, color: colors.ink },
  campaignBy: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  raisedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  raisedOf: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, flex: 1 },
  pct: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.primary },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  supporters: { fontFamily: fonts.semibold, fontSize: 12, color: colors.sub },
  daysLeft: { fontFamily: fonts.bold, fontSize: 12, color: colors.warning },
  totals: {
    marginTop: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  totalsLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.onPrimaryDim },
  totalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  totalsCol: { flex: 1 },
  totalsDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.18)', marginHorizontal: spacing.lg },
  totalsColLabel: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.onPrimaryDim },
  totalsColValue: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.onPrimary, marginTop: 2 },
});
