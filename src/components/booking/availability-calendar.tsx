"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { getStayCalendar } from "@/lib/actions";
import { addDaysISO, cx, todayISO } from "@/lib/utils";

type Day = Awaited<ReturnType<typeof getStayCalendar>>[number];
type Key = "SHARED_BUNK" | "PRIVATE_ROOM";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Month view of live availability. Click a night to start, another to end. */
export default function AvailabilityCalendar({
  typeKey,
  checkIn,
  checkOut,
  minStay,
  onPick,
}: {
  typeKey: Key;
  checkIn: string;
  checkOut: string;
  minStay: number;
  onPick: (checkIn: string, checkOut: string) => void;
}) {
  const [month, setMonth] = useState(() => (checkIn || todayISO()).slice(0, 7));
  const [loaded, setLoaded] = useState<{ key: string; days: Day[] }>({ key: "", days: [] });
  const [pickingEnd, setPickingEnd] = useState(false);
  const today = todayISO();
  const thisMonth = today.slice(0, 7);
  const key = `${month}|${checkIn}|${checkOut}`;
  const days = loaded.days;
  const loading = loaded.key !== key;

  useEffect(() => {
    let live = true;
    getStayCalendar(month).then((d) => live && setLoaded({ key, days: d }));
    return () => {
      live = false;
    };
  }, [month, key]);

  const lead = days.length
    ? (new Date(`${days[0].date}T00:00:00Z`).getUTCDay() + 6) % 7
    : 0;

  const pick = (date: string) => {
    if (pickingEnd && date > checkIn) {
      onPick(checkIn, date);
      setPickingEnd(false);
    } else {
      onPick(date, addDaysISO(date, minStay));
      setPickingEnd(true);
    }
  };

  return (
    <div className="rounded-2xl border border-line p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, -1))}
          disabled={month <= thisMonth}
          className="p-2 rounded-full hover:bg-mist disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="font-semibold text-sm flex items-center gap-2">
          {monthLabel(month)}
          {loading && <Loader2 size={13} className="animate-spin" />}
        </p>
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, 1))}
          className="p-2 rounded-full hover:bg-mist"
          aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mt-3 text-center">
        {WEEKDAYS.map((w) => (
          <span key={w} className="text-[10.5px] uppercase tracking-wide text-ink-soft py-1">
            {w}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} />
        ))}
        {days.map((d) => {
          const u = d.units[typeKey];
          const past = d.date < today;
          const full = u.available < 1;
          const inRange = d.date >= checkIn && d.date < checkOut;
          return (
            <button
              key={d.date}
              type="button"
              disabled={past || full}
              onClick={() => pick(d.date)}
              className={cx(
                "rounded-lg py-1.5 text-[13px] leading-tight transition-colors",
                past && "opacity-30",
                !past && full && "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 cursor-not-allowed",
                !past && !full && !inRange && "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200",
                inRange && !full && "bg-ink text-paper"
              )}
              title={full ? "Fully booked" : `${u.available} of ${u.total} available`}
            >
              <span className="block font-semibold">{Number(d.date.slice(8))}</span>
              <span className="block text-[9.5px]">
                {past ? "" : full ? "Full" : `${u.available} left`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11.5px] text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-200" /> Available (rooms left)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-red-200" /> Fully booked
        </span>
        <span>{pickingEnd ? "Now tap your check-out date" : "Tap a date to choose check-in"}</span>
      </div>
    </div>
  );
}
