import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, SafeAreaView, Platform } from 'react-native';
import { PathwayNode } from './PathwayNode';
import { PathSegment } from './PathSegment';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { FloatingText } from './FloatingText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const NODE_SIZE = 70;
const VERTICAL_SPACING = 180;

// Sample phrases in different languages
const samplePhrases = [
  { text: "Hello", language: "English" },
  { text: "Hola", language: "Spanish" },
  { text: "Bonjour", language: "French" },
  { text: "Ciao", language: "Italian" },
  { text: "こんにちは", language: "Japanese" },
  { text: "안녕하세요", language: "Korean" },
  { text: "你好", language: "Chinese" },
  { text: "Hallo", language: "German" },
  { text: "Olá", language: "Portuguese" },
  { text: "Привет", language: "Russian" },
  { text: "नमस्ते", language: "Hindi" },
  { text: "مرحبا", language: "Arabic" },
  { text: "Sawubona", language: "Zulu" },
  { text: "Γεια σας", language: "Greek" },
  { text: "สวัสดี", language: "Thai" },
  { text: "Xin chào", language: "Vietnamese" },
  { text: "Salam", language: "Farsi" },
  { text: "Здраво", language: "Serbian" },
  { text: "Merhaba", language: "Turkish" },
  { text: "שלום", language: "Hebrew" },
];

// Calculate the total path height in advance for better planning
const totalPathHeight = 20 * VERTICAL_SPACING + 200;

// Function to check if two phrases would overlap
const wouldOverlap = (newPos, existingPositions, phraseSize = 80, minDistance = 100) => {
  for (const pos of existingPositions) {
    const dx = newPos.x - pos.x;
    const dy = newPos.y - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < minDistance) {
      return true; // Would overlap
    }
  }
  return false; // No overlap
};

// Generate floating phrases with safe area considerations
const generateFloatingPhrases = (count, safeAreaPadding = { left: 20, right: 20 }) => {
  const positions = [];
  const phrases = [];
  const gridSize = 100; // Size of each grid cell to avoid overcrowding
  
  // Create a grid to track occupied spaces
  const grid = {};
  
  // Prepare colors for phrases
  const colorOptions = [
    '#FF6B00', // Orange
    '#4CAF50', // Green
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#E91E63', // Pink
    '#FFC107', // Amber
    '#795548', // Brown
    '#009688', // Teal
    '#673AB7', // Deep Purple
  ];
  
  // Calculate maximum text width based on screen size
  const maxTextWidth = 120; // Approximate max width of a text bubble
  
  // Define safe area boundaries
  const leftBoundary = safeAreaPadding.left + 20;
  const rightBoundary = width - safeAreaPadding.right - maxTextWidth - 20;
  
  // Try to place phrases without overlapping
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let validPosition = false;
    let x, y, gridKey;
    
    // Try up to 20 times to find a non-overlapping spot
    while (!validPosition && attempts < 20) {
      // Generate position, ensuring phrases stay within safe horizontal boundaries
      if (attempts % 2 === 0) {
        // Left side - ensure enough padding from screen edge
        x = leftBoundary + Math.random() * (width * 0.25);
      } else {
        // Right side - ensure phrases don't go off-screen
        x = width * 0.6 + Math.random() * (rightBoundary - width * 0.6);
      }
      
      y = 100 + Math.random() * (totalPathHeight - 200);
      
      // Get grid cell for this position
      const gridX = Math.floor(x / gridSize);
      const gridY = Math.floor(y / gridSize);
      gridKey = `${gridX},${gridY}`;
      
      // Check if this grid cell or adjacent cells are occupied
      let isGridCellFree = true;
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const checkKey = `${gridX + dx},${gridY + dy}`;
          if (grid[checkKey]) {
            isGridCellFree = false;
            break;
          }
        }
        if (!isGridCellFree) break;
      }
      
      // If grid check passed, also check precise positions
      if (isGridCellFree && !wouldOverlap({x, y}, positions)) {
        validPosition = true;
        grid[gridKey] = true;
      }
      
      attempts++;
    }
    
    // If we found a valid position, add the phrase
    if (validPosition) {
      const phrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
      // Adjust sizes - more small phrases to ensure they don't go off screen
      const size = Math.random() < 0.8 ? 'small' : (Math.random() < 0.95 ? 'medium' : 'large');
      // Limit rotation to avoid text going outside its container
      const rotation = (Math.random() * 16) - 8; // Random rotation between -8 and 8 degrees
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

// Instead of random floating text, set positions explicitly per level
function generateLevelFloatingTexts(nodes) {
  // Map: level -> { side: 'left' | 'right' | 'none' }
  const levelFloatingMap = {
    1: 'none',
    2: 'right',
    3: 'none',
    4: 'left',
    5: 'right',
    6: 'none',
    7: 'right',
    8: 'left',
    9: 'none',
    10: 'left',
  };
  const offsetX = 120; // horizontal offset from node
  const offsetY = 40;  // vertical offset below node
  const phrases = [];
  let phraseIdx = 0;
  nodes.forEach((node, idx) => {
    const level = node.id;
    const side = levelFloatingMap[level];
    if (!side || side === 'none') return;
    const sample = samplePhrases[phraseIdx % samplePhrases.length];
    phraseIdx++;
    const x = side === 'left' ? node.position.x - offsetX : node.position.x + offsetX;
    const y = node.position.y + offsetY;
    phrases.push({
      ...sample,
      id: `floating-lvl${level}`,
      position: { x, y },
      size: 'large',
      rotation: 0,
      color: undefined,
    });
  });
  return phrases;
}

// Accept questions and currentLevel as props
export const PathwayMap = ({ questions = [], currentLevel = 1 }) => {
  const insets = useSafeAreaInsets();
  const NODES_COUNT = questions.length;
  const router = useRouter();

  // Pass safe area insets to the phrase generator
  const [floatingPhrases] = useState(() => 
    generateFloatingPhrases(40, {
      left: Math.max(insets.left, 10),
      right: Math.max(insets.right, 10)
    })
  );

  // Generate an array of challenge nodes with varying positions (flipped: lowest at top, highest at bottom)
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

  const handleNodePress = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node.status === 'locked') return;
    router.navigate(`/main/challenge/${nodeId}`);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={[
        styles.content, 
        { height: totalPathHeight }
      ]}
    >
      {/* Render floating phrases as background */}
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
      
      {/* Draw path segments */}
      {nodes.map((node, index) => {
        if (index === nodes.length - 1) return null; // Skip last node
        
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
      
      {/* Draw the nodes */}
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
            onPress={() => handleNodePress(node.id)}
          />
        </MotiView>
      ))}
    </ScrollView>
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
    height: NODE_SIZE,
    marginLeft: -NODE_SIZE / 2,
    marginTop: -NODE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});
