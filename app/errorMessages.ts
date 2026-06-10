export function getFriendlyErrorMessage(message?: string | null) {
  const normalized = (message || "").toLowerCase();

  if (!message) {
    return "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  if (
    normalized.includes("invalid login") ||
    normalized.includes("invalid credentials")
  ) {
    return "이메일 또는 비밀번호를 다시 확인해주세요.";
  }

  if (normalized.includes("already registered") || normalized.includes("already exists")) {
    return "이미 가입된 이메일입니다. 로그인하거나 다른 이메일을 사용해주세요.";
  }

  if (normalized.includes("row-level security") || normalized.includes("permission")) {
    return "권한 확인이 필요합니다. 로그인 상태를 확인한 뒤 다시 시도해주세요.";
  }

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return "네트워크 연결이 불안정합니다. 잠시 후 다시 시도해주세요.";
  }

  if (normalized.includes("schema cache") || normalized.includes("column")) {
    return "저장에 필요한 DB 컬럼 또는 마이그레이션이 아직 적용되지 않았습니다.";
  }

  return "처리 중 오류가 발생했습니다. 입력 내용을 확인한 뒤 다시 시도해주세요.";
}
