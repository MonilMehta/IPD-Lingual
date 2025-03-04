import React from 'react';
import { Text, StyleSheet, View, Platform } from 'react-native';
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
  color 
}: FloatingTextProps) => {
  // Use provided color or generate one from palette based on language
  const textColor = color || colorPalette[Math.abs(language.charCodeAt(0)) % colorPalette.length];
  
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
  
  return (
    <MotiView
      style={[
        styles.container,
        getContainerStyle(),
        {
          left: position.x,
          top: position.y,
          transform: [{ rotate: `${rotation}deg` }],
          borderColor: textColor,
          backgroundColor: `${textColor}15`, // Very light version of the color
        }
      ]}
      from={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 0.92, scale: 1 }}
      transition={{
        type: 'timing',
        duration: 800,
        delay: animationDelay,
      }}
    >
      <MotiView
        from={{ translateY: 0 }}
        animate={{ translateY: [-2, 2, -2] }}
        transition={{
          type: 'timing',
          duration: 3000 + Math.random() * 2000,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: 'white',
    elevation: 2,
    alignItems: 'center',
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
