import React from 'react';
import { Text, StyleSheet, View, Platform, Image } from 'react-native';
import { MotiView } from 'moti';

type Position = {
  x: number;
  y: number;
};

type FloatingTextProps = {
  text: string;
  language: string;
  position: Position;
  size: 'small' | 'medium' | 'large';
  rotation: number;
  color?: string;
  mascotImage?: any;
};

// Color palette for language text
const colorPalette = [
  '#FF6B00', // Orange
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#FFC107', // Amber
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#009688', // Teal
  '#673AB7', // Deep Purple
];

export const FloatingText = ({ 
  text, 
  language, 
  position, 
  size, 
  rotation,
  color,
  mascotImage
}: FloatingTextProps & { mascotImage?: any }) => {
  // Use provided color or generate one from palette based on language
  let textColor = colorPalette[0];
  if (color) {
    textColor = color;
  } else if (language && typeof language === 'string' && language.length > 0) {
    textColor = colorPalette[Math.abs(language.charCodeAt(0)) % colorPalette.length];
  }
  
  // Apply different styles based on size - make sizes smaller for better fit on mobile
  const getTextStyle = () => {
    switch (size) {
      case 'large':
        return styles.textLarge;
      case 'medium':
        return styles.textMedium;
      case 'small':
      default:
        return styles.textSmall;
    }
  };

  const getLanguageStyle = () => {
    switch (size) {
      case 'large':
        return styles.languageLarge;
      case 'medium':
        return styles.languageMedium;
      case 'small':
      default:
        return styles.languageSmall;
    }
  };
  
  // Get container width based on size to set max width
  const getContainerStyle = () => {
    switch (size) {
      case 'large':
        return { maxWidth: 120 };
      case 'medium':
        return { maxWidth: 100 };
      case 'small':
      default:
        return { maxWidth: 80 };
    }
  };
  
  // Generate a unique animation delay based on position
  const animationDelay = (position.x + position.y) % 2000;
  
  // If mascotImage is provided, render mascot instead of text
  if (mascotImage) {
    // Mascot avatar: no border/background, bounce animation
    return (
      <MotiView
        style={[
          {
            position: 'absolute',
            left: position.x,
            top: position.y,
            zIndex: 2,
          }
        ]}
        from={{ scale: 0.85 }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{
          type: 'timing',
          duration: 2200,
          loop: true,
          repeatReverse: true,
        }}
      >
        <Image source={mascotImage} style={{ width: 90, height: 90, resizeMode: 'contain' }} />
      </MotiView>
    );
  }

  return (
    <MotiView
      style={[
        styles.container,
        getContainerStyle(),
        {
          left: position.x,
          top: position.y,
          transform: [
            { rotate: `${rotation + (Math.random() * 8 - 4)}deg` },
            { scale: 1 + (Math.random() * 0.08 - 0.04) }
          ],
          borderColor: textColor,
          backgroundColor: `${textColor}18`, // More transparent
          shadowColor: textColor,
        }
      ]}
      from={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 0.92, scale: 1.18 }}
      transition={{
        type: 'timing',
        duration: 800,
        delay: animationDelay,
      }}
    >
      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: [-4, 4, -4] }}
        transition={{
          type: 'timing',
          duration: 3200 + Math.random() * 1200,
          loop: true,
          repeatReverse: true,
        }}
      >
        <Text 
          style={[
            styles.text, 
            getTextStyle(),
            { color: textColor }
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {text}
        </Text>
        <Text 
          style={[
            styles.language, 
            getLanguageStyle(),
            { color: textColor }
          ]}
          numberOfLines={1}
        >
          {language}
        </Text>
      </MotiView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  mascotContainer: {
    position: 'absolute',
    zIndex: 2,
    padding: 0,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FF6B00',
    backgroundColor: '#fff',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  textSmall: {
    fontSize: 12,
  },
  textMedium: {
    fontSize: 14,
  },
  textLarge: {
    fontSize: 16,
  },
  language: {
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 2,
  },
  languageSmall: {
    fontSize: 8,
  },
  languageMedium: {
    fontSize: 9,
  },
  languageLarge: {
    fontSize: 10,
  },
});
