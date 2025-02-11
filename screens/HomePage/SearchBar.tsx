import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Search } from 'lucide-react-native';

export const SearchBar = () => {
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

const styles = StyleSheet.create({
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
});