import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

type Position = {
  x: number;
  y: number;
};

type PathSegmentProps = {
  start: Position;
  end: Position;
  isCompleted: boolean;
  animationDelay?: number;
};

export const PathSegment = ({ start, end, isCompleted, animationDelay = 0 }: PathSegmentProps) => {
  // Calculate the path between the two points with smoothed curves
  const createPath = () => {
    // Calculate horizontal and vertical distances
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    
    // Control points for bezier curve
    // Make smoother curves by setting control points further from nodes
    const cp1x = start.x;
    const cp1y = start.y + dy * 0.5;
    const cp2x = end.x;
    const cp2y = end.y - dy * 0.5;
    
    return `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`;
  };
  
  const pathData = createPath();
  
  // Calculate container dimensions with some padding
  const minX = Math.min(start.x, end.x) - 30;
  const minY = Math.min(start.y, end.y) - 30;
  const maxX = Math.max(start.x, end.x) + 30;
  const maxY = Math.max(start.y, end.y) + 30;
  
  const svgWidth = maxX - minX;
  const svgHeight = maxY - minY;

  // Translate path coordinates to be relative to container
  const adjustedStart = {
    x: start.x - minX,
    y: start.y - minY
  };
  
  const adjustedEnd = {
    x: end.x - minX,
    y: end.y - minY
  };

  // Create adjusted path with the same controls
  const createAdjustedPath = () => {
    const dx = adjustedEnd.x - adjustedStart.x;
    const dy = adjustedEnd.y - adjustedStart.y;
    
    const cp1x = adjustedStart.x;
    const cp1y = adjustedStart.y + dy * 0.5;
    const cp2x = adjustedEnd.x;
    const cp2y = adjustedEnd.y - dy * 0.5;
    
    return `M ${adjustedStart.x} ${adjustedStart.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${adjustedEnd.x} ${adjustedEnd.y}`;
  };

  const adjustedPathData = createAdjustedPath();

  return (
    <View style={[
      styles.container, 
      {
        left: minX,
        top: minY,
        width: svgWidth,
        height: svgHeight,
      }
    ]}>
      <Svg width="100%" height="100%">
        <Path
          d={adjustedPathData}
          stroke="#D0D0D0"
          strokeWidth={16}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      
      {isCompleted && (
        <MotiView
          style={StyleSheet.absoluteFill}
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            type: 'timing',
            duration: 800,
            easing: Easing.out(Easing.ease),
            delay: animationDelay,
          }}
        >
          <Svg width="100%" height="100%">
            <Path
              d={adjustedPathData}
              stroke="#4CAF50"
              strokeWidth={16}
              fill="none"
              strokeLinecap="round"
            />
          </Svg>
        </MotiView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1,
    overflow: 'visible',
  },
});
