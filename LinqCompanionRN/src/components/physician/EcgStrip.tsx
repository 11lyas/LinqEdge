import React, { useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, { Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme/colors';
import { CardiacEvent, CardiacEventType, eventColor } from '../../models/physicianTypes';
import { generateEcgStrip } from '../../utils/ecgGenerator';

// ── Layout constants ──────────────────────────────────────────────────────────

const PX_PER_SEC = 55;
const STRIP_HEIGHT = 200;
const BASELINE_Y = 118;
const AMP_SCALE = 58;
const PILL_Y = 10;
const PILL_H = 22;
const TICK_Y = STRIP_HEIGHT - 8;

const EVENT_ABBREV: Record<CardiacEventType, string> = {
  'AFib Episode': 'AFib',
  'Pause': 'Pause',
  'Tachycardia Event': 'Tachy',
  'Bradycardia Event': 'Brady',
  'PVC Run': 'PVC',
};

interface Props {
  events: CardiacEvent[];
  seedKey: string;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
}

/**
 * Single-channel ECG waveform on clinical "paper" with tappable event markers.
 * Horizontally scrollable 30 s strip; the selected event region is highlighted.
 */
export default function EcgStrip({ events, seedKey, selectedEventId, onSelectEvent }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  const strip = useMemo(() => generateEcgStrip(events, seedKey), [events, seedKey]);
  const stripWidth = strip.durationSec * PX_PER_SEC;

  const polylinePoints = useMemo(() => {
    const pts: string[] = [];
    const step = stripWidth / strip.samples.length;
    for (let i = 0; i < strip.samples.length; i++) {
      const x = (i * step).toFixed(1);
      const y = (BASELINE_Y - strip.samples[i] * AMP_SCALE).toFixed(1);
      pts.push(`${x},${y}`);
    }
    return pts.join(' ');
  }, [strip, stripWidth]);

  const { minorGrid, majorGrid } = useMemo(() => {
    const minor: string[] = [];
    const major: string[] = [];
    for (let x = 0; x <= stripWidth; x += 11) {
      (x % 55 === 0 ? major : minor).push(`M${x} 0 V${STRIP_HEIGHT}`);
    }
    for (let y = 0; y <= STRIP_HEIGHT; y += 11) {
      (y % 55 === 0 ? major : minor).push(`M0 ${y} H${stripWidth}`);
    }
    return { minorGrid: minor.join(' '), majorGrid: major.join(' ') };
  }, [stripWidth]);

  // Center the selected marker in the viewport.
  useEffect(() => {
    const marker = strip.markers.find(mk => mk.eventId === selectedEventId);
    if (!marker || !scrollRef.current) return;
    const viewport = Dimensions.get('window').width;
    const x = Math.max(0, marker.timeSec * PX_PER_SEC - viewport / 2);
    scrollRef.current.scrollTo({ x, animated: true });
  }, [selectedEventId, strip]);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator
        style={styles.scroll}
      >
        <View style={{ width: stripWidth, height: STRIP_HEIGHT }}>
          <Svg width={stripWidth} height={STRIP_HEIGHT}>
            {/* ECG paper */}
            <Rect x={0} y={0} width={stripWidth} height={STRIP_HEIGHT} fill={colors.ecgPaper} />
            <Path d={minorGrid} stroke={colors.ecgGridMinor} strokeWidth={1} />
            <Path d={majorGrid} stroke={colors.ecgGridMajor} strokeWidth={1} />

            {/* Selected event region highlight */}
            {strip.markers.map(mk => {
              if (mk.eventId !== selectedEventId) return null;
              const color = eventColor(mk.type);
              const x0 = (mk.timeSec - 2.6) * PX_PER_SEC;
              const w = 5.2 * PX_PER_SEC;
              return (
                <Rect
                  key={`hl-${mk.eventId}`}
                  x={x0} y={0} width={w} height={STRIP_HEIGHT}
                  fill={color} opacity={0.08}
                />
              );
            })}

            {/* Waveform */}
            <Polyline
              points={polylinePoints}
              fill="none"
              stroke={colors.ecgTrace}
              strokeWidth={1.6}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Time ticks */}
            {Array.from({ length: strip.durationSec / 5 + 1 }, (_, i) => i * 5).map(sec => (
              <SvgText
                key={`tick-${sec}`}
                x={sec * PX_PER_SEC + 3}
                y={TICK_Y}
                fontSize={9}
                fill={colors.tertiaryText}
              >
                {`${sec}s`}
              </SvgText>
            ))}

            {/* Event markers: pointer line + label pill */}
            {strip.markers.map(mk => {
              const color = eventColor(mk.type);
              const selected = mk.eventId === selectedEventId;
              const x = mk.timeSec * PX_PER_SEC;
              const label = EVENT_ABBREV[mk.type];
              const pillW = label.length * 7 + 22;
              return (
                <React.Fragment key={mk.eventId}>
                  <Path
                    d={`M${x} ${PILL_Y + PILL_H} V${STRIP_HEIGHT - 18}`}
                    stroke={color}
                    strokeWidth={selected ? 2.2 : 1.4}
                    strokeDasharray={selected ? undefined : '5,4'}
                    opacity={selected ? 0.9 : 0.65}
                  />
                  <Rect
                    x={x - pillW / 2} y={PILL_Y} width={pillW} height={PILL_H} rx={PILL_H / 2}
                    fill={selected ? color : colors.card}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                  <SvgText
                    x={x} y={PILL_Y + 15}
                    fontSize={11} fontWeight="bold"
                    fill={selected ? '#FFFFFF' : color}
                    textAnchor="middle"
                  >
                    {label}
                  </SvgText>
                </React.Fragment>
              );
            })}
          </Svg>

          {/* Generous invisible tap targets over each marker */}
          {strip.markers.map(mk => (
            <TouchableOpacity
              key={`tap-${mk.eventId}`}
              style={[styles.tapTarget, { left: mk.timeSec * PX_PER_SEC - 28 }]}
              onPress={() => onSelectEvent(mk.eventId)}
              activeOpacity={0.6}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.captionRow}>
        <Text style={styles.caption}>Single-channel · 30 s strip · simulated</Text>
        <Text style={styles.captionHint}>Tap a marker to investigate</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll:      { borderRadius: 12, borderWidth: 1, borderColor: colors.separatorOpaque },
  tapTarget:   { position: 'absolute', top: 0, width: 56, height: STRIP_HEIGHT - 24 },
  captionRow:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingHorizontal: 2 },
  caption:     { fontSize: 11, color: colors.tertiaryText },
  captionHint: { fontSize: 11, fontWeight: '600', color: colors.medtronicBlue },
});
