"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, type DateRange, type DayPickerProps, useDayPicker } from "react-day-picker";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps & {
  className?: string;
  classNames?: DayPickerProps["classNames"];
};

function CalendarNav({ onPreviousClick, onNextClick, previousMonth, nextMonth }: any) {
  const { months } = useDayPicker();
  const currentMonthDate = months?.[0]?.date || new Date();
  const formattedMonth = currentMonthDate.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl px-2 sm:px-3 py-2 sm:py-2.5 mb-2 shadow-2xs">
      <button
        type="button"
        disabled={!previousMonth}
        onClick={onPreviousClick}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200/80 transition-all flex items-center justify-center cursor-pointer disabled:opacity-25 disabled:pointer-events-none shadow-none hover:shadow-2xs active:scale-95"
        aria-label="Bulan Sebelumnya"
      >
        <ChevronLeft className="w-5 h-5 text-slate-700" />
      </button>

      <div className="text-base sm:text-lg md:text-xl font-bold text-slate-800 capitalize tracking-tight select-none">
        {formattedMonth}
      </div>

      <button
        type="button"
        disabled={!nextMonth}
        onClick={onNextClick}
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200/80 transition-all flex items-center justify-center cursor-pointer disabled:opacity-25 disabled:pointer-events-none shadow-none hover:shadow-2xs active:scale-95"
        aria-label="Bulan Berikutnya"
      >
        <ChevronRight className="w-5 h-5 text-slate-700" />
      </button>
    </div>
  );
}

function CalendarDay(props: any) {
  const { day, modifiers, className, ...tdProps } = props;
  const isStart = modifiers?.range_start && !modifiers?.range_end;
  const isEnd = modifiers?.range_end && !modifiers?.range_start;
  const isMiddle = modifiers?.range_middle;

  let bgClass = "";
  if (isStart) {
    // Strip hanya memanjang dari titik tengah (50%) ke kanan menuju hari berikutnya.
    // Sisi kiri 100% transparan sehingga kotak panjang TIDAK melebihi lingkaran awal.
    bgClass = "relative before:absolute before:inset-y-0 before:left-1/2 before:right-0 before:bg-blue-100";
  } else if (isEnd) {
    // Strip hanya memanjang dari batas kiri (0%) hingga ke titik tengah (50%).
    // Sisi kanan 100% transparan sehingga kotak panjang TIDAK melebihi lingkaran akhir.
    bgClass = "relative before:absolute before:inset-y-0 before:left-0 before:right-1/2 before:bg-blue-100";
  } else if (isMiddle) {
    // Kotak panjang mencakup seluruh lebar sel secara mulus & seragam.
    bgClass = "relative before:absolute before:inset-y-0 before:inset-x-0 before:bg-blue-100";
  }

  return (
    <td
      {...tdProps}
      className={cn("p-0 text-center relative flex items-center justify-center w-full h-full", bgClass, className)}
    >
      {props.children}
    </td>
  );
}

function CalendarDayButton(props: any) {
  const { modifiers, className, ...btnProps } = props;
  const isEndpoint =
    modifiers?.range_start ||
    modifiers?.range_end ||
    (modifiers?.selected && !modifiers?.range_middle);
  const isMiddle = modifiers?.range_middle;
  const isToday = modifiers?.today;
  const isDisabled = modifiers?.disabled;
  const isOutside = modifiers?.outside;

  let styleClass = "text-slate-700 hover:bg-slate-100 font-medium";
  if (isEndpoint) {
    styleClass = "bg-blue-600 text-white font-bold shadow-xs hover:bg-blue-700";
  } else if (isMiddle) {
    // Di antara rentang: lingkaran berwarna biru yang lebih muda (bukan transparan)
    styleClass = "bg-blue-200 text-blue-900 font-semibold hover:bg-blue-300";
    if (isToday) {
      styleClass += " ring-2 ring-blue-400/60";
    }
  } else if (isToday) {
    styleClass = "text-blue-600 font-bold ring-2 ring-blue-500/30";
  }

  if (isDisabled) {
    styleClass += " opacity-30 cursor-not-allowed pointer-events-none text-slate-300";
  }
  if (isOutside) {
    styleClass += " opacity-25 text-slate-400";
  }

  return (
    <button
      {...btnProps}
      data-range-start={modifiers?.range_start ? "true" : undefined}
      data-range-end={modifiers?.range_end ? "true" : undefined}
      data-range-middle={modifiers?.range_middle ? "true" : undefined}
      data-selected={modifiers?.selected ? "true" : undefined}
      data-today={modifiers?.today ? "true" : undefined}
      data-disabled={modifiers?.disabled ? "true" : undefined}
      className={cn(
        "relative z-10 w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all mx-auto text-sm sm:text-base cursor-pointer",
        styleClass,
        className
      )}
    >
      {btnProps.children}
    </button>
  );
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = id,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      className={cn("p-2 sm:p-3 bg-white select-none", className)}
      classNames={{
        months: "w-full flex flex-col gap-2",
        month: "w-full flex flex-col gap-2",
        month_grid: "w-full border-collapse",
        weekdays: "grid grid-cols-7 mb-1 text-center",
        weekday: "text-[11px] font-bold text-slate-400 py-1 uppercase tracking-wider",
        weeks: "flex flex-col gap-1",
        week: "grid grid-cols-7 items-center justify-items-center",
        day: "relative p-0 text-center flex items-center justify-center w-full",
        ...classNames,
      }}
      components={{
        Nav: CalendarNav,
        MonthCaption: () => null,
        Day: CalendarDay,
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";
export type { DateRange };
