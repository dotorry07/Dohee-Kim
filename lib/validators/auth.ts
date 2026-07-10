import { departments, grades } from "@/lib/data";

export interface AuthFormInput {
  email: string;
  password: string;
  passwordConfirm?: string;
  name?: string;
  department?: string;
  grade?: string;
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateLogin(input: AuthFormInput) {
  if (!isValidEmail(input.email)) {
    return "이메일 형식이 올바르지 않습니다.";
  }

  if (input.password.length < 8) {
    return "비밀번호는 8자 이상이어야 합니다.";
  }

  return "";
}

export function validateSignup(input: AuthFormInput) {
  const loginError = validateLogin(input);
  if (loginError) {
    return loginError;
  }

  if (input.passwordConfirm !== input.password) {
    return "비밀번호 확인이 일치하지 않습니다.";
  }

  if (!input.name?.trim()) {
    return "닉네임 또는 이름은 필수입니다.";
  }

  if (!input.department || !departments.includes(input.department)) {
    return "학과를 선택해주세요.";
  }

  const grade = Number(input.grade);
  if (!grades.some((value) => value === grade)) {
    return "학년을 선택해주세요.";
  }

  return "";
}
