import { Image, type ImageContentFit } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import type { RemoteImageSource } from '@/lib/imagery';
import { colors } from '@/theme/tokens';

import { BrandMark } from './motion';

interface Props {
  source: RemoteImageSource;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  /** Size of the brand mark shown if the image can't be fetched. */
  fallbackMark?: number;
}

/**
 * Remote photo with a tinted backdrop and a graceful offline path.
 *
 * `expo-image` caches to disk, so each photo is fetched once and served locally
 * from then on. If it can't be fetched at all — first run with no network, or a
 * URL that has rotted — we render the brand mark on the image's tint rather
 * than a broken-image icon.
 */
export function RemoteImage({ source, style, contentFit = 'cover', fallbackMark = 56 }: Props) {
  const [failed, setFailed] = useState(false);

  return (
    <View style={[styles.wrap, { backgroundColor: source.tint }, style]}>
      {failed ? (
        <View style={styles.fallback}>
          <BrandMark size={fallbackMark} plate={false} />
        </View>
      ) : (
        <Image
          source={{ uri: source.uri }}
          style={StyleSheet.absoluteFill}
          contentFit={contentFit}
          transition={300}
          cachePolicy="disk"
          accessible
          accessibilityLabel={source.alt}
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.cardAlt },
  fallback: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
