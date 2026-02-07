const TEN_SCALE_MIN = 2;
const TEN_SCALE_MAX = 10;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function assertTenGrade(value: number): void {
  if (!Number.isInteger(value) || value < TEN_SCALE_MIN || value > TEN_SCALE_MAX) {
    throw new Error('Grade must be an integer between 2 and 10');
  }
}

export function normalizeToTen(rawValue: number, rawMax: number): number {
  if (!Number.isFinite(rawValue) || !Number.isFinite(rawMax) || rawMax <= 0) {
    return TEN_SCALE_MIN;
  }

  const ratio = clamp(rawValue / rawMax, 0, 1);
  const normalized = Math.round(TEN_SCALE_MIN + ratio * (TEN_SCALE_MAX - TEN_SCALE_MIN));
  return clamp(normalized, TEN_SCALE_MIN, TEN_SCALE_MAX);
}

export function tenToRatio(grade: number): number {
  const ratio = (grade - TEN_SCALE_MIN) / (TEN_SCALE_MAX - TEN_SCALE_MIN);
  return clamp(ratio, 0, 1);
}
