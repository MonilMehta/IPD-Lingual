import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TextInput,Animated,Easing } from 'react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';

import { API_URL } from '../../config/constants';
import { Search } from 'lucide-react-native';

function capitalizeFirstLetter(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
const SkeletonLoader = () => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [animatedValue]);
  const bgColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFE5CC', '#FFD1A3'],
  });
  return (
    <Animated.View style={[styles.skeleton, { backgroundColor: bgColor }]} />
  );
};

export const Header = ({ homepage, loading, error }) => {
  // If homepage/props loading is provided, use it, else fetch here
  const [userLoading, setUserLoading] = useState(loading ?? true);
  const [user, setUser] = useState(homepage ? { name: homepage.name, level: homepage.current_level } : null);
  const router = useRouter();
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (homepage) return;
    let isMounted = true;
    async function fetchUser() {
      setUserLoading(true);
      try {
        const token = await import('../../services/Auth').then(m => m.getToken());
        const res = await fetch(`${API_URL}/api/homepage`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch homepage');
        const data = await res.json();
        if (isMounted) setUser({ name: data.name, level: data.current_level });
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setUserLoading(false);
      }
    }
    fetchUser();
    return () => { isMounted = false; };
  }, [homepage]);

  return (
    <MotiView from={{ opacity: 0, translateY: -20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 600 }}>
      <View style={styles.headerRow}>
        <View style={styles.leftLogoContainer}>
          <Image source={require('../../assets/images/logo-cat.png')} style={styles.logoCat} />
          <Image source={require('../../assets/images/logo-text.png')} style={styles.logoText} />
        </View>
        <View style={styles.rightUserContainer}>
          {userLoading ? (
            <SkeletonLoader />
          ) : user ? (
            <>
              <Text style={styles.helloText} numberOfLines={1}>
                Welcome Back, {capitalizeFirstLetter(user.name)}
              </Text>
              <Text style={styles.levelText}>Level {user.level}</Text>
            </>
          ) : (
            <Text style={styles.helloText}>Hello</Text>
          )}
        </View>
      </View>
      <View style={styles.searchContainer}>
        <Search size={20} color="#666" onPress={() => {
          if (searchText.trim()) {
            router.push({ pathname: '/(main)/guides', params: { search: searchText.trim() } });
          }
        }} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Search phrases, translations..." 
          placeholderTextColor="#999" 
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={() => {
            if (searchText.trim()) {
              router.push({ pathname: '/(main)/guides', params: { search: searchText.trim() } });
            }
          }}
          returnKeyType="search"
        />
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
    paddingHorizontal: 8,
  },
  leftLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoCat: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
    marginRight: 6,
  },
  logoText: {
    width: 80,
    height: 32,
    resizeMode: 'contain',
  },
  rightUserContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 100,
  },
  helloText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  levelText: {
    fontSize: 13,
    color: '#FF6B00',
    fontWeight: '500',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginLeft: 6,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
});