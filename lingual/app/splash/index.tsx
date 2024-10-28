import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { MotiView } from 'moti';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function SplashScreen() {
  const animation = useRef(new Animated.Value(0)).current;
  const pathAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Text fade in animation
    Animated.timing(animation, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();

    // Blob animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pathAnimation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
        Animated.timing(pathAnimation, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
        }),
      ])
    ).start();

    // Navigate to landing page after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/(app)/');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const path = pathAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'M50,0 C70,20 80,40 50,100 C20,40 30,20 50,0',
      'M50,0 C90,30 60,50 50,100 C40,50 10,30 50,0'
    ],
  });

  return (
    <View style={styles.container}>
      <MotiView
        from={{
          scale: 0.8,
          opacity: 0,
        }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        transition={{
          type: 'timing',
          duration: 1000,
        }}
        style={styles.blobContainer}
      >
        <Svg height="200" width="100" viewBox="0 0 100 100">
          <AnimatedPath
            d={path}
            fill="#FF6B00"
            opacity={0.8}
          />
        </Svg>
      </MotiView>

      <Animated.Text 
        style={[
          styles.text,
          {
            opacity: animation,
            transform: [
              {
                translateY: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        Lingual
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  blobContainer: {
    marginBottom: 20,
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B00',
    letterSpacing: 2,
  },
});