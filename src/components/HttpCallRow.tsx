import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { VerbexEvent } from "../lib/verbexEvents";
import { colors, mono } from "../theme";
import { ChevronDown, ChevronRight, Globe } from "./icons";
import { PayloadBlock } from "./PayloadBlock";
import { eventRowStyles } from "./eventRowStyles";

type HttpCall = Extract<VerbexEvent, { kind: "http_call" }>;

function statusColor(status: number | null, error: string | null): string {
  if (error) return colors.red400;
  if (status === null) return colors.white40;
  if (status >= 200 && status < 300) return colors.success;
  return colors.amber300;
}

export function HttpCallRow({ event }: { event: HttpCall }) {
  const [open, setOpen] = useState(false);
  const hasDetail = event.response !== undefined || !!event.error || !!event.url;

  return (
    <View style={eventRowStyles.card}>
      <Pressable
        onPress={() => hasDetail && setOpen((o) => !o)}
        disabled={!hasDetail}
        accessibilityRole="button"
        accessibilityLabel={`HTTP ${event.method} ${event.status ?? "no status"}`}
        accessibilityState={{ expanded: open }}
        style={eventRowStyles.header}
      >
        <Globe size={14} color={colors.sky300} />
        <Text style={eventRowStyles.kind}>http</Text>
        <Text style={styles.method}>{event.method}</Text>
        <Text style={[styles.status, { color: statusColor(event.status, event.error) }]}>
          {event.error ? "ERR" : (event.status ?? "—")}
        </Text>
        {event.durationMs !== undefined && (
          <Text style={styles.duration}>{event.durationMs}ms</Text>
        )}
        {hasDetail && (
          <View style={eventRowStyles.chevron}>
            {open ? (
              <ChevronDown size={14} color={colors.white30} />
            ) : (
              <ChevronRight size={14} color={colors.white30} />
            )}
          </View>
        )}
      </Pressable>

      {open && hasDetail && (
        <View style={eventRowStyles.body}>
          {!!event.url && <PayloadBlock label="url" value={event.url} />}
          {event.response !== undefined && (
            <PayloadBlock label="response" value={event.response} />
          )}
          {!!event.error && <PayloadBlock label="error" value={event.error} tone="error" />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  method: { fontFamily: mono, fontSize: 12, color: colors.white90 },
  status: { fontFamily: mono, fontSize: 12 },
  duration: { fontFamily: mono, fontSize: 12, color: colors.white35 },
});
