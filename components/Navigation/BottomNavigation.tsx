import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { usePathname, router } from 'expo-router';
import { Home, Camera, Mic, Book, MessageSquare, MapPin } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export const BottomNavigation = () => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  
  const navigation = [
    {
      name: 'Home',
      path: '/',
      icon: (active) => <Home size={24} color={active ? '#FF6B00' : '#666'} />,
    },
    {
      name: 'Camera',
      path: '/camera',
      icon: (active) => <Camera size={24} color={active ? '#FF6B00' : '#666'} />,
    },
    {
      name: 'Voice',
      path: '/voice',
      icon: (active) => <Mic size={24} color={active ? '#FF6B00' : '#666'} />,
    },
    {
      name: 'Pathway',
      path: '/pathway',
      icon: (active) => <MapPin size={24} color={active ? '#FF6B00' : '#666'} />,
    },
    {
      name: 'Phrasebook',
      path: '/phrasebook',
      icon: (active) => <Book size={24} color={active ? '#FF6B00' : '#666'} />,
    },
    {
      name: 'Chat',
      path: '/conversation',
      icon: (active) => <MessageSquare size={24} color={active ? '#FF6B00' : '#666'} />,
    },
  ];

  const isActive = (path) => {
    if (path === '/' && pathname === '/(main)') return true;
    return pathname === `/(main)${path}`;
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 16 }]}>
      {navigation.map((item) => (
        <TouchableOpacity
          key={item.name}
          style={styles.tab}
          onPress={() => router.navigate(item.path)}
          activeOpacity={0.7}
        >
          {item.icon(isActive(item.path))}
          <Text
            style={[
              styles.tabText,
              isActive(item.path) && styles.activeTabText,
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    width: '100%',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
  activeTabText: {
    fontWeight: '600',
    color: '#FF6B00',
  },
});
