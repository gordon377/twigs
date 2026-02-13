import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line as SvgLine, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { line, area } from 'd3-shape';
import { colors, SIZES } from '@/styles/styles';

interface DataPoint {
  date: string;
  hours: number;
}

interface TimeChartProps {
  data: DataPoint[];
  title?: string;
}

export function TimeChart({ data, title = 'Time Saved' }: TimeChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - SIZES.spacing.lg * 2 - 32; // Account for padding
  const chartHeight = 240;
  const padding = { top: 30, right: 20, bottom: 40, left: 50 };

  // Calculate scales - use a fixed max for consistent spacing
  const maxHours = 10; // Fixed scale for consistent y-axis
  const xScale = (index: number) =>
    padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right);
  const yScale = (hours: number) =>
    chartHeight - padding.bottom - (hours / maxHours) * (chartHeight - padding.top - padding.bottom);

  // Generate line path
  const lineGenerator = line<DataPoint>()
    .x((d, i) => xScale(i))
    .y(d => yScale(d.hours));

  const pathData = lineGenerator(data) || '';

  // Generate area path for gradient fill
  const areaGenerator = area<DataPoint>()
    .x((d, i) => xScale(i))
    .y0(chartHeight - padding.bottom)
    .y1(d => yScale(d.hours));

  const areaData = areaGenerator(data) || '';

  // Y-axis labels - show every 2 hours
  const yLabels = [0, 2, 4, 6, 8, 10];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>November</Text>
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity="0.3" />
            <Stop offset="1" stopColor={colors.primary} stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        {/* Grid lines - skip 0 to reduce clutter */}
        {yLabels.filter(label => label > 0).map(label => (
          <SvgLine
            key={label}
            x1={padding.left}
            y1={yScale(label)}
            x2={chartWidth - padding.right}
            y2={yScale(label)}
            stroke={colors.lightGrey}
            strokeWidth="1"
            opacity="0.4"
            strokeDasharray="6 4"
          />
        ))}

        {/* Y-axis unit label */}
        <SvgText
          x={padding.left - 12}
          y={padding.top - 8}
          fontSize="10"
          fill={colors.textSecondary}
          textAnchor="end"
          fontWeight="600"
        >
          hrs
        </SvgText>

        {/* Y-axis labels */}
        {yLabels.map((label, index) => (
          <SvgText
            key={`y-${label}`}
            x={padding.left - 12}
            y={yScale(label) + 5}
            fontSize="12"
            fill={colors.textMuted}
            textAnchor="end"
            fontWeight="600"
          >
            {label}
          </SvgText>
        ))}

        {/* Gradient area fill */}
        <Path
          d={areaData}
          fill="url(#chartGradient)"
        />

        {/* Line path */}
        <Path
          d={pathData}
          stroke={colors.primary}
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {data.map((d, i) => (
          <Circle
            key={`point-${i}`}
            cx={xScale(i)}
            cy={yScale(d.hours)}
            r="5"
            fill={colors.cardBackground}
            stroke={colors.primary}
            strokeWidth="3"
          />
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <SvgText
            key={`x-${i}`}
            x={xScale(i)}
            y={chartHeight - padding.bottom + 22}
            fontSize="11"
            fill={colors.textMuted}
            textAnchor="middle"
            fontWeight="600"
          >
            {d.date}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: SIZES.spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.spacing.lg,
  },
  title: {
    fontSize: SIZES.font.lg,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: SIZES.font.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
