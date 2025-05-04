import React from 'react';
import { Platform } from 'react-native';
import { View, Text,TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MotiView } from 'moti';
import { Bell, User } from 'lucide-react-native';
// import { SearchBar } from 'react-native-screens';
import { Search } from 'lucide-react-native';


const SearchBar = () => {
  return (
    <View style={styles.searchContainer}>
      <Search size={20} color="#666" />
      <TextInput 
        style={styles.searchInput} 
        placeholder="Search phrases, translations..." 
        placeholderTextColor="#999" 
      />
    </View>
  );
};

export const Header = ({ navigation }) => {
  const username = "Alex";
  // You can replace this with an actual profile image
  const hasProfileImage = false;

  return (
    <MotiView
      from={{ opacity: 0, translateY: -20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 600 }}
    >
      <View style={styles.header}>
        <MotiView 
          from={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 200 }}
          style={styles.greetingContainer}
        >
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.username}>{username}</Text>
        </MotiView>
        
        <View style={styles.iconsContainer}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Notifications')} 
            style={styles.iconButton}
          >
            <Bell size={20} color="#666" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile')} 
            style={styles.profileButton}
          >
            {hasProfileImage ? (
              <Image 
                source={{ uri: 'https://example.com/profile-image.jpg' }} 
                style={styles.profileImage}
              />
            ) : (
              <User size={22} color="#FF6B00" />
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 300, duration: 500 }}
      >
        <SearchBar />
      </MotiView>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 20,
    paddingHorizontal: 8,
  },
  greetingContainer: {
    flexDirection: 'column',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
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
      ...(Platform.OS === 'web' && {
        outlineStyle: 'none',
      }),
    },
  notificationBadge: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B00',
    top: 12,
    right: 12,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 0, 0.2)',
  },
  profileImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});