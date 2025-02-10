import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";

export function LoadingView({ message = "Loading..." }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF6B00" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: "black",
  },
});
