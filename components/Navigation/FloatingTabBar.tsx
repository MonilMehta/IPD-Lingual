import React, { useRef, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image, Animated, Easing, Dimensions } from 'react-native';
import { Home, BookOpen, Compass, User, Settings } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';

const TABS = [
  { name: 'Learn', icon: BookOpen, route: '/(main)/learn' },
  { name: 'Guides', icon: Compass, route: '/(main)/guides' },
  { name: 'Home', icon: Home, route: '/(main)/home' },
  { name: 'Profile', icon: User, route: '/(main)/profile' },
  { name: 'Settings', icon: Settings, route: '/(main)/settings' },
];

const OLLIE_SIZE = 80;
const OLLIE_OFFSET = 30;

export const FloatingTabBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeIdx, setActiveIdx] = useState(() => {
    const idx = TABS.findIndex(tab => {
      const routeNoMain = tab.route.replace('/(main)', '');
      return pathname === tab.route || pathname === routeNoMain;
    });
    return idx === -1 ? 2 : idx; // Default to Home
  });
  const ollieAnim = useRef(new Animated.Value(0)).current;
  const [ollieTabIdx, setOllieTabIdx] = useState(activeIdx);
  const { width } = Dimensions.get('window');
  const tabWidth = (width * 0.9) / TABS.length;
  const ollieLeft = tabWidth * ollieTabIdx + tabWidth / 2 - OLLIE_SIZE / 2 + width * 0.05;

  // Animate Ollie down, move, then up (with 2s delay)
  const animateOllieToTab = (newIdx, route) => {
    Animated.timing(ollieAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        setOllieTabIdx(newIdx);
        setActiveIdx(newIdx);
        router.navigate(route);
        Animated.timing(ollieAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }, 500);
    });
  };

  return (
    <View style={tabBarStyles.wrapper} pointerEvents="box-none">
      <Animated.View
        style={[
          tabBarStyles.ollieContainer,
          {
            left: ollieLeft,
            transform: [
              { translateY: ollieAnim.interpolate({ inputRange: [0, 1], outputRange: [-OLLIE_OFFSET, 60] }) },
            ],
            opacity: ollieAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
          },
        ]}
        pointerEvents="none"
      >
        <Image
          source={require('../../assets/images/cat-sayinghi.png')}
          style={{ width: OLLIE_SIZE, height: OLLIE_SIZE }}
          resizeMode="contain"
        />
      </Animated.View>
      <View style={tabBarStyles.tabBarWithOllie}>
        <View style={tabBarStyles.tabBar}>
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const routeNoMain = tab.route.replace('/(main)', '');
            const isActive = idx === activeIdx;
            return (
              <TouchableOpacity
                key={tab.name}
                style={tabBarStyles.tabButton}
                onPress={() => {
                  if (idx !== activeIdx) animateOllieToTab(idx, tab.route);
                }}
                activeOpacity={0.8}
              >
                <Icon size={28} color={isActive ? '#FF6B00' : '#888'} />
                <Text style={[tabBarStyles.tabLabel, isActive && { color: '#FF6B00' }]}>{tab.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const tabBarStyles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 140, // more height for Ollie overlap
  },
  ollieContainer: {
    position: 'absolute',
    bottom: 20, // overlap the bar
    zIndex: -1,
  },
  tabBarWithOllie: {
    width: '100%',
    alignItems: 'center',
    paddingTop: OLLIE_SIZE / 2 - 10, // space for Ollie to peek
  },
  tabBar: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopLeftRadius:30,
    borderTopRightRadius:30,
    padding: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 2,
    width: '100%',
    alignSelf: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
    fontWeight: '600',
  },
});