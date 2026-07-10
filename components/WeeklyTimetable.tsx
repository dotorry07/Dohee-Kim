import Link from "next/link";
import { dayLabels, toMinutes, weekdays } from "@/lib/timetable";
import type { ClassSchedule, PersonalSchedule } from "@/lib/types";

const hours = Array.from({ length: 10 }, (_, index) => 9 + index);

export function WeeklyTimetable({
  classes,
  personalSchedules
}: {
  classes: ClassSchedule[];
  personalSchedules?: PersonalSchedule[];
}) {
  return (
    <div className="weekly">
      <div className="weekly-grid" role="table" aria-label="주간 시간표">
        <div className="weekly-head">시간</div>
        {weekdays.map((day) => (
          <div className="weekly-head" key={day}>{dayLabels[day]}</div>
        ))}
        {hours.map((hour) => (
          <Row
            key={hour}
            hour={hour}
            classes={classes}
            personalSchedules={personalSchedules ?? []}
          />
        ))}
      </div>
    </div>
  );
}

function Row({
  hour,
  classes,
  personalSchedules
}: {
  hour: number;
  classes: ClassSchedule[];
  personalSchedules: PersonalSchedule[];
}) {
  const rangeStart = hour * 60;
  const rangeEnd = (hour + 1) * 60;

  return (
    <>
      <div className="time-cell">{String(hour).padStart(2, "0")}:00</div>
      {weekdays.map((day) => {
        const classItems = classes.filter((item) => item.dayOfWeek === day && intersectsHour(item, rangeStart, rangeEnd));
        const personalItems = personalSchedules.filter((item) => item.dayOfWeek === day && intersectsHour(item, rangeStart, rangeEnd));

        return (
          <div className="day-cell" key={`${day}-${hour}`}>
            {classItems.map((item) => (
              <Link
                className="class-block"
                style={{ background: item.color }}
                href={`/map?building=${encodeURIComponent(item.buildingName)}`}
                key={item.id}
              >
                <strong>{item.courseName}</strong>
                <span>{item.startTime}-{item.endTime}</span>
                <span>{item.buildingName} {item.roomName}</span>
              </Link>
            ))}
            {personalItems.map((item) => (
              <div className="class-block" style={{ background: "#6b7280" }} key={item.id}>
                <strong>{item.title}</strong>
                <span>{item.startTime}-{item.endTime}</span>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function intersectsHour(item: { startTime: string; endTime: string }, rangeStart: number, rangeEnd: number) {
  return toMinutes(item.startTime) < rangeEnd && rangeStart < toMinutes(item.endTime);
}
