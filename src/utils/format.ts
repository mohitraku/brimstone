import { format, formatDistanceToNow } from "date-fns";

export function formatDate(iso: string): string {
  return format(new Date(iso), "MMM d");
}

export function formatTime(iso: string): string {
  return format(new Date(iso), "h:mm a");
}

export function timeAgo(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function todaysDateString(): string {
  return new Date().toISOString().split("T")[0];
}
