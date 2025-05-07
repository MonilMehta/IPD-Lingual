import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Ellipse, Polygon, Path, G, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

interface CatPasswordToggleProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const CatPasswordToggle: React.FC<CatPasswordToggleProps> = ({ value, onChangeText, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <View style={styles.wrapper}>
      <Ionicons name="lock-closed-outline" size={22} color="#FF6B00" style={styles.passwordIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        placeholderTextColor="#aaa"
      />
      <TouchableOpacity 
        style={styles.catContainer} 
        onPress={() => setShowPassword(!showPassword)} 
        activeOpacity={0.7}
      >
        <View style={styles.catSvgWrapper}>
          {/* Cat face base */}
          <Svg width={40} height={40} viewBox="0 0 64 64">
            {/* Base cat head */}
            <Ellipse cx="32" cy="36" rx="22" ry="18" fill="#E67E22" />
            <Ellipse cx="32" cy="38" rx="18" ry="14" fill="#FFA259" />
            
            {/* Ears */}
            <Polygon points="12,18 20,32 28,22" fill="#E67E22" />
            <Polygon points="52,18 44,32 36,22" fill="#E67E22" />
            <Polygon points="14,20 21,31 27,23" fill="#FFA259" />
            <Polygon points="50,20 43,31 37,23" fill="#FFA259" />
            
            {/* Eyes - only shown when password is visible */}
            {showPassword && (
              <>
                <Ellipse cx="24" cy="40" rx="3" ry="4" fill="#3b302a" />
                <Ellipse cx="40" cy="40" rx="3" ry="4" fill="#3b302a" />
                {/* Eye shine */}
                <Ellipse cx="25.5" cy="39" rx="0.8" ry="0.8" fill="#FFFFFF" />
                <Ellipse cx="41.5" cy="39" rx="0.8" ry="0.8" fill="#FFFFFF" />
              </>
            )}
            
            {/* Paws covering eyes when password is hidden */}
            {!showPassword && (
              <>
                {/* Left paw */}
                <Ellipse cx="24" cy="38" rx="8" ry="7" fill="#E67E22" />
                <Ellipse cx="22" cy="40" rx="3" ry="2.5" fill="#FFA259" />
                <Ellipse cx="26" cy="42" rx="3" ry="2.5" fill="#FFA259" />
                <Ellipse cx="27" cy="37" rx="3" ry="2.5" fill="#FFA259" />
                
                {/* Right paw */}
                <Ellipse cx="40" cy="38" rx="8" ry="7" fill="#E67E22" />
                <Ellipse cx="38" cy="40" rx="3" ry="2.5" fill="#FFA259" />
                <Ellipse cx="42" cy="42" rx="3" ry="2.5" fill="#FFA259" />
                <Ellipse cx="43" cy="37" rx="3" ry="2.5" fill="#FFA259" />
              </>
            )}
            
            {/* Nose */}
            <Path d="M32,46 L29,43 L35,43 Z" fill="#3b302a" />
            
            {/* Mouth */}
            <Path d="M32,46 Q32,50 29,49" fill="none" stroke="#3b302a" strokeWidth="0.8" />
            <Path d="M32,46 Q32,50 35,49" fill="none" stroke="#3b302a" strokeWidth="0.8" />
            
            {/* Whiskers */}
            <G fill="none" stroke="#3b302a" strokeWidth="0.8">
              <Path d="M26,46 L15,44" />
              <Path d="M26,48 L15,52" />
              <Path d="M38,46 L49,44" />
              <Path d="M38,48 L49,52" />
            </G>
          </Svg>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 8, // reduced to fit icons
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
    height: 56,
    overflow: 'hidden', // ensure nothing overflows
  },
  passwordIcon: {
    marginRight: 8,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#222',
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  catContainer: {
    marginLeft: -26,
    justifyContent: 'center',
    alignItems: 'center',
    width: 32, // further reduced for small screens
    height: 48,
    maxWidth: 32,
    maxHeight: 48,
  },
  catSvgWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default CatPasswordToggle;