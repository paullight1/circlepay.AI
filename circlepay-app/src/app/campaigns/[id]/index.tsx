import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { daysUntil, formatNaira, timeAgo } from '@/lib/format';
import { useStore } from '@/store/useStore';
import { colors, fonts, spacing } from '@/theme/tokens';
import {
  AmountText, Avatar, Button, Card, EmptyState, ProgressBar,
  Screen, ScreenHeader, SectionHeader, StatusPill,
} from '@/ui';

/** Screen 19 — Campaign Details (+ organizer analytics when it's your campaign). */
export default function CampaignDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const campaign = useStore((s) => s.campaigns.find((c) => c.id === id));

  if (!campaign) {
    return (
      <Screen>
        <ScreenHeader title="Campaign Details" />
        <EmptyState icon="heart-outline" title="Campaign not found" body="This campaign may have ended or been removed." />
      </Screen>
    );
  }

  const pct = Math.min(100, Math.round((campaign.raised / campaign.target) * 100));
  const remaining = Math.max(0, campaign.target - campaign.raised);
  const daysLeft = daysUntil(campaign.deadline);
  const link = `https://circlepay.app/c/${campaign.code}`;

  const share = () =>
    Share.share({
      message: `Support "${campaign.title}" on CirclePay AI — donate here: ${link}`,
    }).catch(() => undefined);

  // Organizer analytics — top supporters aggregated across donations.
  const topSupporters = campaign.isMine
    ? [...campaign.donations
        .reduce((map, d) => map.set(d.donor, (map.get(d.donor) ?? 0) + d.amount), new Map<string, number>())
        .entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  return (
    <Screen>
      <ScreenHeader
        title="Campaign Details"
        right={
          <Pressable onPress={share} hitSlop={10} style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.6 }]}>
            <Ionicons name="share-social-outline" size={18} color={colors.ink} />
          </Pressable>
        }
      />

      {/* Title / organizer */}
      <Card>
        <View style={styles.heroRow}>
          <Avatar name={campaign.organizer} size={52} />
          <View style={styles.heroTitles}>
            <Text style={styles.title}>{campaign.title}</Text>
            <Text style={styles.by}>by {campaign.organizer}</Text>
          </View>
        </View>
        <View style={styles.pillRow}>
          <StatusPill label={`${campaign.category} Support`} tone="primary" />
          {campaign.isMine && <StatusPill label="Your Campaign" tone="success" />}
        </View>
      </Card>

      {/* Progress */}
      <Card style={styles.block}>
        <Text style={styles.cardLabel}>Campaign Progress</Text>
        <View style={styles.raisedRow}>
          <AmountText amount={campaign.raised} size={26} color={colors.primary} />
          <Text style={styles.pct}>{pct}%</Text>
        </View>
        <Text style={styles.goal}>raised of {formatNaira(campaign.target)} goal</Text>
        <ProgressBar progress={campaign.raised / campaign.target} color={colors.primary} height={9} />
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{campaign.supporters}</Text>
            <Text style={styles.statLabel}>Supporters</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{daysLeft}</Text>
            <Text style={styles.statLabel}>Days Left</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <AmountText amount={remaining} size={15} color={colors.ink} style={styles.statAmount} />
            <Text style={styles.statLabel}>To go</Text>
          </View>
        </View>
      </Card>

      {/* About */}
      <Card style={styles.block}>
        <Text style={styles.cardTitle}>About this campaign</Text>
        <Text style={styles.about}>{campaign.about}</Text>
      </Card>

      {/* Organizer */}
      <Card style={styles.block}>
        <Text style={styles.cardTitle}>Organized by</Text>
        <View style={styles.ownerRow}>
          <Avatar name={campaign.organizer} size={38} />
          <View style={styles.ownerBody}>
            <Text style={styles.ownerName}>{campaign.organizer}</Text>
            <Text style={styles.ownerRole}>Campaign Owner</Text>
          </View>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
        </View>
      </Card>

      {/* Organizer analytics */}
      {campaign.isMine && (
        <>
          <SectionHeader title="Recent Donations" />
          <Card padded={false} style={styles.listCard}>
            {campaign.donations.length === 0 ? (
              <EmptyState icon="gift-outline" title="No donations yet" body="Share your campaign link to start receiving support." />
            ) : (
              campaign.donations.slice(0, 6).map((d, i) => (
                <View key={d.id} style={[styles.donationRow, i > 0 && styles.rowDivider]}>
                  <Avatar name={d.donor} size={34} />
                  <View style={styles.donationBody}>
                    <Text style={styles.donorName}>{d.donor}</Text>
                    <Text style={styles.donationTime}>{timeAgo(d.date)}</Text>
                  </View>
                  <AmountText amount={d.amount} size={14} color={colors.ink} />
                </View>
              ))
            )}
          </Card>

          {topSupporters.length > 0 && (
            <>
              <SectionHeader title="Top Supporters" />
              <Card padded={false} style={styles.listCard}>
                {topSupporters.map(([donor, total], i) => (
                  <View key={donor} style={[styles.donationRow, i > 0 && styles.rowDivider]}>
                    <View style={[styles.rank, i === 0 && styles.rankFirst]}>
                      <Text style={[styles.rankText, i === 0 && { color: colors.onPrimary }]}>{i + 1}</Text>
                    </View>
                    <Avatar name={donor} size={30} />
                    <View style={styles.donationBody}>
                      <Text style={styles.donorName}>{donor}</Text>
                    </View>
                    <AmountText amount={total} size={14} color={colors.primary} />
                  </View>
                ))}
              </Card>
            </>
          )}
        </>
      )}

      {/* Actions */}
      <Button
        title="Donate Now"
        onPress={() => router.push(`/campaigns/${campaign.id}/donate`)}
        style={styles.donateBtn}
      />
      <Button
        title="Share Campaign"
        variant="ghost"
        icon={<Ionicons name="share-social-outline" size={17} color={colors.primary} />}
        onPress={share}
        style={styles.shareCampaignBtn}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  shareBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroTitles: { flex: 1 },
  title: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.ink, letterSpacing: -0.3 },
  by: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub, marginTop: 3 },
  pillRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  block: { marginTop: spacing.md },
  cardLabel: { fontFamily: fonts.semibold, fontSize: 12.5, color: colors.sub },
  raisedRow: {
    flexDirection: 'row', alignItems: 'baseline',
    justifyContent: 'space-between', marginTop: spacing.sm,
  },
  pct: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.primary },
  goal: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub, marginBottom: spacing.md, marginTop: 2 },
  statRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: spacing.lg, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  statValue: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.ink },
  statAmount: { fontSize: 15 },
  statLabel: { fontFamily: fonts.medium, fontSize: 11, color: colors.sub, marginTop: 3 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  about: { fontFamily: fonts.medium, fontSize: 13, color: colors.sub, lineHeight: 20, marginTop: spacing.sm },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  ownerBody: { flex: 1 },
  ownerName: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  ownerRole: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.sub, marginTop: 2 },
  listCard: { paddingHorizontal: spacing.lg },
  donationRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, paddingVertical: spacing.md,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  donationBody: { flex: 1 },
  donorName: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.ink },
  donationTime: { fontFamily: fonts.medium, fontSize: 11.5, color: colors.faint, marginTop: 2 },
  rank: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.chip,
    alignItems: 'center', justifyContent: 'center',
  },
  rankFirst: { backgroundColor: colors.primary },
  rankText: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  donateBtn: { marginTop: spacing.xl },
  shareCampaignBtn: { marginTop: spacing.md },
});
