export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

export function toDateOnlyString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function parseTimeOnly(value: string): Date {
  const normalized = value.length === 5 ? `${value}:00` : value;
  return new Date(`1970-01-01T${normalized}Z`);
}

export function toTimeOnlyString(value: Date): string {
  return value.toISOString().slice(11, 19);
}
