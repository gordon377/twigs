import React, { useEffect, useRef } from 'react';
import { Dimensions, View, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Text } from 'react-native-svg';
import * as d3 from 'd3-force';
import { PanGestureHandler, PinchGestureHandler, PanGestureHandlerGestureEvent, PinchGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';

type NodeDatum = { id: string; name?: string; x?: number; y?: number; fx?: number; fy?: number; };
type LinkDatum = { source: string; target: string; };

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedText = Animated.createAnimatedComponent(Text);

export default function NetworkTree({
  nodes: initialNodes,
  links: initialLinks,
}: {
  nodes: NodeDatum[];
  links: LinkDatum[];
}) {
  const { width, height } = Dimensions.get('window');
  const simRef = useRef<d3.Simulation<NodeDatum, undefined> | null>(null);

  // Shared map of positions: { [id]: { x, y } }
  const positions = useSharedValue<Record<string, { x: number; y: number }>>({});

  // Keep initial arrays stable refs (render uses these arrays for elements)
  const nodesRef = useRef(initialNodes.map(n => ({ ...n })));
  const linksRef = useRef(initialLinks.map(l => ({ ...l })));

  useEffect(() => {
    // initialize positions map
    const initialMap: Record<string, { x: number; y: number }> = {};
    nodesRef.current.forEach((n, i) => {
      initialMap[n.id] = {
        x: n.x ?? width / 2 + (Math.random() - 0.5) * 20,
        y: n.y ?? height / 2 + (Math.random() - 0.5) * 20,
      };
    });
    positions.value = initialMap;

    // create a copy of nodes for simulation (d3 will mutate)
    const simNodes = nodesRef.current.map(n => ({ ...n }));
    const simLinks = linksRef.current.map(l => ({ ...l }));

    // build simulation
    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(120).strength(0.8))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .alphaTarget(0.3)
      .velocityDecay(0.5);

    sim.on('tick', () => {
      // Update positions shared value each tick. Create a new object to ensure reactivity.
      const next: Record<string, { x: number; y: number }> = {};
      for (const n of simNodes) {
        next[n.id] = { x: n.x ?? width / 2, y: n.y ?? height / 2 };
      }
      positions.value = next;
    });

    simRef.current = sim;
    return () => {
      sim.stop();
      simRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Helper to find sim node for interactive changes
  const findSimNode = (id: string) => {
    if (!simRef.current) return null;
    return (simRef.current.nodes() as NodeDatum[]).find(n => n.id === id) ?? null;
  };

  // Pan & pinch shared values + styles
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Reanimated v2 gesture handlers
  const panHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startX: number; startY: number }>(
    {
      onStart(_, ctx) {
        ctx.startX = translateX.value;
        ctx.startY = translateY.value;
      },
      onActive(event, ctx) {
        translateX.value = ctx.startX + event.translationX;
        translateY.value = ctx.startY + event.translationY;
      },
    }
  );

  const pinchHandler = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent, { startScale: number }>(
    {
      onStart(_, ctx) {
        ctx.startScale = scale.value;
      },
      onActive(event, ctx) {
        const s = ctx.startScale * event.scale;
        scale.value = Math.min(Math.max(s, 0.5), 3);
      },
    }
  );

  // useAnimatedStyle applied to wrapper to pan/zoom the whole SVG
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Node press: briefly fix node near center (interact with simulation)
  const handleNodePress = (id: string) => {
    const node = findSimNode(id);
    if (!node || !simRef.current) return;
    node.fx = width / 2 + (Math.random() - 0.5) * 40;
    node.fy = height / 2 + (Math.random() - 0.5) * 40;
    simRef.current.alpha(0.7).restart();
    setTimeout(() => {
      delete node.fx;
      delete node.fy;
      simRef.current && simRef.current.alphaTarget(0.01);
    }, 800);
  };

  // Animated props for a node (circle)
  const makeNodeProps = (id: string) =>
    useAnimatedProps(() => {
      const p = positions.value[id] ?? { x: width / 2, y: height / 2 };
      // Animated SVG props expect numbers (not transforms)
      return { cx: p.x, cy: p.y } as any;
    });

  // Animated props for node label
  const makeLabelProps = (id: string) =>
    useAnimatedProps(() => {
      const p = positions.value[id] ?? { x: width / 2, y: height / 2 };
      return { x: p.x + 28, y: p.y + 6 } as any;
    });

  // Animated props for link
  const makeLinkProps = (sourceId: string, targetId: string) =>
    useAnimatedProps(() => {
      const s = positions.value[sourceId] ?? { x: width / 2, y: height / 2 };
      const t = positions.value[targetId] ?? { x: width / 2, y: height / 2 };
      return { x1: s.x, y1: s.y, x2: t.x, y2: t.y } as any;
    });

  return (
    <View style={styles.container}>
      <PanGestureHandler onGestureEvent={panHandler}>
        <Animated.View style={{ flex: 1 }}>
          <PinchGestureHandler onGestureEvent={pinchHandler}>
            <Animated.View style={[{ flex: 1 }, animatedStyle]}>
              <Svg width={width} height={height}>
                {/* links */}
                {linksRef.current.map((l, i) => {
                  const animProps = makeLinkProps((l as any).source, (l as any).target);
                  return (
                    <AnimatedLine
                      key={`link-${i}`}
                      animatedProps={animProps}
                      stroke="#cbd5e1"
                      strokeWidth={1.2}
                      strokeOpacity={0.9}
                    />
                  );
                })}

                {/* nodes & labels */}
                {nodesRef.current.map(n => {
                  const nodeAnim = makeNodeProps(n.id);
                  const labelAnim = makeLabelProps(n.id);
                  return (
                    <React.Fragment key={n.id}>
                      <AnimatedCircle
                        animatedProps={nodeAnim}
                        r={20}
                        fill="#2979ff"
                        onPress={() => handleNodePress(n.id)}
                      />
                      <AnimatedText
                        animatedProps={labelAnim}
                        fontSize={12}
                        fill="#0f172a"
                      >
                        {n.name ?? n.id}
                      </AnimatedText>
                    </React.Fragment>
                  );
                })}
              </Svg>
            </Animated.View>
          </PinchGestureHandler>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});