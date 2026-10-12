import { parseISO } from 'date-fns';
import type { CalendarItem } from '@/src/types';

export type Placed = { item: CalendarItem; col: number; cols: number; start: number; end: number };

/**
 * Google-Calendar style column layout: items that overlap in time are grouped into
 * clusters; each item takes the first free column and the cluster shares its width.
 * `minMinutes` makes very short items still reserve the space they visually occupy.
 */
export function layoutOverlaps(items: CalendarItem[], minMinutes = 30): Placed[] {
  const evs = items
    .map((item) => {
      const start = parseISO(item.data.starts_at).getTime();
      const dur = Math.max(item.data.duration_minutes || 0, minMinutes);
      return { item, start, end: start + dur * 60_000, col: 0, cols: 1 };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const out: Placed[] = [];
  let cluster: typeof evs = [];
  let colEnds: number[] = [];
  let clusterEnd = -Infinity;
  const flush = () => {
    const n = colEnds.length || 1;
    cluster.forEach((e) => {
      e.cols = n;
      out.push(e);
    });
    cluster = [];
    colEnds = [];
  };
  for (const e of evs) {
    if (e.start >= clusterEnd) flush();
    let c = colEnds.findIndex((end) => end <= e.start);
    if (c === -1) {
      c = colEnds.length;
      colEnds.push(e.end);
    } else colEnds[c] = e.end;
    e.col = c;
    cluster.push(e);
    clusterEnd = Math.max(clusterEnd === -Infinity ? e.end : clusterEnd, e.end);
  }
  flush();
  return out;
}
