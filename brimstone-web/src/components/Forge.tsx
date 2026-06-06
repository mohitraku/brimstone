// Forge — create and manage oaths. Cryptic, minimal, no labels.
// Ported from React Native. Long-press to forsake.
"use client";

import { useState, useCallback } from "react";
import { colors, spacing, fontSize, radii } from "@/lib/theme";
import type { Commitment } from "@/types/database";

const FREQUENCIES = [
  { key: "daily", mark: "each dawn" },
  { key: "recurring", mark: "certain days" },
] as const;

const DAY_MARKS = ["S", "M", "T", "W", "T", "F", "S"];

interface Props {
  commitments: Commitment[];
  onAdd: (
    title: string,
    frequency: string,
    recurrence_days: number[] | null,
    recurrence_dates: number[] | null,
  ) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onBack: () => void;
}

export function Forge({ commitments, onAdd, onRemove, onBack }: Props) {
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([]);
  const [recurrenceDates, setRecurrenceDates] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forsakeId, setForsakeId] = useState<string | null>(null);

  const handleSwear = useCallback(async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const days = frequency === "recurring" && recurrenceDays.length > 0 ? recurrenceDays : null;
    const dates = frequency === "recurring" && recurrenceDates.length > 0 ? recurrenceDates : null;
    await onAdd(title.trim(), frequency, days, dates);
    setTitle("");
    setRecurrenceDays([]);
    setRecurrenceDates([]);
    setIsSubmitting(false);
  }, [title, frequency, recurrenceDays, recurrenceDates, isSubmitting, onAdd]);

  const toggleDay = useCallback((d: number) => {
    setRecurrenceDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }, []);

  const toggleDate = useCallback((d: number) => {
    setRecurrenceDates((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }, []);

  const handleLongPress = useCallback((id: string) => {
    setForsakeId(id);
  }, []);

  const confirmForsake = useCallback(
    async (id: string) => {
      await onRemove(id);
      setForsakeId(null);
    },
    [onRemove],
  );

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        {/* Drag handle */}
        <div style={styles.handle} />

        <div style={styles.scroll}>
          {/* ── Swear form ────────────────────────────────── */}
          <p style={styles.sectionMark}>swear an oath</p>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSwear()}
            placeholder="_"
            autoFocus
            style={styles.input}
          />

          {/* Frequency chips */}
          <div style={styles.chipRow}>
            {FREQUENCIES.map((f) => (
              <button
                key={f.key}
                onClick={() => setFrequency(f.key)}
                style={{
                  ...styles.chip,
                  ...(frequency === f.key ? styles.chipActive : {}),
                }}
              >
                <span
                  style={{
                    ...styles.chipText,
                    ...(frequency === f.key ? styles.chipTextActive : {}),
                  }}
                >
                  {f.mark}
                </span>
              </button>
            ))}
          </div>

          {/* Day-of-week picker — shown when recurring */}
          {frequency === "recurring" && (
            <>
              <div style={styles.dayPicker}>
                {DAY_MARKS.map((mark, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    style={{
                      ...styles.dayChip,
                      ...(recurrenceDays.includes(i) ? styles.dayChipActive : {}),
                    }}
                  >
                    <span
                      style={{
                        ...styles.dayChipText,
                        ...(recurrenceDays.includes(i) ? styles.dayChipTextActive : {}),
                      }}
                    >
                      {mark}
                    </span>
                  </button>
                ))}
              </div>

              {/* Date-of-month picker */}
              <div style={styles.datePicker}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDate(d)}
                    style={{
                      ...styles.dateChip,
                      ...(recurrenceDates.includes(d) ? styles.dateChipActive : {}),
                    }}
                  >
                    <span
                      style={{
                        ...styles.dateChipText,
                        ...(recurrenceDates.includes(d) ? styles.dateChipTextActive : {}),
                      }}
                    >
                      {d}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <button
            onClick={handleSwear}
            disabled={!title.trim() || isSubmitting}
            style={{
              ...styles.swearBtn,
              ...((!title.trim() || isSubmitting) ? styles.swearBtnDisabled : {}),
            }}
          >
            Swear
          </button>

          <button onClick={onBack} style={styles.backBtn}>
            turn back
          </button>

          {/* ── Bound oaths ───────────────────────────────── */}
          {commitments.length > 0 && (
            <>
              <div style={styles.divider} />
              <p style={styles.sectionMark}>oaths bound</p>

              {commitments.map((c) => {
                const freqDesc =
                  c.frequency === "daily"
                    ? "each dawn"
                    : c.recurrence_days && c.recurrence_days.length > 0
                      ? c.recurrence_days
                          .map((d: number) => DAY_MARKS[d])
                          .join(", ")
                      : c.recurrence_dates && c.recurrence_dates.length > 0
                        ? c.recurrence_dates.join(", ")
                        : "certain days";

                return (
                  <div key={c.id}>
                    <button
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleLongPress(c.id);
                      }}
                      onTouchStart={() => {
                        const timer = setTimeout(() => handleLongPress(c.id), 600);
                        // Store timer for cleanup — handled by the next touch event
                        return () => clearTimeout(timer);
                      }}
                      style={{
                        ...styles.oathRow,
                        touchAction: "manipulation",
                      }}
                    >
                      <span style={styles.oathTitle}>{c.title}</span>
                      <span style={styles.oathFreq}>{freqDesc}</span>
                    </button>

                    {/* Inline forsake confirmation */}
                    {forsakeId === c.id && (
                      <div style={styles.forsakeConfirm}>
                        <span style={styles.forsakeText}>
                          forsake &ldquo;{c.title}&rdquo;?
                        </span>
                        <div style={styles.forsakeActions}>
                          <button
                            onClick={() => setForsakeId(null)}
                            style={styles.forsakeNo}
                          >
                            no
                          </button>
                          <button
                            onClick={() => confirmForsake(c.id)}
                            style={styles.forsakeYes}
                          >
                            yes
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <p style={styles.hint}>hold to forsake</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
  },
  container: {
    flex: 1,
    paddingLeft: spacing.lg,
    paddingRight: spacing.lg,
    paddingTop: spacing.lg,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginLeft: "auto",
    marginRight: "auto",
    marginBottom: spacing.lg,
  },
  scroll: {
    overflowY: "auto",
    flex: 1,
  },
  sectionMark: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: spacing.md,
    margin: 0,
  },
  input: {
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    color: colors.text,
    fontSize: fontSize.lg,
    fontFamily: "serif",
    padding: spacing.md,
    marginBottom: spacing.md,
    width: "100%",
    outline: "none",
    display: "block",
    boxSizing: "border-box",
  },
  chipRow: {
    display: "flex",
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flex: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    cursor: "pointer",
    fontFamily: "serif",
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentFaint,
  },
  chipText: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
  },
  chipTextActive: {
    color: colors.gold,
  },
  dayPicker: {
    display: "flex",
    flexDirection: "row",
    gap: spacing.xs,
    marginBottom: spacing.sm,
    justifyContent: "center",
  },
  dayChip: {
    width: 34,
    height: 34,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    cursor: "pointer",
    padding: 0,
  },
  dayChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentFaint,
  },
  dayChipText: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
  },
  dayChipTextActive: {
    color: colors.gold,
  },
  datePicker: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginBottom: spacing.lg,
  },
  dateChip: {
    width: 34,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    cursor: "pointer",
    padding: 0,
  },
  dateChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accentFaint,
  },
  dateChipText: {
    color: colors.textFaint,
    fontSize: 10,
    fontFamily: "serif",
  },
  dateChipTextActive: {
    color: colors.gold,
  },
  swearBtn: {
    backgroundColor: colors.accent,
    color: colors.bg,
    border: "none",
    borderRadius: radii.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    width: "100%",
    fontSize: fontSize.md,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    cursor: "pointer",
    marginBottom: spacing.sm,
  },
  swearBtnDisabled: {
    opacity: 0.4,
    cursor: "default",
  },
  backBtn: {
    backgroundColor: "transparent",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    width: "100%",
    fontSize: fontSize.md,
    fontFamily: "serif",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.textFaint,
    cursor: "pointer",
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  oathRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.sm + 2,
    paddingBottom: spacing.sm + 2,
    borderBottom: `1px solid ${colors.border}`,
    width: "100%",
    background: "none",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "serif",
    color: colors.text,
  },
  oathTitle: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontFamily: "serif",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  oathFreq: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    marginLeft: spacing.sm,
    opacity: 0.6,
  },
  forsakeConfirm: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.md,
    backgroundColor: colors.surface,
    borderBottom: `1px solid ${colors.border}`,
  },
  forsakeText: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    fontFamily: "serif",
    fontStyle: "italic",
    marginBottom: spacing.sm,
    display: "block",
  },
  forsakeActions: {
    display: "flex",
    gap: spacing.sm,
  },
  forsakeNo: {
    background: "none",
    border: `1px solid ${colors.border}`,
    borderRadius: radii.md,
    padding: `${spacing.xs}px ${spacing.md}px`,
    color: colors.textFaint,
    fontFamily: "serif",
    fontSize: fontSize.sm,
    cursor: "pointer",
  },
  forsakeYes: {
    background: "none",
    border: `1px solid ${colors.danger}`,
    borderRadius: radii.md,
    padding: `${spacing.xs}px ${spacing.md}px`,
    color: colors.danger,
    fontFamily: "serif",
    fontSize: fontSize.sm,
    cursor: "pointer",
  },
  hint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontFamily: "serif",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: spacing.sm,
    opacity: 0.4,
    margin: 0,
  },
};
