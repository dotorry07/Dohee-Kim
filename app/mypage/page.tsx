"use client";

import Link from "next/link";
import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AuthGuard } from "@/components/AuthGuard";
import { BannerTagIcon } from "@/components/BannerTagIcon";
import { signOut, updateRemoteProfile, updateStoredProfile } from "@/lib/auth/client";
import {
  getDepartmentNotificationPreferences,
  loadDepartmentNotificationPreferences,
  updateDepartmentNotificationPreference,
  type DepartmentNotificationPreferences,
  type DepartmentNotificationTarget
} from "@/lib/department-notifications";
import { extractStudentNumber, getGradeFromStudentNumber } from "@/lib/student";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/types";

type MyPageIconName = "bell" | "book" | "building" | "calendar" | "chevron" | "edit" | "id" | "info" | "lock" | "logout" | "mail" | "megaphone" | "school" | "settings" | "shield" | "user";

function MyPageIcon({ name }: { name: MyPageIconName }) {
  const paths: Record<MyPageIconName, ReactNode> = {
    bell: <><path d="M6.8 16.5h10.4l-1.1-1.7V11a4.1 4.1 0 0 0-8.2 0v3.8z" /><path d="M10.2 18.2a2 2 0 0 0 3.6 0" /></>,
    book: <><path d="M5.5 5.5c2.7 0 4.4.5 6.5 2v11c-2.1-1.5-3.8-2-6.5-2z" /><path d="M18.5 5.5c-2.7 0-4.4.5-6.5 2v11c2.1-1.5 3.8-2 6.5-2z" /></>,
    building: <><path d="M5.5 19.5h13" /><path d="M7 19.5v-12l5-2.5 5 2.5v12" /><path d="M10 10h.1M14 10h.1M10 13h.1M14 13h.1" /></>,
    calendar: <><path d="M7 4.5v3M17 4.5v3M5 8.5h14M6 6h12a1.5 1.5 0 0 1 1.5 1.5v11H4.5v-11A1.5 1.5 0 0 1 6 6Z" /><path d="M8 12.5h2M14 12.5h2M8 16h2" /></>,
    chevron: <path d="m10 6 6 6-6 6" />,
    edit: <><path d="M5 18.8h4l9.5-9.5a2.1 2.1 0 0 0-3-3L6 15.8z" /><path d="M13.8 8 16 10.2" /></>,
    id: <><path d="M5 6.5h14v11H5z" /><circle cx="10" cy="11" r="2" /><path d="M8 15c.5-1.2 1.2-1.8 2-1.8s1.5.6 2 1.8M14.5 10h2M14.5 13h2" /></>,
    info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11.2v4.6" /><path d="M12 8.2h.1" /></>,
    lock: <><path d="M7 10h10v9H7z" /><path d="M9.2 10V7.8a2.8 2.8 0 0 1 5.6 0V10" /><path d="M12 14v1.8" /></>,
    logout: <><path d="M10 6H6.5v12H10" /><path d="M13 8.5 16.5 12 13 15.5" /><path d="M16.5 12H9.5" /></>,
    mail: <><path d="M5 7h14v10H5z" /><path d="m5.5 8 6.5 5 6.5-5" /></>,
    megaphone: <><path d="m4 13 3 1 9 4V6l-9 4-3 1v2Z" /><path d="m7 14 1 5h3l-1-4" /></>,
    school: <><path d="m4 9 8-4 8 4-8 4z" /><path d="M7 11.2v3.2c1.6 1.8 8.4 1.8 10 0v-3.2" /><path d="M20 9v5" /></>,
    settings: <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.63h.01A1.7 1.7 0 0 0 10.04 3.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.37 9v.01A1.7 1.7 0 0 0 20.9 10H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
    </>,
    shield: <><path d="M12 3.8 18 6v5.2c0 3.8-2.2 6.7-6 8.3-3.8-1.6-6-4.5-6-8.3V6z" /><path d="m9.5 12 1.7 1.7 3.4-4" /></>,
    user: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 19c1.2-3.5 3.4-5.2 6.5-5.2s5.3 1.7 6.5 5.2" /></>
  };

  return (
    <svg aria-hidden="true" className="mypage-icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={name === "settings" ? 2.65 : 1.9} viewBox="0 0 24 24">
      {paths[name]}
    </svg>
  );
}

function MyPageModalLayer({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);
  if (!isMounted) return null;

  return createPortal(
    <div className="modal-backdrop mypage-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      {children}
    </div>,
    document.body
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(new Date(date));
}

type LocalNotificationSettings = {
  allEnabled: boolean;
  importantEnabled: boolean;
  boardEnabled: boolean;
};

type LocalProfileSettings = {
  nickname: string;
  image: string;
};

function localProfileSettingsKey(userId: string) {
  return `newbie-on:mypage-profile:${userId}`;
}

function loadLocalProfileSettings(user: UserProfile): LocalProfileSettings {
  if (typeof window === "undefined") return { nickname: user.nickname || user.name, image: "" };

  try {
    const raw = window.localStorage.getItem(localProfileSettingsKey(user.id));
    const parsed = raw ? JSON.parse(raw) as Partial<LocalProfileSettings> : {};
    return {
      nickname: parsed.nickname?.trim() || user.nickname || user.name,
      image: typeof parsed.image === "string" ? parsed.image : ""
    };
  } catch {
    return { nickname: user.nickname || user.name, image: "" };
  }
}

const defaultLocalNotificationSettings: LocalNotificationSettings = {
  allEnabled: true,
  importantEnabled: true,
  boardEnabled: false
};

function localNotificationSettingsKey(userId: string) {
  return `newbie-on:notification-settings:${userId}`;
}

function loadLocalNotificationSettings(userId: string): LocalNotificationSettings {
  if (typeof window === "undefined") {
    return defaultLocalNotificationSettings;
  }

  try {
    const raw = window.localStorage.getItem(localNotificationSettingsKey(userId));
    const parsed = raw ? JSON.parse(raw) as Partial<LocalNotificationSettings> : {};

    return {
      allEnabled: typeof parsed.allEnabled === "boolean" ? parsed.allEnabled : defaultLocalNotificationSettings.allEnabled,
      importantEnabled: typeof parsed.importantEnabled === "boolean" ? parsed.importantEnabled : defaultLocalNotificationSettings.importantEnabled,
      boardEnabled: typeof parsed.boardEnabled === "boolean" ? parsed.boardEnabled : defaultLocalNotificationSettings.boardEnabled
    };
  } catch {
    return defaultLocalNotificationSettings;
  }
}

export default function MyPage() {
  return <AuthGuard>{(user) => <MyPageContent user={user} />}</AuthGuard>;
}

function MyPageContent({ user }: { user: UserProfile }) {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isPasswordSettingsOpen, setIsPasswordSettingsOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [localProfile, setLocalProfile] = useState<LocalProfileSettings>(() => loadLocalProfileSettings(user));
  const [draftLocalProfile, setDraftLocalProfile] = useState<LocalProfileSettings>(() => loadLocalProfileSettings(user));
  const [profileEditError, setProfileEditError] = useState("");
  const [profileForm, setProfileForm] = useState({
    name: user.name,
    department: user.department,
    secondaryDepartment: user.secondaryDepartment ?? ""
  });
  const [passwordForm, setPasswordForm] = useState({ password: "", passwordConfirm: "" });
  const [settingsError, setSettingsError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<DepartmentNotificationPreferences>(() => (
    getDepartmentNotificationPreferences(user.id)
  ));
  const [draftNotificationPreferences, setDraftNotificationPreferences] = useState<DepartmentNotificationPreferences>(notificationPreferences);
  const [localNotificationSettings, setLocalNotificationSettings] = useState<LocalNotificationSettings>(() => (
    loadLocalNotificationSettings(user.id)
  ));
  const storedStudentNumber = user.studentNumber || extractStudentNumber(user.id);
  const studentNumber = storedStudentNumber || "학번 미등록";
  const displayGrade = storedStudentNumber ? getGradeFromStudentNumber(storedStudentNumber) : user.grade;
  const profileInitial = (localProfile.nickname || user.name).slice(0, 1);
  const hasSecondaryDepartment = Boolean(user.secondaryDepartment?.trim());

  useEffect(() => {
    let ignore = false;

    void loadDepartmentNotificationPreferences(user).then((preferences) => {
      if (!ignore) {
        setNotificationPreferences(preferences);
        setDraftNotificationPreferences(preferences);
      }
    });
    setLocalNotificationSettings(loadLocalNotificationSettings(user.id));
    const savedProfile = loadLocalProfileSettings(user);
    setLocalProfile(savedProfile);
    setDraftLocalProfile(savedProfile);

    return () => {
      ignore = true;
    };
  }, [user]);

  const openProfileEdit = () => {
    setDraftLocalProfile(localProfile);
    setProfileEditError("");
    setIsProfileEditOpen(true);
  };

  const handleProfileImageChange = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setProfileEditError("이미지 파일만 선택할 수 있습니다.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileEditError("프로필 이미지는 2MB 이하로 선택해 주세요.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraftLocalProfile((current) => ({ ...current, image: reader.result as string }));
        setProfileEditError("");
      }
    };
    reader.onerror = () => setProfileEditError("이미지를 불러오지 못했습니다.");
    reader.readAsDataURL(file);
  };

  const saveLocalProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nickname = draftLocalProfile.nickname.trim();
    if (nickname.length < 2 || nickname.length > 12) {
      setProfileEditError("프로필 닉네임은 2~12자로 입력해 주세요.");
      return;
    }

    const nextProfile = { ...draftLocalProfile, nickname };
    window.localStorage.setItem(localProfileSettingsKey(user.id), JSON.stringify(nextProfile));
    window.dispatchEvent(new CustomEvent("newbie-on:mypage-profile-updated", { detail: { userId: user.id } }));
    setLocalProfile(nextProfile);
    setDraftLocalProfile(nextProfile);
    setIsProfileEditOpen(false);
  };

  const handleLogout = () => {
    signOut();
    setIsLogoutConfirmOpen(false);
    window.location.href = "/";
  };

  const openProfileSettings = () => {
    setProfileForm({
      name: user.name,
      department: user.department,
      secondaryDepartment: user.secondaryDepartment ?? ""
    });
    setSettingsError("");
    setSettingsMessage("");
    setIsAccountSettingsOpen(false);
    setIsProfileSettingsOpen(true);
  };

  const openPasswordSettings = () => {
    setPasswordForm({ password: "", passwordConfirm: "" });
    setSettingsError("");
    setSettingsMessage("");
    setIsAccountSettingsOpen(false);
    setIsPasswordSettingsOpen(true);
  };

  const saveProfileSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = profileForm.name.trim();
    const department = profileForm.department.trim();
    const secondaryDepartment = profileForm.secondaryDepartment.trim();

    if (name.length < 2 || !department) {
      setSettingsError("이름과 소속을 확인해 주세요.");
      return;
    }

    setIsSettingsSaving(true);
    setSettingsError("");
    const localUser = updateStoredProfile({ name, department, secondaryDepartment });
    await updateRemoteProfile(localUser ?? user, { name, department, secondaryDepartment });
    setIsSettingsSaving(false);
    window.location.reload();
  };

  const savePasswordSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordForm.password.length < 8) {
      setSettingsError("비밀번호는 8자 이상 입력해 주세요.");
      return;
    }
    if (passwordForm.password !== passwordForm.passwordConfirm) {
      setSettingsError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setIsSettingsSaving(true);
    setSettingsError("");
    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.password });
      if (error) {
        setSettingsError(error.message || "비밀번호를 변경하지 못했습니다.");
        setIsSettingsSaving(false);
        return;
      }
    }
    setPasswordForm({ password: "", passwordConfirm: "" });
    setSettingsMessage("비밀번호가 변경되었습니다.");
    setIsSettingsSaving(false);
  };

  const openNotificationSettings = () => {
    setDraftNotificationPreferences(notificationPreferences);
    setIsNotificationSettingsOpen(true);
  };

  const closeNotificationSettings = () => {
    setDraftNotificationPreferences(notificationPreferences);
    setIsNotificationSettingsOpen(false);
  };

  const handleDraftNotificationToggle = (target: DepartmentNotificationTarget, enabled: boolean) => {
    if (target === "secondary" && !hasSecondaryDepartment) {
      return;
    }

    const enabledKey = target === "primary" ? "primaryEnabled" : "secondaryEnabled";
    setDraftNotificationPreferences((current) => ({
      ...current,
      [enabledKey]: enabled
    }));
  };

  const updateLocalNotificationSetting = (key: keyof LocalNotificationSettings, enabled: boolean) => {
    const next = {
      ...localNotificationSettings,
      [key]: enabled
    };
    setLocalNotificationSettings(next);
    window.localStorage.setItem(localNotificationSettingsKey(user.id), JSON.stringify(next));
  };

  const updateDepartmentNotificationSetting = async (target: DepartmentNotificationTarget, enabled: boolean) => {
    if (target === "secondary" && !hasSecondaryDepartment) {
      return;
    }

    const nextPreferences = updateDepartmentNotificationPreference(user, target, enabled);
    setNotificationPreferences(nextPreferences);
    setDraftNotificationPreferences(nextPreferences);

    if (enabled && "Notification" in window && window.Notification.permission === "default") {
      try {
        await window.Notification.requestPermission();
      } catch {
        // In-app alerts still work when browser notification permission is unavailable.
      }
    }
  };

  const saveNotificationSettings = async () => {
    let nextPreferences = notificationPreferences;

    if (draftNotificationPreferences.primaryEnabled !== notificationPreferences.primaryEnabled) {
      nextPreferences = updateDepartmentNotificationPreference(user, "primary", draftNotificationPreferences.primaryEnabled);
    }

    if (hasSecondaryDepartment && draftNotificationPreferences.secondaryEnabled !== notificationPreferences.secondaryEnabled) {
      nextPreferences = updateDepartmentNotificationPreference(user, "secondary", draftNotificationPreferences.secondaryEnabled);
    }

    setNotificationPreferences(nextPreferences);
    setDraftNotificationPreferences(nextPreferences);
    setIsNotificationSettingsOpen(false);

    const isTurningOn = (
      draftNotificationPreferences.primaryEnabled && !notificationPreferences.primaryEnabled
    ) || (
      hasSecondaryDepartment && draftNotificationPreferences.secondaryEnabled && !notificationPreferences.secondaryEnabled
    );

    if (isTurningOn && "Notification" in window && window.Notification.permission === "default") {
      try {
        await window.Notification.requestPermission();
      } catch {
        // In-app alerts still work when browser notification permission is unavailable.
      }
    }
  };

  const accountRows = [
    { icon: "user" as const, label: "이름", value: user.name },
    { icon: "id" as const, label: "닉네임", value: localProfile.nickname },
    { icon: "mail" as const, label: "이메일", value: user.email },
    { icon: "school" as const, label: "학번", value: studentNumber },
    { icon: "building" as const, label: "소속", value: user.department },
    ...(user.secondaryDepartment ? [{ icon: "building" as const, label: "부/복수전공", value: user.secondaryDepartment }] : []),
    { icon: "calendar" as const, label: "가입일", value: formatDate(user.createdAt) }
  ];

  return (
    <main className="page mypage-page">
      <section className="mypage-hero" aria-labelledby="mypage-title">
        <div className="mypage-hero-inner">
          <div className="mypage-hero-copy">
            <h1 id="mypage-title">마이페이지</h1>
            <p>내 프로필과 학교생활 관리 메뉴를 확인합니다.</p>
            <div className="app-banner-tags mypage-hero-tags" aria-hidden="true">
              <span><BannerTagIcon icon="user" />내 정보 관리</span>
              <span><BannerTagIcon icon="bell" />알림 설정</span>
              <span><BannerTagIcon icon="lock" />보안 관리</span>
              <span><BannerTagIcon icon="logout" />로그아웃</span>
            </div>
          </div>
          <div className="mypage-hero-art" aria-hidden="true">
            <img src="/images/mypage-banner.png" alt="" />
          </div>
        </div>
      </section>

      <section className="grid two mypage-layout">
        <article className="panel mypage-profile">
          <div
            className={`mypage-avatar${localProfile.image ? " has-image" : ""}`}
            style={localProfile.image ? { backgroundImage: `url(${localProfile.image})` } : undefined}
            aria-hidden="true"
          >{localProfile.image ? null : profileInitial}</div>
          <div className="mypage-profile-copy">
            <p className="mypage-eyebrow">MY PROFILE</p>
            <div className="mypage-name-row">
              <h2>{localProfile.nickname}</h2>
              <button className="mypage-edit-button" type="button" onClick={openProfileEdit}>프로필 수정<MyPageIcon name="edit" /></button>
            </div>
            <p className="muted">{user.department} · {displayGrade}학년</p>
          </div>
        </article>

        <article className="panel mypage-manage">
          <div className="section-title">
            <h2>내 정보 관리</h2>
          </div>
          <div className="mypage-manage-actions">
            <button type="button" onClick={() => setIsAccountSettingsOpen(true)}>
              <span><MyPageIcon name="settings" /></span>
              설정
            </button>
            <button type="button" onClick={openNotificationSettings}>
              <span><MyPageIcon name="bell" /></span>
              알림 설정
            </button>
            <button type="button" onClick={() => setIsLogoutConfirmOpen(true)}>
              <span><MyPageIcon name="logout" /></span>
              로그아웃
            </button>
          </div>
        </article>
      </section>

      <section className="panel mypage-details">
        <div className="section-title">
          <h2>계정 정보</h2>
        </div>
        <dl>
          {accountRows.map((row) => (
            <div key={row.label}>
              <dt><span><MyPageIcon name={row.icon} /></span>{row.label}</dt>
              <dd>{row.value}</dd>
              <Link href="/mypage/edit" aria-label={`${row.label} 수정`}>
                <MyPageIcon name="chevron" />
              </Link>
            </div>
          ))}
        </dl>
      </section>

      {isProfileEditOpen ? (
        <MyPageModalLayer onClose={() => setIsProfileEditOpen(false)}>
          <section className="account-form-modal profile-edit-modal" role="dialog" aria-modal="true" aria-labelledby="profile-edit-title">
            <div className="account-form-header">
              <div><p>MY PROFILE</p><h2 id="profile-edit-title">프로필 수정</h2></div>
              <button type="button" aria-label="프로필 수정 닫기" onClick={() => setIsProfileEditOpen(false)}>×</button>
            </div>
            <form onSubmit={saveLocalProfile}>
              <div className="profile-image-editor">
                <div
                  className={`profile-image-preview${draftLocalProfile.image ? " has-image" : ""}`}
                  style={draftLocalProfile.image ? { backgroundImage: `url(${draftLocalProfile.image})` } : undefined}
                >{draftLocalProfile.image ? null : (draftLocalProfile.nickname || user.name).slice(0, 1)}</div>
                <div>
                  <label className="profile-image-button">
                    이미지 선택<MyPageIcon name="edit" />
                    <input type="file" accept="image/*" onChange={(event) => handleProfileImageChange(event.target.files?.[0])} />
                  </label>
                  {draftLocalProfile.image ? <button type="button" className="profile-image-remove" onClick={() => setDraftLocalProfile((current) => ({ ...current, image: "" }))}>기본 이미지로 변경</button> : null}
                </div>
              </div>
              <label>프로필 닉네임<input value={draftLocalProfile.nickname} maxLength={12} onChange={(event) => setDraftLocalProfile((current) => ({ ...current, nickname: event.target.value }))} /></label>
              <p className="profile-edit-help">프로필 닉네임은 개인정보의 이름과 별도로 사용됩니다.</p>
              {profileEditError ? <p className="account-form-error">{profileEditError}</p> : null}
              <div className="account-form-actions"><button type="button" onClick={() => setIsProfileEditOpen(false)}>취소</button><button type="submit">저장</button></div>
            </form>
          </section>
        </MyPageModalLayer>
      ) : null}

      {isAccountSettingsOpen ? (
        <MyPageModalLayer onClose={() => setIsAccountSettingsOpen(false)}>
          <section className="account-settings-modal" role="dialog" aria-modal="true" aria-labelledby="mypage-account-settings-title">
            <div className="account-settings-header">
              <div>
                <p>ACCOUNT SETTINGS</p>
                <h2 id="mypage-account-settings-title">설정</h2>
                <span>계정 및 보안 관련 설정을 관리할 수 있습니다.</span>
              </div>
              <button type="button" aria-label="설정 닫기" onClick={() => setIsAccountSettingsOpen(false)}>
                <i aria-hidden="true" />
              </button>
            </div>
            <div className="account-settings-list">
              <button type="button" onClick={openProfileSettings}>
                <span><MyPageIcon name="user" /></span>
                <div>
                  <strong>개인정보 수정</strong>
                  <small>이름, 학과, 연락처 등 개인 정보를 관리합니다.</small>
                </div>
                <b><MyPageIcon name="chevron" /></b>
              </button>
              <button type="button" onClick={openPasswordSettings}>
                <span><MyPageIcon name="lock" /></span>
                <div>
                  <strong>비밀번호 변경</strong>
                  <small>계정 비밀번호를 안전하게 변경합니다.</small>
                </div>
                <b><MyPageIcon name="chevron" /></b>
              </button>
            </div>
            <div className="account-settings-note">
              <MyPageIcon name="info" />
              <div>
                <strong>계정 보안을 위해 주기적으로 비밀번호를 변경해주세요.</strong>
                <p>개인정보 및 보안 설정은 안전하게 보호됩니다.</p>
              </div>
              <span aria-hidden="true">
                <MyPageIcon name="shield" />
                <i><MyPageIcon name="lock" /></i>
              </span>
            </div>
          </section>
        </MyPageModalLayer>
      ) : null}

      {isProfileSettingsOpen ? (
        <MyPageModalLayer onClose={() => setIsProfileSettingsOpen(false)}>
          <section className="account-form-modal personal-info-modal" role="dialog" aria-modal="true" aria-labelledby="profile-settings-title">
            <div className="account-form-header">
              <div><p>ACCOUNT SETTINGS</p><h2 id="profile-settings-title">개인정보 수정</h2></div>
              <button type="button" aria-label="개인정보 수정 닫기" onClick={() => setIsProfileSettingsOpen(false)}>×</button>
            </div>
            <form onSubmit={saveProfileSettings}>
              <label>이름<input value={profileForm.name} maxLength={20} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} /></label>
              <label>소속<input value={profileForm.department} maxLength={40} onChange={(event) => setProfileForm((current) => ({ ...current, department: event.target.value }))} /></label>
              <label>부/복수전공<input value={profileForm.secondaryDepartment} maxLength={40} placeholder="미등록" onChange={(event) => setProfileForm((current) => ({ ...current, secondaryDepartment: event.target.value }))} /></label>
              {settingsError ? <p className="account-form-error">{settingsError}</p> : null}
              <div className="account-form-actions"><button type="button" onClick={() => setIsProfileSettingsOpen(false)}>취소</button><button type="submit" disabled={isSettingsSaving}>{isSettingsSaving ? "저장 중" : "저장"}</button></div>
            </form>
          </section>
        </MyPageModalLayer>
      ) : null}

      {isPasswordSettingsOpen ? (
        <MyPageModalLayer onClose={() => setIsPasswordSettingsOpen(false)}>
          <section className="account-form-modal" role="dialog" aria-modal="true" aria-labelledby="password-settings-title">
            <div className="account-form-header">
              <div><p>SECURITY SETTINGS</p><h2 id="password-settings-title">비밀번호 변경</h2></div>
              <button type="button" aria-label="비밀번호 변경 닫기" onClick={() => setIsPasswordSettingsOpen(false)}>×</button>
            </div>
            <form onSubmit={savePasswordSettings}>
              <label>새 비밀번호<input type="password" autoComplete="new-password" value={passwordForm.password} placeholder="8자 이상 입력해 주세요" onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))} /></label>
              <label>새 비밀번호 확인<input type="password" autoComplete="new-password" value={passwordForm.passwordConfirm} placeholder="비밀번호를 다시 입력해 주세요" onChange={(event) => setPasswordForm((current) => ({ ...current, passwordConfirm: event.target.value }))} /></label>
              {settingsError ? <p className="account-form-error">{settingsError}</p> : null}
              {settingsMessage ? <p className="account-form-message">{settingsMessage}</p> : null}
              <div className="account-form-actions"><button type="button" onClick={() => setIsPasswordSettingsOpen(false)}>취소</button><button type="submit" disabled={isSettingsSaving}>{isSettingsSaving ? "변경 중" : "변경"}</button></div>
            </form>
          </section>
        </MyPageModalLayer>
      ) : null}

      {isNotificationSettingsOpen ? (
        <MyPageModalLayer onClose={closeNotificationSettings}>
          <section className="notification-settings-modal" role="dialog" aria-modal="true" aria-labelledby="mypage-notification-dialog-title">
            <div className="notification-settings-header">
              <div>
                <p>NOTICE SETTINGS</p>
                <h2 id="mypage-notification-dialog-title">알림 설정</h2>
                <span>필요한 알림만 ON/OFF 슬라이드 버튼으로 관리합니다.</span>
              </div>
              <button type="button" aria-label="알림 설정 닫기" onClick={closeNotificationSettings}>×</button>
            </div>

            <section className="popup-settings-section" aria-labelledby="popup-base-settings-title">
              <div className="popup-section-heading">
                <h3 id="popup-base-settings-title">기본 알림</h3>
                <p>앱에서 공통으로 사용하는 알림을 설정합니다.</p>
              </div>
              <div className="popup-settings-list">
                <NotificationSettingRow
                  description="새 공지, 커뮤니티, 일정 알림을 받을 수 있게 합니다."
                  enabled={localNotificationSettings.allEnabled}
                  icon="bell"
                  label="전체 알림"
                  onChange={(enabled) => updateLocalNotificationSetting("allEnabled", enabled)}
                />
                <NotificationSettingRow
                  description="중요 공지와 필수 확인사항을 우선 안내합니다."
                  enabled={localNotificationSettings.importantEnabled}
                  icon="megaphone"
                  label="중요 공지 알림"
                  onChange={(enabled) => updateLocalNotificationSetting("importantEnabled", enabled)}
                />
                <NotificationSettingRow
                  description="내 게시글 댓글과 커뮤니티 활동 알림을 받습니다."
                  enabled={localNotificationSettings.boardEnabled}
                  icon="shield"
                  label="커뮤니티 알림"
                  onChange={(enabled) => updateLocalNotificationSetting("boardEnabled", enabled)}
                />
              </div>
            </section>

            <section className="popup-settings-section" aria-labelledby="popup-department-settings-title">
              <div className="popup-section-heading">
                <h3 id="popup-department-settings-title">학과 공지 알림</h3>
                <p>내 전공 정보 기준으로 학과 공지 알림을 설정합니다.</p>
              </div>
              <div className="popup-settings-list">
                <NotificationSettingRow
                  detail={user.department}
                  description="주전공 학과의 새 공지를 알림으로 받습니다."
                  enabled={notificationPreferences.primaryEnabled}
                  icon="school"
                  label="주전공 알림"
                  onChange={(enabled) => void updateDepartmentNotificationSetting("primary", enabled)}
                />
                <NotificationSettingRow
                  detail={user.secondaryDepartment || "미등록"}
                  description={hasSecondaryDepartment ? "부전공 학과의 새 공지를 알림으로 받습니다." : "부전공 정보가 없어 설정할 수 없습니다."}
                  disabled={!hasSecondaryDepartment}
                  enabled={hasSecondaryDepartment && notificationPreferences.secondaryEnabled}
                  icon="book"
                  label="부전공 알림"
                  onChange={(enabled) => void updateDepartmentNotificationSetting("secondary", enabled)}
                />
              </div>
            </section>

            <div className="notification-settings-note">
              <MyPageIcon name="info" />
              <p>알림을 켜면 설정 이후 새로 확인되는 학과 공지만 안내합니다.</p>
            </div>
            <div className="notification-settings-actions">
              <button type="button" className="notification-save-button" onClick={closeNotificationSettings}>닫기</button>
            </div>
          </section>
        </MyPageModalLayer>
      ) : null}

      {isLogoutConfirmOpen ? (
        <MyPageModalLayer onClose={() => setIsLogoutConfirmOpen(false)}>
          <div className="confirm-modal yes-no-confirm" role="alertdialog" aria-modal="true" aria-labelledby="mypage-logout-dialog-title">
            <div className="yes-no-confirm-mark" aria-hidden="true">?</div>
            <div>
              <h2 id="mypage-logout-dialog-title">로그아웃 하시겠습니까?</h2>
              <p>로그아웃 후에는 다시 로그인해야<br />서비스를 이용할 수 있습니다.</p>
            </div>
            <div className="modal-actions">
              <button type="button" className="button" onClick={handleLogout}>예</button>
              <button type="button" className="ghost-button" onClick={() => setIsLogoutConfirmOpen(false)}>아니오</button>
            </div>
          </div>
        </MyPageModalLayer>
      ) : null}

      <style jsx>{`
        .mypage-page {
          max-width: none;
          padding: 0 0 56px;
          background:
            linear-gradient(180deg, #f0e1ff 0%, #f7f0ff 24%, #faf9f6 34%, #faf9f6 100%);
        }

        .mypage-page > :not(.mypage-hero) {
          width: min(1180px, calc(100vw - 40px));
          margin-right: auto;
          margin-left: auto;
        }

        .mypage-hero {
          position: relative;
          width: 100vw;
          min-height: 246px;
          margin: 0 calc(50% - 50vw) 20px;
          overflow: hidden;
          background: transparent;
        }

        .mypage-hero-inner {
          position: relative;
          z-index: 1;
          display: flex;
          width: 100%;
          max-width: 1180px;
          min-height: 246px;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          margin: 0 auto;
          padding: 34px 38px 24px;
        }

        .mypage-hero-copy {
          position: relative;
          z-index: 2;
        }

        .mypage-hero h1 {
          margin: 0 0 10px;
          color: #21192b;
          font-family: "NanumSquareRoundExtraBold", "NanumSquareRound", Arial, Helvetica, sans-serif;
          font-size: clamp(44px, 5vw, 62px);
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: 0;
        }

        .mypage-hero p {
          max-width: 680px;
          margin: 0;
          color: #4e435d;
          font-size: 16px;
          font-weight: 750;
          line-height: 1.7;
        }

        .mypage-hero-tags {
          margin-top: 18px;
        }

        .mypage-hero-art {
          position: relative;
          flex: 0 0 365px;
          width: 365px;
          height: 220px;
          margin-right: 10px;
        }

        .mypage-hero-art img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
        }

        .mypage-layout {
          align-items: stretch;
          gap: 20px;
          margin-bottom: 20px;
        }

        .mypage-profile {
          display: flex;
          align-items: center;
          gap: 22px;
          min-height: 142px;
          padding: 34px 38px;
        }

        .mypage-avatar {
          display: grid;
          width: 86px;
          height: 86px;
          flex: 0 0 86px;
          place-items: center;
          border-radius: 50%;
          background: linear-gradient(135deg, #f4eaff 0%, #e8d7ff 100%);
          color: var(--primary);
          font-size: 34px;
          font-family: "NanumSquareRoundExtraBold", "NanumSquareRound", Arial, Helvetica, sans-serif;
          font-weight: 900;
        }

        .mypage-avatar.has-image,
        .profile-image-preview.has-image {
          background-color: #eee5fa;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;
        }

        .mypage-profile-copy {
          min-width: 0;
          flex: 1;
        }

        .mypage-eyebrow {
          margin: 0 0 6px;
          color: var(--primary);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0;
        }

        .mypage-name-row {
          display: flex;
          min-width: 0;
          align-items: flex-start;
          gap: 12px;
        }

        .mypage-profile h2 {
          min-width: 0;
          margin: 0;
          overflow: hidden;
          color: #171326;
          font-size: 28px;
          line-height: 1.25;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mypage-edit-button {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 5px;
          border: 1px solid #b899ef;
          border-radius: 8px;
          background: #fff;
          color: var(--primary);
          padding: 5px 10px;
          font-size: 11px;
          font-weight: 900;
          transform: none;
        }

        .mypage-edit-button :global(.mypage-icon) {
          width: 13px;
          height: 13px;
        }

        .mypage-manage {
          min-height: 142px;
          padding: 24px 38px 26px;
        }

        .mypage-manage .section-title {
          margin-bottom: 18px;
        }

        .mypage-manage-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
        }

        .mypage-manage-actions button,
        .mypage-manage-actions a {
          display: flex;
          min-width: 0;
          min-height: 78px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 0;
          border-left: 1px solid #e5ddeb;
          background: transparent;
          color: var(--primary);
          font-size: 13px;
          font-weight: 900;
        }

        .mypage-manage-actions button:first-child,
        .mypage-manage-actions a:first-child {
          border-left: 0;
        }

        .mypage-manage-actions span,
        .mypage-details dt span {
          display: grid;
          width: 52px;
          height: 52px;
          place-items: center;
          border: 1px solid rgba(88, 47, 130, 0.08);
          border-radius: 8px;
          background: linear-gradient(135deg, #f5edff 0%, #ece0ff 100%);
          color: #7036d8;
        }

        .mypage-manage-actions span :global(.mypage-icon) {
          width: 28px;
          height: 28px;
        }

        .mypage-manage-actions button:first-child span :global(.mypage-icon) {
          transform: scale(0.72);
          transform-origin: center;
        }

        .section-title h2 {
          margin: 0;
          color: #171326;
          font-size: 21px;
          font-weight: 900;
        }

        .mypage-details dl {
          display: grid;
          gap: 0;
          margin: 0;
        }

        .mypage-details div {
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr) 30px;
          align-items: center;
          gap: 16px;
          min-height: 62px;
          padding: 9px 16px 9px 8px;
          border-top: 1px solid var(--line);
        }

        .mypage-details div:first-child {
          border-top: 0;
        }

        .mypage-details dt {
          display: flex;
          align-items: center;
          gap: 18px;
          color: #716884;
          font-weight: 800;
        }

        .mypage-details dt span {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
        }

        .mypage-details dt span :global(.mypage-icon) {
          width: 21px;
          height: 21px;
        }

        .mypage-details dd {
          min-width: 0;
          margin: 0;
          overflow-wrap: anywhere;
          color: #171326;
          font-weight: 800;
        }

        .mypage-details button,
        .mypage-details a {
          display: grid;
          width: 30px;
          height: 30px;
          place-items: center;
          border: 0;
          background: transparent;
          color: #7f7296;
        }

        .mypage-details button :global(.mypage-icon),
        .mypage-details a :global(.mypage-icon) {
          width: 18px;
          height: 18px;
        }

        .account-settings-modal {
          display: grid;
          width: min(760px, calc(100vw - 48px));
          max-height: calc(100vh - 48px);
          overflow: auto;
          align-content: start;
          gap: 16px;
          border: 1px solid rgba(222, 214, 237, 0.95);
          border-radius: 24px;
          background: #fff;
          box-shadow: 0 28px 80px rgba(35, 24, 45, 0.22);
          padding: 32px 36px 36px;
        }

        .account-settings-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
        }

        .account-settings-header p {
          margin: 0 0 8px;
          color: var(--primary);
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 0;
        }

        .account-settings-header h2 {
          margin: 0;
          color: #171326;
          font-size: 32px;
          font-weight: 900;
          line-height: 1.1;
        }

        .account-settings-header span {
          display: block;
          margin-top: 10px;
          color: #6d6880;
          font-size: 15px;
          font-weight: 700;
        }

        .account-settings-header button {
          display: grid;
          position: relative;
          width: 46px;
          height: 46px;
          flex: 0 0 auto;
          place-items: center;
          border: 1px solid #e3d9f3;
          border-radius: 13px;
          background: #fff;
          color: #6336c7;
        }

        .account-settings-header button i::before,
        .account-settings-header button i::after {
          position: absolute;
          top: 21px;
          left: 13px;
          width: 20px;
          height: 3px;
          border-radius: 999px;
          background: currentColor;
          content: "";
        }

        .account-settings-header button i::before {
          transform: rotate(45deg);
        }

        .account-settings-header button i::after {
          transform: rotate(-45deg);
        }

        .account-settings-list {
          display: grid;
          gap: 14px;
        }

        .account-settings-list a,
        .account-settings-list button {
          display: grid;
          grid-template-columns: 64px minmax(0, 1fr) 44px;
          align-items: center;
          gap: 18px;
          min-height: 92px;
          border: 1px solid #e4d9f2;
          border-radius: 14px;
          background: #fff;
          color: #171326;
          padding: 14px 18px;
          text-align: left;
        }

        .account-settings-list a:hover,
        .account-settings-list button:hover {
          background: #fbf8ff;
        }

        .account-settings-list span {
          display: grid;
          width: 64px;
          height: 64px;
          place-items: center;
          border: 1px solid rgba(88, 47, 130, 0.08);
          border-radius: 12px;
          background: linear-gradient(135deg, #f5edff 0%, #ece0ff 100%);
          color: #7036d8;
        }

        .account-settings-list span :global(.mypage-icon) {
          width: 32px;
          height: 32px;
        }

        .account-settings-list strong {
          min-width: 0;
          color: #171326;
          font-size: 19px;
          font-weight: 900;
        }

        .account-settings-list small {
          display: block;
          margin-top: 6px;
          color: #6e6880;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.4;
        }

        .account-settings-list b {
          display: grid;
          width: 44px;
          height: 44px;
          place-items: center;
          border-radius: 50%;
          background: #f7f2fc;
          color: #65528d;
        }

        .account-settings-list b :global(.mypage-icon) {
          width: 20px;
          height: 20px;
        }

        .account-settings-note {
          display: grid;
          grid-template-columns: 24px minmax(0, 1fr) 92px;
          align-items: center;
          gap: 18px;
          min-height: 112px;
          border: 1px solid #e2d6f0;
          border-radius: 14px;
          background: linear-gradient(110deg, #fdfaff 0%, #faf6ff 100%);
          padding: 20px 26px;
          color: #4c416d;
        }

        .account-settings-note > :global(.mypage-icon) {
          width: 24px;
          height: 24px;
          color: #7040d5;
        }

        .account-settings-note strong {
          font-size: 15px;
          font-weight: 800;
          line-height: 1.45;
        }

        .account-settings-note p {
          margin: 10px 0 0;
          color: #766f89;
          font-size: 13px;
          font-weight: 700;
        }

        .account-settings-note > span {
          position: relative;
          display: grid;
          width: 84px;
          height: 76px;
          place-items: center;
          justify-self: center;
          color: #7446dc;
          filter: drop-shadow(0 14px 14px rgba(93, 48, 193, 0.2));
        }

        .account-settings-note > span > :global(.mypage-icon) {
          width: 72px;
          height: 72px;
          stroke-width: 1.5;
          fill: #c3a8ff;
        }

        .account-settings-note > span i {
          position: absolute;
          right: 0;
          bottom: 0;
          display: grid;
          width: 38px;
          height: 38px;
          place-items: center;
          border-radius: 10px;
          background: #eee4ff;
          color: #6840c7;
        }

        .account-settings-note > span i :global(.mypage-icon) {
          width: 25px;
          height: 25px;
        }

        .account-form-modal {
          width: min(560px, calc(100vw - 48px));
          max-height: calc(100vh - 48px);
          overflow: auto;
          border: 1px solid #e2d7ef;
          border-radius: 22px;
          background: #fff;
          box-shadow: 0 28px 80px rgba(35, 24, 45, 0.22);
          padding: 30px;
        }

        .personal-info-modal {
          width: clamp(320px, 46vw, 560px);
          max-width: calc(100vw - 32px);
          max-height: calc(100dvh - 96px);
          margin: auto;
          padding: clamp(20px, 2.5vw, 30px);
        }

        .account-form-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .account-form-header p {
          margin: 0 0 7px;
          color: var(--primary);
          font-size: 12px;
          font-weight: 900;
        }

        .account-form-header h2 {
          margin: 0;
          color: #171326;
          font-size: 28px;
        }

        .account-form-header > button {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 1px solid #e2d7ef;
          border-radius: 12px;
          background: #fff;
          color: #6336c7;
          font-size: 29px;
          line-height: 1;
        }

        .account-form-modal form {
          display: grid;
          gap: 15px;
        }

        .account-form-modal label {
          display: grid;
          gap: 8px;
          color: #393247;
          font-size: 14px;
          font-weight: 850;
        }

        .account-form-modal input {
          width: 100%;
          height: 48px;
          border: 1px solid #ded5e9;
          border-radius: 10px;
          background: #fff;
          color: #171326;
          padding: 0 14px;
          font: inherit;
          font-weight: 700;
          outline: none;
        }

        .account-form-modal input:focus {
          border-color: #895bd9;
          box-shadow: 0 0 0 3px rgba(112, 64, 213, 0.1);
        }

        .account-form-error,
        .account-form-message {
          margin: 0;
          border-radius: 9px;
          padding: 11px 13px;
          font-size: 13px;
          font-weight: 800;
        }

        .account-form-error { background: #fff1f3; color: #b4233c; }
        .account-form-message { background: #f0f9f4; color: #237a4b; }

        .account-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 8px;
        }

        .account-form-actions button {
          min-width: 88px;
          height: 44px;
          border: 1px solid #dcd1e9;
          border-radius: 10px;
          background: #fff;
          color: #665c72;
          font-weight: 900;
        }

        .account-form-actions button[type="submit"] {
          border-color: transparent;
          background: linear-gradient(135deg, #8054da, #5b35c6);
          color: #fff;
        }

        .profile-image-editor {
          display: flex;
          align-items: center;
          gap: 20px;
          border: 1px solid #ebe3f3;
          border-radius: 14px;
          background: #fcfaff;
          padding: 18px;
        }

        .profile-image-preview {
          display: grid;
          width: 88px;
          height: 88px;
          flex: 0 0 88px;
          place-items: center;
          overflow: hidden;
          border: 2px solid #e4d7f5;
          border-radius: 50%;
          background: linear-gradient(135deg, #f4eaff, #e8d7ff);
          color: var(--primary);
          font-size: 32px;
          font-weight: 900;
        }

        .profile-image-editor > div:last-child {
          display: flex;
          align-items: flex-start;
          flex-direction: column;
          gap: 9px;
        }

        .account-form-modal .profile-image-button {
          display: inline-flex;
          height: 40px;
          align-items: center;
          gap: 7px;
          border: 1px solid #b899ef;
          border-radius: 9px;
          background: #fff;
          color: var(--primary);
          padding: 0 13px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 900;
        }

        .profile-image-button :global(.mypage-icon) {
          width: 15px;
          height: 15px;
        }

        .profile-image-button input {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          opacity: 0;
          pointer-events: none;
        }

        .profile-image-remove {
          border: 0;
          background: transparent;
          color: #756b82;
          padding: 0;
          font-size: 12px;
          font-weight: 800;
          text-decoration: underline;
        }

        .profile-edit-help {
          margin: -5px 0 0;
          color: #766e82;
          font-size: 12px;
          font-weight: 700;
        }

        .notification-settings-modal {
          display: grid;
          width: min(1080px, calc(100vw - 40px));
          max-height: min(860px, calc(100vh - 40px));
          overflow: auto;
          gap: 24px;
          border: 1px solid rgba(222, 214, 237, 0.95);
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 28px 80px rgba(35, 24, 45, 0.22);
          padding: 48px;
        }

        .notification-settings-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
        }

        .notification-settings-header p {
          margin: 0 0 8px;
          color: var(--primary);
          font-size: 13px;
          font-weight: 800;
        }

        .notification-settings-header h2 {
          margin: 0;
          color: #171326;
          font-size: 32px;
          font-weight: 900;
          line-height: 1.25;
        }

        .notification-settings-header span {
          display: block;
          margin-top: 10px;
          color: #242035;
          font-size: 15px;
          font-weight: 750;
          line-height: 1.45;
        }

        .notification-settings-header button {
          display: grid;
          width: 56px;
          height: 56px;
          flex: 0 0 auto;
          place-items: center;
          border: 1px solid #ded3ef;
          border-radius: 12px;
          background: #fff;
          color: #655d77;
          font-size: 42px;
          line-height: 1;
        }

        .notification-toggle-list {
          display: grid;
          gap: 24px;
        }

        .notification-toggle-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 28px;
          min-height: 182px;
          border: 1px solid #e4daef;
          border-radius: 14px;
          background: #fff;
          padding: 32px;
        }

        .notification-toggle-row.disabled {
          background: #fff;
          color: #8d8797;
        }

        .notification-toggle-main {
          display: grid;
          grid-template-columns: 78px minmax(0, 1fr);
          align-items: center;
          gap: 26px;
          min-width: 0;
        }

        .notification-toggle-icon {
          display: grid;
          width: 78px;
          height: 78px;
          place-items: center;
          border-radius: 50%;
          background: #eadff8;
          color: var(--primary);
        }

        .notification-toggle-icon :global(.mypage-icon) {
          width: 38px;
          height: 38px;
        }

        .notification-toggle-row strong {
          display: block;
          min-width: 0;
          overflow-wrap: anywhere;
          color: #171326;
          font-size: 28px;
          font-weight: 900;
          line-height: 1.35;
        }

        .notification-toggle-row small {
          display: block;
          margin-top: 10px;
          color: #514a63;
          font-size: 20px;
          font-weight: 800;
          line-height: 1.35;
        }

        .notification-toggle-row p {
          margin: 14px 0 0;
          color: #5f5870;
          font-size: 20px;
          font-weight: 750;
          line-height: 1.45;
        }

        .notification-toggle-control {
          display: flex;
          align-items: center;
          gap: 14px;
          color: #5c3ac2;
          font-size: 20px;
          font-weight: 900;
        }

        .notification-toggle-control b {
          min-width: 42px;
          color: inherit;
          font-size: 20px;
          line-height: 1;
        }

        .notification-switch {
          position: relative;
          width: 68px;
          height: 40px;
          border: 0;
          border-radius: 999px;
          background: #c7c6d0;
          color: #fff;
          padding: 0;
          font-size: 0;
        }

        .notification-switch::before {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 4px 10px rgba(35, 24, 45, 0.16);
          content: "";
          transition: transform 180ms ease;
        }

        .notification-switch span {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip: rect(0 0 0 0);
        }

        .notification-switch.on {
          background: linear-gradient(135deg, #8054da, #5b35c6);
        }

        .notification-switch.on::before {
          transform: translateX(28px);
        }

        .notification-switch:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        .notification-toggle-row.disabled .notification-toggle-icon {
          color: #7a59d4;
          opacity: 0.9;
        }

        .notification-toggle-row.disabled .notification-toggle-control {
          color: #5f5870;
        }

        .notification-settings-note {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 10px 0 0;
          border: 1px solid #e1d5ef;
          border-radius: 14px;
          color: #4f4860;
          padding: 22px 26px;
          font-size: 15px;
          font-weight: 750;
          line-height: 1.5;
        }

        .notification-settings-note :global(.mypage-icon) {
          width: 32px;
          height: 32px;
          flex: 0 0 auto;
          color: var(--primary);
        }

        .notification-settings-note p {
          margin: 0;
        }

        .notification-settings-actions {
          display: flex;
          justify-content: flex-end;
          gap: 18px;
          margin-top: 10px;
        }

        .popup-settings-section {
          display: grid;
          gap: 18px;
          border: 1px solid #ece7fa;
          border-radius: 16px;
          background: #fff;
          padding: 24px;
        }

        .popup-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #f0ebf8;
        }

        .popup-section-heading h3,
        .popup-section-heading p {
          margin: 0;
        }

        .popup-section-heading h3 {
          color: #171326;
          font-size: 19px;
          font-weight: 950;
        }

        .popup-section-heading p {
          color: #746b84;
          font-size: 13px;
          font-weight: 750;
          text-align: right;
        }

        .popup-settings-list {
          display: grid;
          gap: 14px;
        }

        :global(.popup-setting-row) {
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr) auto;
          align-items: center;
          gap: 18px;
          min-height: 104px;
          border: 1px solid #ece7fa;
          border-radius: 14px;
          background: #fff;
          padding: 20px;
        }

        :global(.popup-setting-row.disabled) {
          background: #f8f7fb;
          color: #908999;
        }

        :global(.popup-setting-icon) {
          display: grid;
          width: 58px;
          height: 58px;
          place-items: center;
          border-radius: 50%;
          background: #efe7fb;
          color: var(--primary);
        }

        :global(.popup-setting-icon .mypage-icon) {
          width: 28px;
          height: 28px;
        }

        :global(.popup-setting-copy) {
          min-width: 0;
        }

        :global(.popup-setting-copy > div) {
          display: flex;
          min-width: 0;
          align-items: baseline;
          gap: 10px;
          flex-wrap: wrap;
        }

        :global(.popup-setting-copy h4),
        :global(.popup-setting-copy p) {
          margin: 0;
        }

        :global(.popup-setting-copy h4) {
          color: #171326;
          font-size: 19px;
          font-weight: 950;
        }

        :global(.popup-setting-copy span) {
          color: var(--primary);
          font-size: 13px;
          font-weight: 900;
        }

        :global(.popup-setting-copy p) {
          margin-top: 8px;
          color: #696176;
          font-size: 13px;
          font-weight: 750;
          line-height: 1.45;
        }

        :global(.popup-switch) {
          position: relative;
          width: 82px;
          height: 44px;
          border: 0;
          border-radius: 999px;
          background: #c9c7d1;
          color: #fff;
          padding: 0;
          transition: background 180ms ease, opacity 180ms ease;
        }

        :global(.popup-switch)::before {
          position: absolute;
          top: 5px;
          left: 5px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 5px 12px rgba(35, 24, 45, 0.18);
          content: "";
          transition: transform 180ms ease;
        }

        :global(.popup-switch span) {
          position: absolute;
          top: 0;
          right: 12px;
          color: #fff;
          font-size: 12px;
          font-weight: 950;
          line-height: 44px;
        }

        :global(.popup-switch.on) {
          background: linear-gradient(135deg, #8054da, #5b35c6);
        }

        :global(.popup-switch.on)::before {
          transform: translateX(38px);
        }

        :global(.popup-switch.on span) {
          right: auto;
          left: 13px;
        }

        :global(.popup-switch:disabled) {
          cursor: not-allowed;
          opacity: 0.58;
        }

        .notification-cancel-button,
        .notification-save-button {
          min-width: 140px;
          min-height: 62px;
          border-radius: 13px;
          font-size: 15px;
          font-weight: 900;
        }

        .notification-cancel-button {
          border: 1px solid #d8cdea;
          background: #fff;
          color: #5f5870;
        }

        .notification-save-button {
          border: 0;
          background: linear-gradient(135deg, #8054da, #5b35c6);
          color: #fff;
        }

        :global(.mypage-icon) {
          display: block;
          width: 24px;
          height: 24px;
        }

        :global(.mypage-modal-backdrop) {
          top: 65px;
          right: 0;
          bottom: 0;
          left: 0;
          width: 100vw;
          transform: none;
          background: rgba(55, 51, 64, 0.44);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
        }

        @media (min-width: 761px) {
          .account-settings-modal,
          .notification-settings-modal {
            width: min(760px, calc(100vw - 48px));
            box-sizing: border-box;
            overflow: auto;
            transform: scale(0.75);
            transform-origin: center;
          }

          .account-settings-modal {
            height: auto;
            max-height: calc(100vh - 48px);
          }

          .notification-settings-modal {
            width: min(760px, 88vw);
            height: auto;
            max-height: min(680px, calc(100dvh - 64px));
            align-content: start;
          }
        }

        @media (max-width: 760px) {
          .mypage-page > :not(.mypage-hero) {
            width: min(100% - 28px, 1180px);
          }

          .personal-info-modal {
            width: calc(100vw - 32px);
            max-height: calc(100dvh - 96px);
            border-radius: 18px;
            padding: 20px;
          }

          .personal-info-modal .account-form-header {
            margin-bottom: 18px;
          }

          .personal-info-modal .account-form-header h2 {
            font-size: clamp(22px, 6vw, 28px);
          }

          .personal-info-modal form {
            gap: 12px;
          }

          .personal-info-modal input {
            height: 44px;
          }

          .mypage-hero {
            min-height: 220px;
            margin-bottom: 28px;
          }

          .mypage-hero-inner {
            min-height: 220px;
            padding: 28px 20px 24px;
          }

          .mypage-hero h1 {
            font-size: 40px;
          }

          .mypage-hero p {
            max-width: calc(100% - 64px);
            font-size: 14px;
          }

          .mypage-hero-art {
            position: absolute;
            top: 10px;
            right: -74px;
            width: 220px;
            height: 180px;
            margin-right: 0;
            opacity: 0.58;
          }

          .mypage-layout {
            grid-template-columns: 1fr;
          }

          .mypage-profile {
            align-items: flex-start;
            padding: 24px;
          }

          .mypage-name-row {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }

          .mypage-edit-button {
            transform: translateY(-4px);
          }

          .mypage-manage {
            padding: 22px 20px;
          }

          .mypage-manage-actions {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            row-gap: 14px;
          }

          .mypage-details div {
            grid-template-columns: 1fr auto;
            gap: 5px;
            padding: 12px 8px;
          }

          .mypage-details dt {
            grid-column: 1;
          }

          .mypage-details dd {
            grid-column: 1;
            padding-left: 56px;
          }

          .mypage-details button,
          .mypage-details a {
            grid-column: 2;
            grid-row: 1 / span 2;
          }

          .account-settings-modal {
            width: min(100% - 28px, 1380px);
            gap: 18px;
            border-radius: 20px;
            padding: 24px 20px;
          }

          .account-settings-header h2 {
            font-size: 30px;
          }

          .account-settings-header p {
            margin-bottom: 10px;
            font-size: 13px;
          }

          .account-settings-header span {
            margin-top: 12px;
            font-size: 14px;
          }

          .account-settings-header button {
            width: 46px;
            height: 46px;
          }

          .account-settings-header button i::before,
          .account-settings-header button i::after {
            top: 21px;
            left: 13px;
            width: 20px;
          }

          .account-settings-list a,
          .account-settings-list button {
            grid-template-columns: 58px minmax(0, 1fr) 42px;
            min-height: 94px;
            gap: 12px;
            border-radius: 14px;
            padding: 14px;
          }

          .account-settings-list span {
            width: 58px;
            height: 58px;
            border-radius: 12px;
          }

          .account-settings-list span :global(.mypage-icon) {
            width: 30px;
            height: 30px;
          }

          .account-settings-list strong {
            font-size: 17px;
          }

          .account-settings-list small {
            margin-top: 5px;
            font-size: 12px;
          }

          .account-settings-list b {
            width: 42px;
            height: 42px;
          }

          .account-settings-list b :global(.mypage-icon) {
            width: 20px;
            height: 20px;
          }

          .account-settings-note {
            grid-template-columns: 24px minmax(0, 1fr);
            min-height: 120px;
            gap: 14px;
            border-radius: 14px;
            padding: 20px;
          }

          .account-settings-note > :global(.mypage-icon) {
            width: 24px;
            height: 24px;
          }

          .account-settings-note strong {
            font-size: 14px;
          }

          .account-settings-note p {
            margin-top: 10px;
            font-size: 12px;
          }

          .account-settings-note > span {
            display: none;
          }

          .notification-settings-modal {
            width: min(100% - 28px, 1080px);
            gap: 18px;
            padding: 24px;
          }

          .notification-settings-header p {
            margin-bottom: 10px;
            font-size: 13px;
          }

          .notification-settings-header h2 {
            font-size: 30px;
          }

          .notification-settings-header span {
            margin-top: 12px;
            font-size: 14px;
          }

          .notification-settings-header button {
            width: 42px;
            height: 42px;
            font-size: 30px;
          }

          .notification-toggle-row {
            grid-template-columns: 1fr;
            min-height: auto;
            gap: 18px;
            padding: 18px;
          }

          .notification-toggle-main {
            grid-template-columns: 58px minmax(0, 1fr);
            gap: 16px;
          }

          .notification-toggle-icon {
            width: 58px;
            height: 58px;
          }

          .notification-toggle-icon :global(.mypage-icon) {
            width: 28px;
            height: 28px;
          }

          .notification-toggle-row strong {
            font-size: 20px;
          }

          .notification-toggle-row small,
          .notification-toggle-row p {
            font-size: 14px;
          }

          .notification-toggle-control {
            justify-self: start;
          }

          .notification-settings-note {
            align-items: flex-start;
            padding: 16px;
            font-size: 14px;
          }

          .notification-settings-actions {
            gap: 10px;
          }

          .popup-settings-section {
            padding: 18px;
          }

          .popup-section-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .popup-section-heading p {
            text-align: left;
          }

          :global(.popup-setting-row) {
            grid-template-columns: 48px minmax(0, 1fr);
            gap: 14px;
            padding: 16px;
          }

          :global(.popup-setting-icon) {
            width: 48px;
            height: 48px;
          }

          :global(.popup-switch) {
            grid-column: 2;
            justify-self: start;
          }

          .notification-cancel-button,
          .notification-save-button {
            min-width: 0;
            flex: 1;
            min-height: 52px;
            font-size: 16px;
          }
        }
      `}</style>
    </main>
  );
}

function DepartmentNotificationToggle({
  department,
  description,
  disabled = false,
  enabled,
  icon,
  label,
  onChange
}: {
  department: string;
  description: string;
  disabled?: boolean;
  enabled: boolean;
  icon: "book" | "school";
  label: string;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className={disabled ? "notification-toggle-row disabled" : "notification-toggle-row"}>
      <div className="notification-toggle-main">
        <span className="notification-toggle-icon"><MyPageIcon name={icon} /></span>
        <div>
          <strong>{label}</strong>
          <small>{department}</small>
          <p>{description}</p>
        </div>
      </div>
      <div className="notification-toggle-control">
        <button
          type="button"
          className={enabled ? "notification-switch on" : "notification-switch"}
          disabled={disabled}
          aria-pressed={enabled}
          onClick={() => onChange(!enabled)}
        >
          <span>{enabled ? "ON" : "OFF"}</span>
        </button>
        <b>{enabled ? "ON" : "OFF"}</b>
      </div>
    </div>
  );
}

function NotificationSettingRow({
  detail,
  description,
  disabled = false,
  enabled,
  icon,
  label,
  onChange
}: {
  detail?: string;
  description: string;
  disabled?: boolean;
  enabled: boolean;
  icon: MyPageIconName;
  label: string;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className={disabled ? "popup-setting-row disabled" : "popup-setting-row"}>
      <span className="popup-setting-icon"><MyPageIcon name={icon} /></span>
      <div className="popup-setting-copy">
        <div>
          <h4>{label}</h4>
          {detail ? <span>{detail}</span> : null}
        </div>
        <p>{description}</p>
      </div>
      <button
        type="button"
        className={enabled ? "popup-switch on" : "popup-switch"}
        disabled={disabled}
        aria-label={`${label} ${enabled ? "끄기" : "켜기"}`}
        aria-pressed={enabled}
        onClick={() => onChange(!enabled)}
      >
        <span>{enabled ? "ON" : "OFF"}</span>
      </button>
    </div>
  );
}
