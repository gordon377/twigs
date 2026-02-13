import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Dimensions, View, StyleSheet, PanResponder } from 'react-native';
import Svg, { Line, Circle, Text, G } from 'react-native-svg';
import * as d3 from 'd3-force';

type NodeDatum = { id: string; name?: string; x?: number; y?: number; fx?: number; fy?: number; };
type LinkDatum = { source: string; target: string; };

export default function NetworkTree({
  nodes: initialNodes,
  links: initialLinks,
}: {
  nodes: NodeDatum[];
  links: LinkDatum[];
}) {
  const { width, height } = Dimensions.get('window');
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const simRef = useRef<d3.Simulation<NodeDatum, undefined> | null>(null);
  const nodesRef = useRef(initialNodes.map(n => ({ ...n })));
  const linksRef = useRef(initialLinks.map(l => ({ ...l })));

  // ViewBox state
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width, height });
  const viewBoxRef = useRef({ x: 0, y: 0, width, height });

  // Boundary constraints - proportional to screen size
  const BOUNDARY_MULTIPLIER = 2; // Allow panning 2x the screen size in each direction
  const minX = -width * BOUNDARY_MULTIPLIER;
  const minY = -height * BOUNDARY_MULTIPLIER;
  const maxX = width * (1 + BOUNDARY_MULTIPLIER);
  const maxY = height * (1 + BOUNDARY_MULTIPLIER);

  // Use ref to always have latest boundary constraint function
  const constrainViewBoxRef = useRef((vb: { x: number; y: number; width: number; height: number }) => vb);

  // Update the ref whenever boundaries change
  useLayoutEffect(() => {
    constrainViewBoxRef.current = (vb: { x: number; y: number; width: number; height: number }) => {
      const constrainedX = Math.max(minX, Math.min(maxX - vb.width, vb.x));
      const constrainedY = Math.max(minY, Math.min(maxY - vb.height, vb.y));
      return {
        x: constrainedX,
        y: constrainedY,
        width: vb.width,
        height: vb.height,
      };
    };
  }, [minX, minY, maxX, maxY]);

  // Keep viewBoxRef in sync with state - use useLayoutEffect for synchronous update
  useLayoutEffect(() => {
    viewBoxRef.current = viewBox;
  }, [viewBox]);

  // Gesture tracking
  const gestureStartRef = useRef({ x: 0, y: 0, width, height, scale: 1 });
  const isPinchingRef = useRef(false);
  const initialPinchDistance = useRef(0);

  // Initialize simulation
  useEffect(() => {
    const initialMap: Record<string, { x: number; y: number }> = {};
    nodesRef.current.forEach((n) => {
      initialMap[n.id] = {
        x: n.x ?? width / 2 + (Math.random() - 0.5) * 100,
        y: n.y ?? height / 2 + (Math.random() - 0.5) * 100,
      };
    });
    setPositions(initialMap);

    const simNodes = nodesRef.current.map(n => ({ ...n }));
    const simLinks = linksRef.current.map(l => ({ ...l }));

    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(150).strength(1))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force('collision', d3.forceCollide().radius(35))
      .force('x', d3.forceX(width / 2).strength(0.02))
      .force('y', d3.forceY(height / 2).strength(0.02))
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    sim.on('tick', () => {
      const next: Record<string, { x: number; y: number }> = {};
      const nodeRadius = 24;
      const nodePadding = nodeRadius + 10;
      for (const n of simNodes) {
        const x = Math.max(nodePadding, Math.min(width - nodePadding, n.x ?? width / 2));
        const y = Math.max(nodePadding, Math.min(height - nodePadding, n.y ?? height / 2));
        next[n.id] = { x, y };
        n.x = x;
        n.y = y;
      }
      setPositions(next);
    });

    simRef.current = sim;
    return () => {
      sim.stop();
      simRef.current = null;
    };
  }, [width, height]);

  // Calculate distance between two touches
  const getDistance = (touches: any[]) => {
    if (touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // PanResponder for handling touch gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;

        // Use the ref values which are always current
        gestureStartRef.current = {
          x: viewBoxRef.current.x,
          y: viewBoxRef.current.y,
          width: viewBoxRef.current.width,
          height: viewBoxRef.current.height,
          scale: width / viewBoxRef.current.width,
        };

        if (touches.length === 2) {
          isPinchingRef.current = true;
          initialPinchDistance.current = getDistance(Array.from(touches));
        } else {
          isPinchingRef.current = false;
          initialPinchDistance.current = 0;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length === 2) {
          // Pinch zoom
          const currentDistance = getDistance(Array.from(touches));

          // If we just started pinching (transitioned from 1 to 2 fingers), initialize the distance
          if (!isPinchingRef.current) {
            isPinchingRef.current = true;
            initialPinchDistance.current = currentDistance;
            // Update gesture start to current viewBox state
            gestureStartRef.current = {
              x: viewBoxRef.current.x,
              y: viewBoxRef.current.y,
              width: viewBoxRef.current.width,
              height: viewBoxRef.current.height,
              scale: width / viewBoxRef.current.width,
            };
            return; // Skip this frame to establish baseline
          }

          if (initialPinchDistance.current > 0 && currentDistance > 0) {
            // Calculate scale change
            const scaleRatio = currentDistance / initialPinchDistance.current;
            const newScale = Math.max(0.5, Math.min(3, gestureStartRef.current.scale * scaleRatio));
            const newWidth = width / newScale;
            const newHeight = height / newScale;

            // Get center point between fingers
            const centerX = (touches[0].pageX + touches[1].pageX) / 2;
            const centerY = (touches[0].pageY + touches[1].pageY) / 2;

            // Calculate the point in viewBox coordinates at gesture start
            const viewBoxCenterX = gestureStartRef.current.x + (centerX / width) * gestureStartRef.current.width;
            const viewBoxCenterY = gestureStartRef.current.y + (centerY / height) * gestureStartRef.current.height;

            // Keep that point centered
            const unconstrained = {
              x: viewBoxCenterX - (centerX / width) * newWidth,
              y: viewBoxCenterY - (centerY / height) * newHeight,
              width: newWidth,
              height: newHeight,
            };

            const newViewBox = constrainViewBoxRef.current(unconstrained);

            // Update ref immediately before state update
            viewBoxRef.current = newViewBox;
            setViewBox(newViewBox);
          }
        } else if (touches.length === 1) {
          // If we were pinching but now only have 1 finger, stop pinching
          if (isPinchingRef.current) {
            isPinchingRef.current = false;
            initialPinchDistance.current = 0;
            // Update gesture start to current viewBox for smooth transition to pan
            gestureStartRef.current = {
              x: viewBoxRef.current.x,
              y: viewBoxRef.current.y,
              width: viewBoxRef.current.width,
              height: viewBoxRef.current.height,
              scale: width / viewBoxRef.current.width,
            };
            return; // Skip this frame
          }
          // Pan - use gestureState which gives us total movement from start
          const scale = gestureStartRef.current.width / width;

          const unconstrained = {
            x: gestureStartRef.current.x - gestureState.dx * scale,
            y: gestureStartRef.current.y - gestureState.dy * scale,
            width: gestureStartRef.current.width,
            height: gestureStartRef.current.height,
          };

          const newViewBox = constrainViewBoxRef.current(unconstrained);

          // Update ref immediately before state update
          viewBoxRef.current = newViewBox;
          setViewBox(newViewBox);
        }
      },
      onPanResponderRelease: () => {
        // Don't update ref here - it's already been updated during Move
        // Updating it here with state value can cause jumping due to React closure
        isPinchingRef.current = false;
        initialPinchDistance.current = 0;
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Svg
        width={width}
        height={height}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      >
        <G>
          {/* Links */}
          {linksRef.current.map((l, i) => {
            const sourceId = typeof l.source === 'string' ? l.source : (l.source as any).id;
            const targetId = typeof l.target === 'string' ? l.target : (l.target as any).id;
            const sourcePos = positions[sourceId];
            const targetPos = positions[targetId];

            if (!sourcePos || !targetPos) return null;

            return (
              <Line
                key={`link-${i}`}
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke="#cbd5e1"
                strokeWidth={2}
                strokeOpacity={0.6}
              />
            );
          })}

          {/* Nodes and labels */}
          {nodesRef.current.map(n => {
            const pos = positions[n.id];
            if (!pos) return null;

            return (
              <G key={n.id}>
                <Circle
                  cx={pos.x}
                  cy={pos.y}
                  r={24}
                  fill="#585ABF"
                  stroke="#fff"
                  strokeWidth={3}
                />
                <Text
                  x={pos.x}
                  y={pos.y}
                  fontSize={14}
                  fontWeight="600"
                  fill="#fff"
                  textAnchor="middle"
                  alignmentBaseline="central"
                >
                  {(n.name ?? n.id).substring(0, 1).toUpperCase()}
                </Text>
                <Text
                  x={pos.x}
                  y={pos.y + 40}
                  fontSize={12}
                  fill="#0f172a"
                  textAnchor="middle"
                >
                  {n.name ?? n.id}
                </Text>
              </G>
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});
