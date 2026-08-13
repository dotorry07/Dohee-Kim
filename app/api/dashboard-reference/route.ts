import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import type { AcademicEvent, MealCampus, MealMenu } from "@/types/dashboard";

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const [eventsResult, mealsResult] = await Promise.all([
      supabase.from("academic_events").select("id, title, start_date, end_date, display_date").order("start_date"),
      supabase.from("campus_meals").select("campus, cafeteria, hours, price, menus_by_day")
    ]);

    if (eventsResult.error) throw eventsResult.error;
    if (mealsResult.error) throw mealsResult.error;

    const academicEvents: AcademicEvent[] = (eventsResult.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      startDate: row.start_date,
      endDate: row.end_date ?? undefined,
      displayDate: row.display_date
    }));

    const campusMeals = (mealsResult.data ?? []).reduce<Partial<Record<MealCampus, MealMenu>>>((result, row) => ({
      ...result,
      [row.campus as MealCampus]: {
        cafeteria: row.cafeteria,
        hours: row.hours,
        price: row.price,
        menusByDay: row.menus_by_day
      }
    }), {});

    return NextResponse.json({ academicEvents, campusMeals });
  } catch (error) {
    console.error("Dashboard reference load failed", error);
    return NextResponse.json({ academicEvents: [], campusMeals: {} });
  }
}
