import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { User, Mail, Edit3, Phone } from 'lucide-react-native';

const ProfileScreen = ({ navigation }) => {
  const username = "Alex"; // Replace with actual username from authentication

  return (
    <SafeAreaView style={styles.container}>
      <MotiView style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
          <User size={24} color="#FF6B00" />
        </TouchableOpacity>
      </MotiView>

      <ScrollView contentContainerStyle={styles.content}>
        <MotiView style={styles.profileContainer}>
          <User size={80} color="#4CAF50" />
          <Text style={styles.username}>{username}</Text>
        </MotiView>

        <View style={styles.infoContainer}>
          <Mail size={20} color="#666" />
          <TextInput style={styles.infoText} placeholder="Email Address" placeholderTextColor="#999" />
        </View>

        <View style={styles.infoContainer}>
          <Phone size={20} color="#666" />
          <TextInput style={styles.infoText} placeholder="Phone Number" placeholderTextColor="#999" />
        </View>

        <View style={styles.infoContainer}>
          <Edit3 size={20} color="#666" />
          <TextInput style={styles.infoText} placeholder="Bio" placeholderTextColor="#999" multiline />
        </View>

        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  goBackButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  saveButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ProfileScreen;
