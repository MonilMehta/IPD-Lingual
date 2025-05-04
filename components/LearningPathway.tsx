import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Image, Text, Pressable } from 'react-native';
import { PathwayNode } from './Pathway/PathwayNode';
import { PathSegment } from './Pathway/PathSegment';
import { FloatingText } from './Pathway/FloatingText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const NODE_SIZE = 70;
const VERTICAL_SPACING = 180;
const MASCOT_IMAGE = require('../assets/images/cat-smiling.png');
import catSayingHi from '../assets/images/cat-sayinghi.jpg';
import catThinking from '../assets/images/cat-thinking.png';
import catLaughing from '../assets/images/cat-laughing.jpg';

// Sample phrases for floating text
const samplePhrases = [
  { text: 'Hello', language: 'English' },
  { text: 'Hola', language: 'Spanish' },
  { text: 'Bonjour', language: 'French' },
  { text: 'Ciao', language: 'Italian' },
  { text: 'こんにちは', language: 'Japanese' },
  { text: '안녕하세요', language: 'Korean' },
  { text: '你好', language: 'Chinese' },
  { text: 'Hallo', language: 'German' },
  { text: 'Olá', language: 'Portuguese' },
  { text: 'Привет', language: 'Russian' },
  { text: 'नमस्ते', language: 'Hindi' },
  { text: 'مرحبا', language: 'Arabic' },
  { text: 'Sawubona', language: 'Zulu' },
  { text: 'Γεια σας', language: 'Greek' },
  { text: 'สวัสดี', language: 'Thai' },
  { text: 'Xin chào', language: 'Vietnamese' },
  { text: 'Salam', language: 'Farsi' },
  { text: 'Здраво', language: 'Serbian' },
  { text: 'Merhaba', language: 'Turkish' },
  { text: 'שלום', language: 'Hebrew' },
];

const wouldOverlap = (newPos, existingPositions, phraseSize = 80, minDistance = 100) => {
  for (const pos of existingPositions) {
    const dx = newPos.x - pos.x;
    const dy = newPos.y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < minDistance) {
      return true;
    }
  }
  return false;
};

const generateFloatingPhrases = (count, safeAreaPadding = { left: 20, right: 20 }, totalPathHeight = 2000, nodeBand = { left: 0.32, right: 0.68 }) => {
  const positions = [];
  const phrases = [];
  const gridSize = 100;
  const colorOptions = [
    '#FF6B00', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#FFC107', '#795548', '#009688', '#673AB7',
  ];
  const maxTextWidth = 120;
  const leftBoundary = safeAreaPadding.left + 20;
  const rightBoundary = width - safeAreaPadding.right - maxTextWidth - 20;
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let validPosition = false;
    let x, y, gridKey;
    while (!validPosition && attempts < 30) {
      // Only allow floating text on left or right side, not in the center band
      if (Math.random() < 0.5) {
        // Left band
        x = leftBoundary + Math.random() * (width * nodeBand.left - leftBoundary);
      } else {
        // Right band
        x = width * nodeBand.right + Math.random() * (rightBoundary - width * nodeBand.right);
      }
      y = 100 + Math.random() * (totalPathHeight - 200);
      const gridX = Math.floor(x / gridSize);
      const gridY = Math.floor(y / gridSize);
      gridKey = `${gridX},${gridY}`;
      let isGridCellFree = true;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const checkKey = `${gridX + dx},${gridY + dy}`;
          if (positions.some(pos => `${Math.floor(pos.x / gridSize)},${Math.floor(pos.y / gridSize)}` === checkKey)) {
            isGridCellFree = false;
            break;
          }
        }
        if (!isGridCellFree) break;
      }
      if (isGridCellFree && !wouldOverlap({ x, y }, positions)) {
        validPosition = true;
      }
      attempts++;
    }
    if (validPosition) {
      const phrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
      const size = Math.random() < 0.8 ? 'small' : (Math.random() < 0.95 ? 'medium' : 'large');
      const rotation = (Math.random() * 16) - 8;
      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      phrases.push({
        ...phrase,
        id: `floating-${i}`,
        position: { x, y },
        size,
        rotation,
        color
      });
      positions.push({ x, y });
    }
  }
  return phrases;
};

// Helper to inject mascot bubbles at intervals
function injectMascotBubbles(floatingPhrases, mascotImage) {
  const mascotIntervals = [3, 6, 10];
  const mascotBubbles = [];
  mascotIntervals.forEach((interval, idx) => {
    if (floatingPhrases.length > interval) {
      // Place mascot on the opposite side (if text is left, mascot is right, and vice versa)
      const refPhrase = floatingPhrases[interval];
      const mascotX = refPhrase.position.x < width / 2
        ? width * 0.85
        : width * 0.08;
      mascotBubbles.push({
        id: `mascot-bubble-${interval}`,
        mascotImage,
        position: { x: mascotX, y: refPhrase.position.y + 18 },
        rotation: (Math.random() * 16) - 8,
      });
    }
  });
  // Merge mascot bubbles into floating phrases array
  let result = [...floatingPhrases];
  mascotBubbles.forEach((bubble, i) => {
    result.splice(mascotIntervals[i], 0, bubble);
  });
  return result;
}

// Helper to render mascot avatars at specific levels
function renderMascotAvatars(nodes) {
  // Show mascot at level 9 (cat-laughing, right), 6 (cat-thinking, left), 1 (cat-sayinghi, right)
  const mascotAvatars = [];
  const mascotData = [
    { level: 9, image: catLaughing, side: 'right' },
    { level: 6, image: catThinking, side: 'left' },
    { level: 1, image: catSayingHi, side: 'right' },
  ];
  mascotData.forEach(({ level, image, side }) => {
    const node = nodes.find(n => n.id === level);
    if (node) {
      mascotAvatars.push({
        key: `mascot-avatar-${level}`,
        image,
        y: node.position.y + 10,
        side,
      });
    }
  });
  return mascotAvatars.map(({ key, image, y, side }) => (
    <Image
      key={key}
      source={image}
      style={[
        {
          position: 'absolute',
          top: y,
          [side]: 18,
          width: 90,
          height: 90,
          zIndex: 5,
        },
      ]}
      resizeMode="contain"
    />
  ));
}

export const LearningPathway = ({ questions = [], currentLevel = 1, totalQuestions }) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef(null);
  const NODES_COUNT = questions.length;
  const totalPathHeight = NODES_COUNT * VERTICAL_SPACING + 200;
  const [floatingPhrases] = useState(() =>
    generateFloatingPhrases(40, {
      left: Math.max(insets.left, 10),
      right: Math.max(insets.right, 10)
    }, totalPathHeight, { left: 0.0, right: 0.82 })
  );

  // Reverse nodes: start at bottom, move up
  const nodes = Array.from({ length: NODES_COUNT }, (_, i) => {
    const row = NODES_COUNT - 1 - i; // reverse order
    let horizontalPosition;
    if (row % 2 === 0) {
      horizontalPosition = Math.max(insets.left, 10) + width * (0.15 + (Math.random() * 0.1));
    } else {
      const rightEdge = width - Math.max(insets.right, 10);
      horizontalPosition = rightEdge - width * (0.15 + (Math.random() * 0.1));
    }
    const verticalOffset = (Math.random() * 30) - 15;
    // Start at bottom, move up
    const y = 80 + (i * VERTICAL_SPACING) + verticalOffset;
    let status = 'locked';
    if (row + 1 < currentLevel) status = 'completed';
    else if (row + 1 === currentLevel) status = 'current';
    return {
      id: row + 1,
      position: { x: horizontalPosition, y },
      status,
    };
  });

  // Remove mascot bubbles from floating text, only render avatars at nodes
  const mascotAvatars = renderMascotAvatars(nodes);

  // Auto-scroll to current node on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const currentIdx = nodes.findIndex(n => n.status === 'current');
    if (currentIdx !== -1) {
      const y = nodes[currentIdx].position.y - 200; // scroll so current node is visible, with some offset
      scrollRef.current.scrollTo({ y: Math.max(0, y), animated: true });
    }
  }, [NODES_COUNT]);

  // Progress bar width
  const progress = NODES_COUNT > 0 ? (currentLevel / NODES_COUNT) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* App Bar/Header - fixed at top, respects safe area */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: insets.top + 8,
        paddingBottom: 10,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        zIndex: 10,
      }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ marginRight: 8 }}>
          <Ionicons name="arrow-back" size={26} color="#222" />
        </Pressable>
        <Text style={{ fontSize: 21, fontWeight: 'bold', color: '#222', flex: 1 }} numberOfLines={1}>
          Your Language Journey
        </Text>
      </View>
      {/* Vertical progress bar, always visible on the right */}
      {NODES_COUNT > 0 && (
        <View style={{
          position: 'absolute',
          right: 8,
          top: insets.top + 60,
          bottom: 24,
          width: 12,
          justifyContent: 'flex-start',
          alignItems: 'center',
          zIndex: 20,
          pointerEvents: 'none',
        }}>
          <View style={{
            width: 6,
            flex: 1,
            backgroundColor: '#F0F0F0',
            borderRadius: 3,
            overflow: 'hidden',
            marginVertical: 8,
            justifyContent: 'flex-end',
          }}>
            <View style={{
              width: 6,
              height: `${progress * 100}%`,
              backgroundColor: '#FF6B00',
              borderRadius: 3,
              position: 'absolute',
              bottom: 0,
              left: 0,
            }} />
          </View>
        </View>
      )}
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          { height: totalPathHeight }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Floating phrases as simple rectangles */}
        {floatingPhrases.map((phrase) => (
          <FloatingText
            key={phrase.id}
            text={phrase.text}
            language={phrase.language}
            position={phrase.position}
            size={phrase.size}
            rotation={phrase.rotation}
            color={phrase.color}
          />
        ))}
        {/* Mascot avatars at top, middle, bottom */}
        {mascotAvatars}

        {/* Path segments */}
        {nodes.map((node, index) => {
          if (index === nodes.length - 1) return null;
          const nextNode = nodes[index + 1];
          const isCompleted = node.status === 'completed' && nextNode.status !== 'locked';
          return (
            <PathSegment
              key={`path-${node.id}`}
              start={node.position}
              end={nextNode.position}
              isCompleted={isCompleted}
              animationDelay={index * 100}
            />
          );
        })}

        {/* Pathway nodes and mascot */}
        {nodes.map((node, index) => (
          <MotiView
            key={`node-${node.id}`}
            style={[styles.nodeContainer, { left: node.position.x, top: node.position.y }]}
            from={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: 'spring',
              delay: 300 + index * 100,
              damping: 15
            }}
          >
            <PathwayNode
              id={node.id}
              status={node.status}
              onPress={() => {
                if (node.status !== 'locked') {
                  // Use correct route for your file structure
                  router.push(`/challenge/${node.id}`);
                }
              }}
            />
          </MotiView>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    position: 'relative',
    width: '100%',
  },
  nodeContainer: {
    position: 'absolute',
    width: NODE_SIZE,
    height: NODE_SIZE + 40,
    marginLeft: -NODE_SIZE / 2,
    marginTop: -NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  mascot: {
    position: 'absolute',
    bottom: -40,
    left: '50%',
    width: 60,
    height: 60,
    marginLeft: -30,
    zIndex: 10,
  },
});
