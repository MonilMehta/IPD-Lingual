import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Bell, Lock, LogOut } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons'; // Or any other icon set from expo/vector-icons


const SettingsScreen = ({ navigation }) => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);

  return (
    <SafeAreaView style={styles.container}>
    <View style={styles.header} >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF6B00" />
        </TouchableOpacity>
        <MotiView style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </MotiView>
      </View>
     

      <View style={styles.settingItem}>
        <Bell size={20} color="#666" />
        <Text style={styles.settingText}>Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={(value) => setNotificationsEnabled(value)}
        />
      </View>

      <TouchableOpacity style={styles.settingItem}>
        <Lock size={20} color="#666" />
        <Text style={styles.settingText}>Privacy & Security</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Login')}>
        <LogOut size={20} color="#666" />
        <Text style={styles.settingText}>Logout</Text>
      </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
});

export default SettingsScreen;
