import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Home, BookOpen, Compass } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';

const TABS = [
  { name: 'Home', icon: Home, route: '/(main)/home' },
  { name: 'Learn', icon: BookOpen, route: '/(main)/learn' },
  { name: 'Guides', icon: Compass, route: '/(main)/guides' },
];

export const FloatingTabBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <View style={tabBarStyles.tabBar}>
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = pathname === tab.route;
        return (
          <TouchableOpacity
            key={tab.name}
            style={tabBarStyles.tabButton}
            onPress={() => router.navigate(tab.route)}
            activeOpacity={0.8}
          >
            <Icon size={26} color={isActive ? '#FF6B00' : '#888'} />
            <Text style={[tabBarStyles.tabLabel, isActive && { color: '#FF6B00' }]}>{tab.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const tabBarStyles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
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