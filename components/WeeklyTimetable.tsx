import Link from "next/link";
import { dayLabels, isRecordedRemoteClass, toMinutes, weekdays } from "@/lib/timetable";
import type { CSSProperties } from "react";
import type { ClassSchedule, PersonalSchedule } from "@/lib/types";

const hours = Array.from({ length: 12 }, (_, index) => 9 + index);

export function WeeklyTimetable({
  classes,
  personalSchedules
}: {
  classes: ClassSchedule[];
  personalSchedules?: PersonalSchedule[];
}) {
  const onlineClasses = classes.filter(isRecordedRemoteClass);
  const mergedClasses = mergeAdjacentClasses(classes.filter((item) => !isRecordedRemoteClass(item))).filter(isInVisibleTimeRange);
  const schedules = (personalSchedules ?? []).filter((item) => weekdays.includes(item.dayOfWeek as (typeof weekdays)[number]) && isInVisibleTimeRange(item));

  return (
    <div className="weekly">
      <div className="weekly-grid" role="table" aria-label="주간 시간표">
        <div className="weekly-head">시간</div>
        {weekdays.map((day) => (
          <div className="weekly-head" key={day}>{dayLabels[day]}</div>
        ))}
        {hours.map((hour) => (
          <Row key={hour} hour={hour} />
        ))}
        {mergedClasses.map((item) => (
          <Link
            className="class-block"
            style={{ ...getOverlayStyle(item), background: item.color }}
            href={`/map?building=${encodeURIComponent(item.buildingName)}`}
            key={item.id}
          >
            <strong>{item.courseName}</strong>
            <span>{item.startTime}-{item.endTime}</span>
            <span>{item.buildingName} {item.roomName}</span>
          </Link>
        ))}
        {schedules.map((item) => (
          <div className="class-block personal-block" style={getOverlayStyle(item)} key={item.id}>
            <strong>{item.title}</strong>
            <span>{item.startTime}-{item.endTime}</span>
          </div>
        ))}
      </div>
      <OnlineClassLane classes={onlineClasses} />
    </div>
  );
}

function Row({ hour }: { hour: number }) {
  return (
    <>
      <div className="time-cell">{String(hour).padStart(2, "0")}:00</div>
      {weekdays.map((day) => <div className="day-cell" key={`${day}-${hour}`} />)}
    </>
  );
}

function mergeAdjacentClasses(classes: ClassSchedule[]) {
  const sorted = [...classes].sort((left, right) => {
    if (left.dayOfWeek !== right.dayOfWeek) {
      return weekdays.indexOf(left.dayOfWeek) - weekdays.indexOf(right.dayOfWeek);
    }

    return toMinutes(left.startTime) - toMinutes(right.startTime);
  });

  return sorted.reduce<ClassSchedule[]>((merged, item) => {
    const previous = merged[merged.length - 1];
    const isSameClass =
      previous &&
      previous.dayOfWeek === item.dayOfWeek &&
      previous.courseName === item.courseName &&
      previous.professorName === item.professorName &&
      previous.buildingName === item.buildingName &&
      previous.roomName === item.roomName &&
      previous.endTime === item.startTime;

    if (isSameClass) {
      merged[merged.length - 1] = {
        ...previous,
        endTime: item.endTime,
        memo: previous.memo || item.memo
      };
      return merged;
    }

    merged.push(item);
    return merged;
  }, []);
}

function OnlineClassLane({ classes }: { classes: ClassSchedule[] }) {
  return (
    <section className="online-class-lane" aria-label="온라인 강의">
      <div className="online-class-label">온라인 강의</div>
      <div className="online-class-list">
        {classes.length ? (
          classes.map((item) => (
            <div className="online-class-card" key={item.id}>
              <strong>{item.courseName}</strong>
              <span>{item.professorName || "교수 미정"} · {item.lessonTypeName || "원격 강의"}</span>
              <span>{item.startTime}-{item.endTime}</span>
            </div>
          ))
        ) : (
          <span className="online-class-empty">표시할 온라인 강의가 없습니다.</span>
        )}
      </div>
    </section>
  );
}

function getOverlayStyle(item: { dayOfWeek: string; startTime: string; endTime: string }) {
  const dayIndex = weekdays.indexOf(item.dayOfWeek as (typeof weekdays)[number]);
  const start = Math.max(toMinutes(item.startTime), hours[0] * 60);
  const end = Math.min(toMinutes(item.endTime), (hours[hours.length - 1] + 1) * 60);
  const startSlot = (start - hours[0] * 60) / 60;
  const durationSlots = Math.max((end - start) / 60, 0.5);

  return {
    "--day-index": dayIndex,
    "--start-slot": startSlot,
    "--duration-slots": durationSlots
  } as CSSProperties;
}

function isInVisibleTimeRange(item: { startTime: string; endTime: string }) {
  const start = Math.max(toMinutes(item.startTime), hours[0] * 60);
  const end = Math.min(toMinutes(item.endTime), (hours[hours.length - 1] + 1) * 60);
  return end > start;
}
