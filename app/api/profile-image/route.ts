import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-admin";
import { loadDatabaseUserByEmail, updateDatabaseUserProfile } from "@/lib/server/users";
import type { UserProfile } from "@/lib/types";

type ProfileImageRequest = {
  user?: UserProfile;
  imageDataUrl?: string;
};

const bucketName = "user-profile-images";
const maxImageBytes = 2 * 1024 * 1024;
const mimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as ProfileImageRequest;
  const user = body.user;

  if (!user?.email) {
    return NextResponse.json({ error: "Missing user.", reason: "missing_user" }, { status: 400 });
  }

  try {
    if (!body.imageDataUrl) {
      await updateDatabaseUserProfile(user, { profileImageUrl: "" });
      const updated = await loadDatabaseUserByEmail(user.email);
      return NextResponse.json({ user: updated ?? { ...user, profileImageUrl: "" } });
    }

    const parsedImage = parseImageDataUrl(body.imageDataUrl);
    if (!parsedImage) {
      return NextResponse.json({ error: "Invalid image.", reason: "invalid_image" }, { status: 400 });
    }

    if (parsedImage.buffer.byteLength > maxImageBytes) {
      return NextResponse.json({ error: "Image too large.", reason: "image_too_large" }, { status: 413 });
    }

    const profile = await loadDatabaseUserByEmail(user.email);
    const databaseUser = profile ?? user;
    const storageOwner = databaseUser.authUserId || databaseUser.id;
    const filePath = `${storageOwner}/profile.${parsedImage.extension}`;
    const supabase = createSupabaseAdminClient();
    await ensureProfileImageBucket(supabase);

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, parsedImage.buffer, {
        cacheControl: "3600",
        contentType: parsedImage.mimeType,
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    const profileImageUrl = `${data.publicUrl}?v=${Date.now()}`;

    await updateDatabaseUserProfile(databaseUser, { profileImageUrl });
    const updated = await loadDatabaseUserByEmail(user.email);
    return NextResponse.json({ user: updated ?? { ...databaseUser, profileImageUrl } });
  } catch (error) {
    console.error("Profile image update failed", error);
    return NextResponse.json({ error: "Profile image update failed.", reason: getProfileImageFailureReason(error) }, { status: 500 });
  }
}

async function ensureProfileImageBucket(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const { error } = await supabase.storage.getBucket(bucketName);
  if (!error) return;

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    allowedMimeTypes: Object.keys(mimeToExtension),
    fileSizeLimit: maxImageBytes,
    public: true
  });

  if (createError) {
    throw createError;
  }
}

function getProfileImageFailureReason(error: unknown) {
  const storageOrDatabaseError = error as { code?: string; message?: string; details?: string };
  const text = `${storageOrDatabaseError.message ?? ""} ${storageOrDatabaseError.details ?? ""}`.toLowerCase();

  if (text.includes("supabase admin environment variables")) {
    return "missing_supabase_admin_env";
  }

  if (storageOrDatabaseError.code === "PGRST204" || storageOrDatabaseError.code === "42703" || text.includes("profile_image_url")) {
    return "missing_profile_image_column";
  }

  if (text.includes("bucket") || text.includes("storage")) {
    return "profile_image_storage_failed";
  }

  return "profile_image_update_failed";
}

function parseImageDataUrl(value: string) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) return null;

  const mimeType = match[1];
  const extension = mimeToExtension[mimeType];
  if (!extension) return null;

  return {
    buffer: Buffer.from(match[2], "base64"),
    extension,
    mimeType
  };
}
