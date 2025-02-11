import { View, Text } from "react-native";

export default function ObjectBox({ class: label, score, marginLeft, marginTop, width, height }) {
  return (
    <View
      style={{
        position: "absolute",
        marginLeft: marginLeft,
        marginTop: marginTop,
        width: width,
        height: height,
        borderWidth: 2,
        borderColor: "red",
        borderRadius: 4,
      }}
    >
      <Text
        style={{
          backgroundColor: "red",
          color: "white",
          fontSize: 12,
          padding: 2,
          borderRadius: 4,
        }}
      >
        {`${label} ${(score * 100).toFixed(1)}%`}
      </Text>
    </View>
  );
}
