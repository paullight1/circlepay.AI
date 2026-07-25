import { Pressable, StyleSheet, Text, View } from 'react-native';

import { timeAgo } from '@/lib/format';
import type { NotifType } from '@/store/types';
import { useStore } from '@/store/useStore';
import { colors, fonts, radius, spacing } from '@/theme/tokens';
import { Card, EmptyState, Screen, ScreenHeader } from '@/ui';
import { IconBubble } from '@/ui/ListRow';

const TYPE_ICONS: Record<NotifType, { name: Parameters<typeof IconBubble>[0]['name']; color: string; bg: string }> = {
  alert: { name: 'warning', color: colors.danger, bg: colors.dangerBg },
  payment: { name: 'checkmark-circle', color: colors.success, bg: colors.successBg },
  payout: { name: 'trophy', color: colors.warning, bg: colors.warningBg },
  backup: { name: 'shield-checkmark', color: colors.primary, bg: colors.chip },
  campaign: { name: 'heart', color: colors.accent, bg: colors.chip },
  system: { name: 'information-circle', color: colors.info, bg: colors.infoBg },
};

export default function NotificationsScreen() {
  const notifications = useStore((s) => s.notifications);
  const markAllNotificationsRead = useStore((s) => s.markAllNotificationsRead);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Screen>
      <ScreenHeader title="Notifications" />

      <View style={styles.toolbar}>
        <Text style={styles.unreadCount}>
          {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        </Text>
        <Pressable
          onPress={markAllNotificationsRead}
          disabled={unreadCount === 0}
          hitSlop={8}
          style={({ pressed }) => [(pressed || unreadCount === 0) && { opacity: 0.5 }]}>
          <Text style={styles.markAll}>Mark all as read</Text>
        </Pressable>
      </View>

      {notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No notifications yet"
          body="Alerts about your circles, payments and campaigns will show up here."
        />
      ) : (
        <View style={styles.list}>
          {notifications.map((n) => {
            const icon = TYPE_ICONS[n.type];
            return (
              <Card key={n.id} style={n.read ? styles.row : [styles.row, styles.rowUnread]}>
                <View style={[styles.dot, n.read && styles.dotRead]} />
                <IconBubble name={icon.name} color={icon.color} bg={icon.bg} />
                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>{n.title}</Text>
                    <Text style={styles.time}>{timeAgo(n.date)}</Text>
                  </View>
                  <Text style={styles.text} numberOfLines={2}>{n.body}</Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  unreadCount: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub },
  markAll: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  rowUnread: { backgroundColor: colors.chip, borderColor: colors.chip },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  dotRead: { backgroundColor: 'transparent' },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, fontFamily: fonts.bold, fontSize: 13.5, color: colors.ink },
  time: { fontFamily: fonts.medium, fontSize: 11, color: colors.faint },
  text: { fontFamily: fonts.medium, fontSize: 12.5, color: colors.sub, marginTop: 2, lineHeight: 18 },
});
