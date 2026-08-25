import React from "react";
import { StyleSheet, View } from "react-native";
import { BarVisualizer, useLocalParticipant, useVoiceAssistant } from "@livekit/react-native";
import type { TrackReferenceOrPlaceholder } from "@livekit/react-native";
import { Track } from "livekit-client";
import { colors } from "../theme";

// The "talking spike", mirroring the web demo and verbex-customer-console: two
// overlaid visualizers — the agent's track while it speaks, and the local mic track
// while the user speaks — so the bars react to both sides of the conversation.
// Must be rendered inside a RoomContext.Provider (see CallPanel).
const BAR_OPTIONS = {
  minHeight: 0.18,
  maxHeight: 1,
  barColor: colors.brand,
  barWidth: 3,
  barBorderRadius: 9999,
} as const;

export function AgentVisualizer() {
  const { state, audioTrack } = useVoiceAssistant();
  const { localParticipant, microphoneTrack } = useLocalParticipant();

  // BarVisualizer takes a track *reference*, so the local mic publication has to be
  // wrapped in one (the agent's track already arrives as a reference).
  const localTrackRef: TrackReferenceOrPlaceholder | undefined = microphoneTrack
    ? {
        participant: localParticipant,
        source: Track.Source.Microphone,
        publication: microphoneTrack,
      }
    : undefined;

  const agentActive = state === "speaking";

  return (
    <View style={styles.root}>
      <View style={[styles.layer, { opacity: agentActive ? 1 : 0 }]} pointerEvents="none">
        <BarVisualizer
          state={state}
          trackRef={audioTrack}
          barCount={12}
          options={BAR_OPTIONS}
          style={styles.viz}
        />
      </View>
      <View style={[styles.layer, { opacity: agentActive ? 0 : 1 }]} pointerEvents="none">
        {/* Forced to "speaking" so the user's mic bars paint in the accent foreground
            colour — BarVisualizer only highlights volume bars in the speaking state. */}
        <BarVisualizer
          state="speaking"
          trackRef={localTrackRef}
          barCount={12}
          options={BAR_OPTIONS}
          style={styles.viz}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { width: 112, height: 24 },
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  viz: { width: 112, height: 24 },
});
