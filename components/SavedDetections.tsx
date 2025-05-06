import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import DetectionCard from './DetectionCard';
import { Colors } from '../constants/Colors';
import { getToken } from '../services/Auth';
import { Snackbar } from 'react-native-paper';

const mascots = [
  require('../assets/images/cat-smiling.png'),
  require('../assets/images/cat-sayinghi.png'),
  require('../assets/images/cat-pointing.png'),
  require('../assets/images/cat-laughing.png'),
  require('../assets/images/cat-sleeping.png'),
  require('../assets/images/cat-thinking.png'),
];

interface Detection {
  _id: string;
  label: string;
  translated_label: string;
  timestamp: string;
}

const API_URL = process.env.EXPO_PUBLIC_SERVER || 'https://lingual-yn5c.onrender.com';

const SavedDetections: React.FC = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const fetchDetections = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken(); // Implement getToken to retrieve bearer token
        const res = await fetch(`${API_URL}/api/detections`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setDetections(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching detections');
      } finally {
        setLoading(false);
      }
    };
    fetchDetections();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={Colors.light.tint} />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!detections.length) return <Text style={styles.empty}>No saved detections found.</Text>;

  return (
    <View style={styles.bg}>
      <FlatList
        data={detections}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => (
          <DetectionCard
            label={item.label}
            translatedLabel={item.translated_label}
            timestamp={item.timestamp}
            mascot={mascots[index % mascots.length]}
          />
        )}
        contentContainerStyle={{ paddingVertical: 16 }}
      />
     
    </View>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  error: { color: 'red', textAlign: 'center', marginTop: 40 },
  empty: { color: '#888', textAlign: 'center', marginTop: 40, fontSize: 16 },
});

export default SavedDetections;
