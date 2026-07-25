import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import type { AgentLocation } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Card, EmptyState, Field, Screen, ScreenHeader, SectionHeader, StatusPill } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

const KIND_ICON: Record<AgentLocation['kind'], keyof typeof Ionicons.glyphMap> = {
  kiosk: 'grid',
  store: 'storefront',
  agent: 'briefcase',
};

const KIND_LABEL: Record<AgentLocation['kind'], string> = {
  kiosk: 'Kiosk',
  store: 'Store',
  agent: 'Mobile agent',
};

const SERVICES: Record<AgentLocation['kind'], string> = {
  kiosk: 'Cash deposit · Cash withdrawal · Scratch cards',
  store: 'Cash deposit · Cash withdrawal · Scratch cards · Bills',
  agent: 'Cash deposit · Cash withdrawal · Transfers',
};

/** Decorative map placeholder — grid, roads and agent pins. */
function MapPreview({ pinCount }: { pinCount: number }) {
  const pins = [
    { x: 96, y: 66 },
    { x: 196, y: 44 },
    { x: 150, y: 112 },
    { x: 252, y: 96 },
    { x: 56, y: 122 },
  ].slice(0, Math.max(1, Math.min(5, pinCount)));

  return (
    <Svg width="100%" height={158} viewBox="0 0 320 158">
      {/* street grid */}
      {[24, 56, 88, 120, 152].map((y) => (
        <Line key={`h${y}`} x1={0} y1={y} x2={320} y2={y} stroke={colors.border} strokeWidth={1} />
      ))}
      {[40, 90, 140, 190, 240, 290].map((x) => (
        <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={158} stroke={colors.border} strokeWidth={1} />
      ))}
      {/* main roads */}
      <Path d="M0 108 C 70 96, 130 132, 200 112 S 300 74, 320 82" stroke={colors.borderStrong} strokeWidth={7} fill="none" strokeLinecap="round" />
      <Path d="M60 158 C 84 110, 110 70, 172 0" stroke={colors.borderStrong} strokeWidth={5} fill="none" strokeLinecap="round" />
      <Path d="M0 34 L 320 22" stroke={colors.borderStrong} strokeWidth={4} strokeLinecap="round" />
      {/* park block */}
      <Circle cx={276} cy={132} r={17} fill={colors.successBg} />
      {/* your position */}
      <Circle cx={160} cy={82} r={11} fill={colors.chip} />
      <Circle cx={160} cy={82} r={5} fill={colors.info} stroke={colors.card} strokeWidth={2} />
      {/* agent pins */}
      {pins.map((p) => (
        <G key={`${p.x}-${p.y}`} x={p.x} y={p.y} />
      ))}
    </Svg>
  );
}

/** A single map pin (teardrop) drawn at x,y. */
function G({ x, y }: { x: number; y: number }) {
  return (
    <>
      <Path
        d={`M${x} ${y} c -9 -10, -9 -22, 0 -22 c 9 0, 9 12, 0 22 z`}
        fill={colors.primary}
        stroke={colors.card}
        strokeWidth={2}
      />
      <Circle cx={x} cy={y - 14} r={3.4} fill={colors.card} />
    </>
  );
}

export default function FindAgentsScreen() {
  const agents = useStore((s) => s.agents);
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? agents.filter((a) => a.name.toLowerCase().includes(q) || a.address.toLowerCase().includes(q))
    : agents;
  const openCount = filtered.filter((a) => a.open).length;

  return (
    <Screen>
      <ScreenHeader title="Find Nearby Agents" />

      <Field
        placeholder="Search by name or location"
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        left={<Ionicons name="search" size={18} color={colors.faint} />}
        right={
          query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.faint} />
            </Pressable>
          ) : undefined
        }
      />

      <Card padded={false} style={styles.mapCard}>
        <MapPreview pinCount={filtered.length} />
        <View style={styles.mapFooter}>
          <Ionicons name="map" size={15} color={colors.primary} />
          <Text style={styles.mapCaption}>View on Map</Text>
          <Text style={styles.mapMeta}>
            {filtered.length} agent{filtered.length === 1 ? '' : 's'} · {openCount} open now
          </Text>
        </View>
      </Card>

      <SectionHeader title="Agents near you" />

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="location"
            title="No agents found"
            body={`Nothing matches “${query.trim()}”. Try a different name or area.`}
          />
        </Card>
      ) : (
        filtered.map((agent) => {
          const expanded = expandedId === agent.id;
          return (
            <Card
              key={agent.id}
              style={styles.agentCard}
              onPress={() => setExpandedId(expanded ? null : agent.id)}>
              <View style={styles.agentRow}>
                <IconBubble name={KIND_ICON[agent.kind]} size={42} />
                <View style={styles.agentBody}>
                  <Text style={styles.agentName} numberOfLines={1}>{agent.name}</Text>
                  <Text style={styles.agentAddress} numberOfLines={1}>{agent.address}</Text>
                  <Text style={styles.agentDistance}>{agent.distanceKm} km away</Text>
                </View>
                <View style={styles.agentRight}>
                  <StatusPill label={agent.open ? 'Open' : 'Closed'} small />
                  <Ionicons name="navigate" size={17} color={colors.primary} />
                </View>
              </View>

              {expanded && (
                <View style={styles.details}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{KIND_LABEL[agent.kind]}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Agent ID</Text>
                    <Text style={[styles.detailValue, styles.mono]}>{agent.agentId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Services</Text>
                    <Text style={[styles.detailValue, styles.services]}>{SERVICES[agent.kind]}</Text>
                  </View>
                </View>
              )}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapCard: { overflow: 'hidden' },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
  mapCaption: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  mapMeta: { flex: 1, textAlign: 'right', fontFamily: fonts.medium, fontSize: 12, color: colors.sub },

  agentCard: { marginBottom: spacing.md },
  agentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  agentBody: { flex: 1 },
  agentName: { fontFamily: fonts.semibold, fontSize: 14.5, color: colors.ink },
  agentAddress: { fontFamily: fonts.medium, fontSize: 12, color: colors.sub, marginTop: 2 },
  agentDistance: { fontFamily: fonts.semibold, fontSize: 12, color: colors.primary, marginTop: 3 },
  agentRight: { alignItems: 'flex-end', gap: spacing.sm },

  details: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  detailLabel: { width: 72, fontFamily: fonts.medium, fontSize: 12, color: colors.sub },
  detailValue: { flex: 1, fontFamily: fonts.semibold, fontSize: 12.5, color: colors.ink },
  mono: { fontFamily: fonts.mono },
  services: { lineHeight: 18 },
});
