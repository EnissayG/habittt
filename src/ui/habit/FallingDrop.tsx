import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';

import { PixelIcon } from '../components/PixelIcon';

interface FallingDropProps {
  /** Changes each time the plant is watered: a new drop falls. */
  drop: number;
  /** How far the drop falls, in points (to the top of the plant). */
  distance: number;
}

/**
 * Screen 6, after watering: a pixel drop falls onto the plant and fades.
 * Nothing moves when the phone asks to reduce motion.
 */
export function FallingDrop({ drop, distance }: FallingDropProps) {
  const [progress] = useState(() => new Animated.Value(0));
  const [falling, setFalling] = useState(false);

  useEffect(() => {
    if (drop === 0) return;
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (!active || reduce) return;
      setFalling(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 900,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => {
        if (active) setFalling(false);
      });
    });
    return () => {
      active = false;
    };
  }, [drop, progress]);

  if (!falling) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.drop,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
          transform: [
            {
              translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, distance] }),
            },
          ],
        },
      ]}
    >
      <PixelIcon name="drop" size={21} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drop: { position: 'absolute', top: 0, alignSelf: 'center' },
});
