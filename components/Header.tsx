import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { API_URL } from '../config/constants';
import SkeletonLoader from '../screens/HomePage/DailyQuiz';

type HeaderProps = {
  title: string;
  showBackButton?: boolean;
  progress?: number;
  rightElement?: React.ReactNode;
  onBackPress?: () => void;
};

function capitalizeFirstLetter(str: string) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const Header = ({ 
  title, 
  showBackButton = false, 
  progress, 
  rightElement, 
  onBackPress 
}: HeaderProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; level: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchUser() {
      setLoading(true);
      try {
        const token = await import('../services/Auth').then(m => m.getToken());
        const res = await fetch(`${API_URL}/api/homepage`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch homepage');
        const data = await res.json();
        if (isMounted) setUser({ name: data.name, level: data.current_level });
      } catch {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchUser();
    return () => { isMounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.headerContent}>
        <View style={styles.leftLogoContainer}>
          <Image source={require('../assets/images/logo-cat.png')} style={styles.logoCat} />
          <Image source={require('../assets/images/logo-text.png')} style={styles.logoText} />
        </View>
        <View style={styles.rightUserContainer}>
          {loading ? (
            <SkeletonLoader />
          ) : user ? (
            <>
              <Text style={styles.helloText} numberOfLines={1}>
                Hello, {capitalizeFirstLetter(user.name)}
              </Text>
              <Text style={styles.levelText}>Level {user.level}</Text>
            </>
          ) : (
            <Text style={styles.helloText}>Hello</Text>
          )}
        </View>
      </View>
      {progress !== undefined && (
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${progress * 100}%` }
            ]} 
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
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
    height: 28,
    resizeMode: 'contain',
  },
  rightUserContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 100,
  },
  helloText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  levelText: {
    fontSize: 13,
    color: '#FF6B00',
    fontWeight: '500',
    marginTop: 2,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 2,
  },
});
