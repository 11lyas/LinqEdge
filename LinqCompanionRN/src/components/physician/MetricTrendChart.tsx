import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme/colors';

export interface ChartPoint {
  label: string;   // x-axis label (e.g. weekday)
  value: number;
}

export interface EventMark {
  index: number;   // index into points
  color: string;
}

interface Props {
  title: string;
  unit: string;
  points: ChartPoint[];
  color: string;
  kind?: 'line' | 'bar';
  /** Days on which cardiac events occurred — rendered as vertical markers. */
  eventMarks?: EventMark[];
  /** Decimal places for the headline value. */
  decimals?: number;
}

const CHART_HEIGHT = 110;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;
const PAD_LEFT = 6;
const PAD_RIGHT = 6;

/**
 * Compact 7-day trend chart (line or bar) with optional vertical event
 * markers so wearable trends visually align with ECG events.
 */
export default function MetricTrendChart({
  title, unit, points, color, kind = 'line', eventMarks = [], decimals = 0,
}: Props) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const latest = points.length ? points[points.length - 1].value : 0;

  const innerW = Math.max(0, width - PAD_LEFT - PAD_RIGHT);
  const innerH = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const n = points.length;

  const values = points.map(p => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = rawMax - rawMin || 1;
  const min = kind === 'bar' ? 0 : rawMin - span * 0.15;
  const max = rawMax + span * 0.15;

  const xAt = (i: number) => PAD_LEFT + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v: number) => PAD_TOP + innerH - ((v - min) / (max - min)) * innerH;

  const barW = n > 0 ? Math.min(26, (innerW / n) * 0.55) : 0;
  const barXAt = (i: number) => xAt(i) - barW / 2;

  const linePoints = points.map((p, i) => `${xAt(i).toFixed(1)},${yAt(p.value).toFixed(1)}`).join(' ');
  const areaPath = n > 1
    ? `M${xAt(0).toFixed(1)} ${yAt(points[0].value).toFixed(1)} `
      + points.slice(1).map((p, i) => `L${xAt(i + 1).toFixed(1)} ${yAt(p.value).toFixed(1)}`).join(' ')
      + ` L${xAt(n - 1).toFixed(1)} ${PAD_TOP + innerH} L${xAt(0).toFixed(1)} ${PAD_TOP + innerH} Z`
    : '';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.latest}>
          {latest.toFixed(decimals)}
          <Text style={styles.unit}> {unit}</Text>
        </Text>
      </View>

      <View onLayout={onLayout}>
        {width > 0 && n > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {/* Baseline */}
            <Line
              x1={PAD_LEFT} y1={PAD_TOP + innerH} x2={PAD_LEFT + innerW} y2={PAD_TOP + innerH}
              stroke={colors.separatorOpaque} strokeWidth={1}
            />

            {/* Event day markers (behind data) */}
            {eventMarks.map((mk, i) => (
              mk.index >= 0 && mk.index < n ? (
                <React.Fragment key={`ev-${i}`}>
                  <Line
                    x1={xAt(mk.index)} y1={PAD_TOP - 4} x2={xAt(mk.index)} y2={PAD_TOP + innerH}
                    stroke={mk.color} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.55}
                  />
                  <Circle cx={xAt(mk.index)} cy={PAD_TOP - 6} r={3} fill={mk.color} />
                </React.Fragment>
              ) : null
            ))}

            {/* Data */}
            {kind === 'bar' ? (
              points.map((p, i) => (
                <Rect
                  key={i}
                  x={barXAt(i)} y={yAt(p.value)}
                  width={barW} height={PAD_TOP + innerH - yAt(p.value)}
                  rx={3} fill={color} opacity={i === n - 1 ? 1 : 0.55}
                />
              ))
            ) : (
              <>
                {areaPath ? <Path d={areaPath} fill={color} opacity={0.1} /> : null}
                <Polyline
                  points={linePoints} fill="none" stroke={color}
                  strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
                />
                {points.map((p, i) => (
                  <Circle
                    key={i} cx={xAt(i)} cy={yAt(p.value)}
                    r={i === n - 1 ? 4 : 2.5} fill={i === n - 1 ? color : colors.card}
                    stroke={color} strokeWidth={1.5}
                  />
                ))}
              </>
            )}

            {/* X labels */}
            {points.map((p, i) => (
              <SvgText
                key={`xl-${i}`}
                x={xAt(i)} y={CHART_HEIGHT - 6}
                fontSize={9} fill={colors.tertiaryText} textAnchor="middle"
              >
                {p.label}
              </SvgText>
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  title:  { fontSize: 13, fontWeight: '700', color: colors.text },
  latest: { fontSize: 15, fontWeight: '800', color: colors.text },
  unit:   { fontSize: 11, fontWeight: '500', color: colors.tertiaryText },
});
