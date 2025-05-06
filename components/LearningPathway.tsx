import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, Image, Text, Pressable } from 'react-native';
import { PathwayNode } from './Pathway/PathwayNode';
import { PathSegment } from './Pathway/PathSegment';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const NODE_SIZE = 70;
const VERTICAL_SPACING = 180;
const catSayingHi = require('../assets/images/cat-sayinghi.png');
const catThinking = require('../assets/images/cat-thinking.png');
const catLaughing = require('../assets/images/cat-laughing.png');
const catSleeping = require('../assets/images/cat-sleeping.png');
const catLicking = require('../assets/images/cat-licking.png');
const catTranslating = require('../assets/images/cat-translating.png');
const catPointing = require('../assets/images/cat-pointing.png');
const catMeowing = require('../assets/images/cat-meowing.png');
const catPhoto = require('../assets/images/cat-photo.png');
const catSleeping2 = require('../assets/images/cat-sleeping2.png');
const catCelebrating = require('../assets/images/cat-celebrating.png');
const catFixing = require('../assets/images/cat-fixing.png');
const catPointing2 = require('../assets/images/cat-pointing2.png');
const catReading = require('../assets/images/cat-reading.png');
const catSmiling = require('../assets/images/cat-smiling.png');


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
  { text: 'Γεια σας', language: 'Greek' },
  { text: 'Salam', language: 'Farsi' },
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
    { level: 7, image: catLicking, side: 'right' },
    { level: 3, image: catSleeping, side: 'right' },
    { level: 10, image: catPointing, side: 'left' },
    { level: 8, image: catSleeping2, side: 'left' },
    { level: 5, image: catPhoto, side: 'right' },
    { level: 4, image: catMeowing, side: 'left' },
    { level: 2, image: catTranslating, side: 'left' },
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
  console.log("--- LearningPathway ---");
  console.log("Props: questions.length:", questions.length, "currentLevel:", currentLevel, "totalQuestions:", totalQuestions);
  if (questions.length > 0 && questions.length < 10) {
    console.log("Sample questions:", JSON.stringify(questions.slice(0, 5).map(q => ({id: q.id})))); // Log only IDs for brevity
  } else if (questions.length === 0) {
    console.log("Props: questions array is empty.");
  }

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const NODES_COUNT = questions.length; // Total actual questions available in the passed array
  const effectiveTotalQuestions = totalQuestions || NODES_COUNT;

  // Clamp currentLevel to be within the bounds of effectiveTotalQuestions for window calculation
  // This ensures that if currentLevel is, e.g., 13 but total questions is only 10, we use 10 for calculation,
  // effectively showing the last available page.
  const clampedCurrentLevelForWindowCalc = Math.max(1, Math.min(currentLevel, effectiveTotalQuestions));

  // Calculate the current window of 10 nodes using the clamped level
  const windowStart = Math.floor((clampedCurrentLevelForWindowCalc - 1) / 10) * 10 + 1;
  const windowEnd = Math.min(windowStart + 9, effectiveTotalQuestions);
  
  const NODES_COUNT_WINDOW = Math.max(0, windowEnd - windowStart + 1);

  console.log("Clamped Current Level for Window Calc:", clampedCurrentLevelForWindowCalc);
  console.log("Recalculated Window: windowStart:", windowStart, "windowEnd:", windowEnd, "NODES_COUNT_WINDOW:", NODES_COUNT_WINDOW);

  const totalPathHeight = NODES_COUNT_WINDOW * VERTICAL_SPACING + 200;
  console.log("Path Height: totalPathHeight:", totalPathHeight);

  // Generate nodes for the current window
  const nodes = Array.from({ length: NODES_COUNT_WINDOW }, (_, i) => {
    const nodeId = windowStart + i; 
    const questionData = questions.find(q => q.id === nodeId);

    let horizontalPosition;
    if (i % 2 === 0) {
      horizontalPosition = Math.max(insets.left, 10) + width * (0.15 + (Math.random() * 0.1));
    } else {
      const rightEdge = width - Math.max(insets.right, 10);
      horizontalPosition = rightEdge - width * (0.15 + (Math.random() * 0.1));
    }
    const verticalOffset = (Math.random() * 30) - 15;
    const y = 80 + (i * VERTICAL_SPACING) + verticalOffset; 

    let status: 'locked' | 'current' | 'completed' = 'locked';
    if (nodeId < currentLevel) status = 'completed';
    else if (nodeId === currentLevel) status = 'current';

    return {
      id: nodeId,
      position: { x: horizontalPosition, y },
      status,
      question: questionData, 
    };
  });

  console.log("Generated nodes.length:", nodes.length);
  if (nodes.length > 0 && nodes.length < 5) { // Log sample of generated nodes
    console.log("Sample generated nodes:", JSON.stringify(nodes.slice(0,3).map(n => ({id: n.id, status: n.status, questionId: n.question?.id }))));
  } else if (nodes.length === 0 && NODES_COUNT_WINDOW > 0) {
    console.error("WARNING: NODES_COUNT_WINDOW is > 0 but generated nodes array is empty. Check Array.from logic or question data.");
  } else if (nodes.length === 0 && NODES_COUNT_WINDOW === 0) {
    console.log("Generated nodes array is empty because NODES_COUNT_WINDOW is 0.");
  }

  // Use all mascot images at different levels
  const mascotData = [
    { level: 1, image: catSayingHi, side: 'right' },
    { level: 2, image: catThinking, side: 'left' },
    { level: 3, image: catLaughing, side: 'right' },
    { level: 4, image: catSleeping, side: 'left' },
    { level: 5, image: catLicking, side: 'right' },
    { level: 6, image: catTranslating, side: 'left' },
    { level: 7, image: catPointing, side: 'right' },
    { level: 8, image: catMeowing, side: 'left' },
    { level: 9, image: catPhoto, side: 'right' },
    { level: 10, image: catSleeping2, side: 'left' },
    { level: 11, image: catCelebrating, side: 'right' },
    { level: 12, image: catFixing, side: 'left' },
    { level: 13, image: catPointing2, side: 'right' },
    { level: 14, image: catReading, side: 'left' },
    { level: 15, image: catSmiling, side: 'right' },
  ];

  const mascotAvatars = mascotData.map(({ level, image, side }) => {
    const node = nodes.find(n => n.id === level);
    if (!node) return null;
    return (
      <Image
        key={`mascot-avatar-${level}`}
        source={image}
        style={{
          position: 'absolute',
          top: node.position.y + 10,
          [side]: 18,
          width: 70,
          height: 70,
          zIndex: 5,
        }}
        resizeMode="contain"
      />
    );
  });

  // Auto-scroll to current node on mount or when nodes/currentLevel change
  useEffect(() => {
    if (!scrollRef.current || !nodes || nodes.length === 0) return;
    
    const currentIdx = nodes.findIndex(n => n.status === 'current');
    if (currentIdx !== -1) {
      // Ensure the node exists before trying to access its position
      const currentNode = nodes[currentIdx];
      if (currentNode && currentNode.position) {
        const y = currentNode.position.y - 200; // Scroll to bring it into view
        scrollRef.current.scrollTo({ y: Math.max(0, y), animated: true });
      }
    } else if (nodes.length > 0) {
      // If no current node in this window (e.g. currentLevel is outside this window after some logic error)
      // scroll to top of this window. Or, if currentLevel is before this window, scroll to top.
      // If currentLevel is after this window, scroll to bottom (or last node).
      // For simplicity, if current is not found, scroll to the top of the current window's content.
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [nodes, currentLevel]); // Depend on 'nodes' array and currentLevel

  // Progress indicator (boxes for each node in the window)
  const progressBoxes = Array.from({ length: NODES_COUNT_WINDOW }, (_, i) => {
    const level = windowStart + i;
    const isCompleted = level < currentLevel;
    const isCurrent = level === currentLevel;
    return (
      <View key={i} style={{
        alignItems: 'center', marginHorizontal: 1
      }}>
        <View style={{
          width: 22, height: 22, borderRadius: 6, marginHorizontal: 3,
          backgroundColor: isCompleted || isCurrent ? '#FF6B00' : '#F0F0F0',
          borderWidth: isCurrent ? 2 : 0,
          borderColor: isCurrent ? '#222' : undefined,
          alignItems: 'center', justifyContent: 'center',
        }}>
          {isCompleted && <Ionicons name="checkmark" size={16} color="#fff" />}
          {isCurrent && !isCompleted && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' }} />}
          {!isCompleted && !isCurrent && <View />}
        </View>
        <Text style={{ fontSize: 13, color: '#FF6B00', fontWeight: 'bold', marginTop: 1 }}>{level}</Text>
      </View>
    );
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top', 'left', 'right']}> 
      {/* App Bar/Header */}
      <View style={{
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderBottomColor: '#eee',
        zIndex: 10,
        paddingTop: 8,
        paddingBottom: 0,
        paddingHorizontal: 0,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 2 }}>
       
          <Text style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: '#FF6B00',
            flex: 1,
            textAlign: 'center',
            letterSpacing: 0.5,
            textShadowColor: '#fff2',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4,
          }} numberOfLines={1}>
            Your Language Learning
          </Text>
        </View>
        {/* Progress indicator row with arrows and numbers */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 6 }}>
          {/* Optionally add navigation arrows here if you want to allow window navigation */}
          {progressBoxes}
        </View>
      </View>
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
        {console.log("Rendering ScrollView content... Nodes to map:", nodes.length)}
        {/* Mascot avatars at various levels */}
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
        {/* Pathway nodes */}
        {nodes.map((node, index) => (
          <View // Replaced MotiView with a regular View for debugging
            key={`node-${node.id}`}
            style={[styles.nodeContainer, { left: node.position.x, top: node.position.y }]}
            // from={{ opacity: 0, scale: 0 }} // MotiView props removed
            // animate={{ opacity: 1, scale: 1 }} // MotiView props removed
            // transition={{ // MotiView props removed
            //   type: 'spring',
            //   delay: 300 + index * 100,
            //   damping: 15
            // }}
          >
            <PathwayNode
              id={node.id}
              status={node.status}
              onPress={() => {
                if (node.status !== 'locked' && node.question) { // Ensure question exists before navigating
                  router.navigate({
                    pathname: `/challenge/${node.id}`,
                    params: {
                      question: JSON.stringify(node.question),
                      allQuestions: JSON.stringify(questions), // Pass the original full questions list
                      currentLevel: currentLevel,
                    },
                  });
                } else if (node.status !== 'locked') {
                  // Fallback or error logging if question is missing for an unlocked node
                  console.warn(`Node ${node.id} is active but has no question data.`);
                  // Optionally, still navigate or show a message
                  // router.navigate(`/challenge/${node.id}`); // Or some other behavior
                }
              }}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
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
