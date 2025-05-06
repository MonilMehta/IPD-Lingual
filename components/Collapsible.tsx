import React, { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Animated, Easing } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';

export function Collapsible({ children, title }: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleAccordion = () => {
    setIsOpen((prev) => {
      Animated.timing(animation, {
        toValue: prev ? 0 : 1,
        duration: 200,
        easing: Easing.ease,
        useNativeDriver: false,
      }).start();
      return !prev;
    });
  };

  const rotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity
        style={styles.heading}
        onPress={toggleAccordion}
        activeOpacity={0.85}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <IconSymbol name="chevron.right" size={20} weight="bold" color="#FF6B00" />
        </Animated.View>
        <Text style={styles.title}>{title}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  accordionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFE0CC',
    overflow: 'hidden',
    shadowColor: '#FF6B00',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFF3E6',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0CC',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B00',
    marginLeft: 10,
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
});
