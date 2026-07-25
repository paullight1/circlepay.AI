import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { avatarColor, colors, fonts, initials } from '@/theme/tokens';

interface Props {
  name: string;
  size?: number;
  /** Ring highlight (e.g. next payout receiver). */
  ring?: boolean;
  /** Portrait URL. Omit (or let it fail) to fall back to initials. */
  photoUri?: string;
}

/**
 * Member avatar: a portrait when we have one, initials otherwise.
 *
 * The initials layer is always rendered underneath, so it doubles as the
 * placeholder while the photo decodes and as the fallback if the fetch fails —
 * offline or with a rotted URL you get the deterministic colored initials, never
 * a broken-image icon. Avatar is deliberately dumb about *which* photo belongs
 * to a member; callers resolve that (e.g. `memberPhoto` from `@/lib/imagery`)
 * and pass `photoUri` in.
 */
export function Avatar({ name, size = 40, ring, photoUri }: Props) {
  // Keyed by URI so a new photo gets a fresh attempt after an earlier failure.
  const [failedUri, setFailedUri] = useState<string | undefined>(undefined);
  const showPhoto = photoUri !== undefined && photoUri !== failedUri;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: avatarColor(name) },
        styles.center,
        ring && styles.ring,
      ]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
      {showPhoto ? (
        <Image
          source={{ uri: photoUri }}
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2 }]}
          contentFit="cover"
          transition={180}
          cachePolicy="disk"
          onError={() => setFailedUri(photoUri)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  text: { color: colors.onPrimary, fontFamily: fonts.bold },
  ring: { borderWidth: 2.5, borderColor: colors.success },
});
