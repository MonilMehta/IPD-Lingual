import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { MaterialIcons } from '@expo/vector-icons'; // Or any other icon set from expo/vector-icons

export default function SplashScreen() {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 2000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      router.replace('(main)/home');
    });
  }, [animation]);

  return (
    <View style={styles.container}>
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 1000 }}
      >
        {/* Replace the Svg and AnimatedPath with the expo/vector-icons icon */}
        <MaterialIcons 
          name="language" // Use an appropriate icon name here
          size={200}
          color="#FF6B00"
          style={{
            transform: [
              {
                scale: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          }} 
        />
        <Text style={styles.text}>Lingual</Text>
      </MotiView>
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
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B00',
    letterSpacing: 2,
  },
});
