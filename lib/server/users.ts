import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import type { UserProfile } from "@/lib/types";

export async function ensureDatabaseUser(user: UserProfile) {
  const supabase = createSupabaseAdminClient();
  const baseUserFields = {
    auth_user_id: isUuid(user.authUserId) ? user.authUserId : null,
    name: user.name,
    nickname: user.nickname,
    users_nickname: user.nickname,
    department: user.department,
    grade: user.grade,
    role: user.role
  };
  const existing = await supabase
    .from("users")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (existing.error) {
    throw existing.error;
  }

  if (existing.data?.id) {
    const { error } = await supabase
      .from("users")
      .update(baseUserFields)
      .eq("id", existing.data.id);

    if (error) throw error;
    await updateOptionalUserColumns(existing.data.id as string, user);
    return existing.data.id as string;
  }

  const created = await supabase
    .from("users")
    .insert({
      email: user.email,
      ...baseUserFields
    })
    .select("id")
    .single();

  if (created.error) {
    throw created.error;
  }

  await updateOptionalUserColumns(created.data.id as string, user);
  return created.data.id as string;
}

export async function loadDatabaseUserByEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, email, name, nickname, users_nickname, department, grade, role, created_at")
    .eq("email", email)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    authUserId: data.auth_user_id ?? "",
    email: data.email,
    name: data.name,
    nickname: data.users_nickname || data.nickname,
    department: data.department,
    secondaryDepartment: await loadOptionalUserColumn(email, "secondary_department"),
    studentNumber: await loadOptionalUserColumn(email, "student_number"),
    profileImageUrl: await loadOptionalUserColumn(email, "profile_image_url"),
    grade: data.grade,
    role: data.role,
    createdAt: data.created_at
  } satisfies UserProfile;
}

export async function loadDatabaseUserByAuthUserId(authUserId: string) {
  if (!isUuid(authUserId)) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, email, name, nickname, users_nickname, department, grade, role, created_at")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    authUserId: data.auth_user_id ?? "",
    email: data.email,
    name: data.name,
    nickname: data.users_nickname || data.nickname,
    department: data.department,
    secondaryDepartment: await loadOptionalUserColumn(data.email, "secondary_department"),
    studentNumber: await loadOptionalUserColumn(data.email, "student_number"),
    profileImageUrl: await loadOptionalUserColumn(data.email, "profile_image_url"),
    grade: data.grade,
    role: data.role,
    createdAt: data.created_at
  } satisfies UserProfile;
}

export async function loadDatabaseUserById(userId: string) {
  if (!isUuid(userId)) return null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, auth_user_id, email, name, nickname, users_nickname, department, grade, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    authUserId: data.auth_user_id ?? "",
    email: data.email,
    name: data.name,
    nickname: data.users_nickname || data.nickname,
    department: data.department,
    secondaryDepartment: await loadOptionalUserColumn(data.email, "secondary_department"),
    studentNumber: await loadOptionalUserColumn(data.email, "student_number"),
    profileImageUrl: await loadOptionalUserColumn(data.email, "profile_image_url"),
    grade: data.grade,
    role: data.role,
    createdAt: data.created_at
  } satisfies UserProfile;
}

export async function updateDatabaseUserProfile(user: UserProfile, profile: Partial<Pick<UserProfile, "email" | "name" | "nickname" | "department" | "secondaryDepartment" | "studentNumber" | "profileImageUrl" | "grade">>) {
  const supabase = createSupabaseAdminClient();
  const userId = isUuid(user.id) ? user.id : await ensureDatabaseUser(user);
  const baseFields: Record<string, unknown> = {};

  if (profile.email !== undefined) baseFields.email = profile.email;
  if (profile.name !== undefined) baseFields.name = profile.name;
  if (profile.nickname !== undefined) {
    baseFields.nickname = profile.nickname;
    baseFields.users_nickname = profile.nickname;
  }
  if (profile.department !== undefined) baseFields.department = profile.department;
  if (profile.grade !== undefined) baseFields.grade = profile.grade;

  if (Object.keys(baseFields).length) {
    const { error } = await supabase
      .from("users")
      .update(baseFields)
      .eq("id", userId);

    if (error) throw error;
  }

  const optionalColumns = [
    ["secondary_department", profile.secondaryDepartment],
    ["student_number", profile.studentNumber],
    ["profile_image_url", profile.profileImageUrl]
  ] as const;

  for (const [column, value] of optionalColumns) {
    if (value === undefined) continue;

    const { error } = await supabase
      .from("users")
      .update({ [column]: value || null })
      .eq("id", userId);

    if (error && !canIgnoreMissingOptionalColumn(column, error)) {
      throw error;
    }
  }

  return userId;
}

async function updateOptionalUserColumns(userId: string, user: UserProfile) {
  const supabase = createSupabaseAdminClient();
  const optionalColumns = [
    ["secondary_department", user.secondaryDepartment || null],
    ["student_number", user.studentNumber || null]
  ] as const;

  for (const [column, value] of optionalColumns) {
    const { error } = await supabase
      .from("users")
      .update({ [column]: value })
      .eq("id", userId);

    if (error && !isMissingColumnError(error)) {
      throw error;
    }
  }
}

async function loadOptionalUserColumn(email: string, column: "secondary_department" | "student_number" | "profile_image_url") {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select(column)
    .eq("email", email)
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error)) {
      return "";
    }

    throw error;
  }

  const row = data as Record<string, unknown> | null;
  return typeof row?.[column] === "string" ? row[column] : "";
}

function isMissingColumnError(error: { code?: string; message?: string }) {
  return error.code === "PGRST204" || error.code === "42703" || Boolean(error.message?.includes("Could not find") || error.message?.includes("does not exist"));
}

function canIgnoreMissingOptionalColumn(column: string, error: { code?: string; message?: string }) {
  return column !== "profile_image_url" && isMissingColumnError(error);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i.test(value);
}
