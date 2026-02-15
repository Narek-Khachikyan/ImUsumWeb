import api from './api';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
export type AttendanceSource = 'GEOLOCATION' | 'SYSTEM' | 'MANUAL_OVERRIDE';

export interface AttendanceCheckInRequest {
  latitude: number;
  longitude: number;
  accuracy_m?: number;
}

export interface AttendanceRecord {
  id: number;
  student_id: number;
  schedule_id: number;
  attendance_date: string;
  checked_in_at: string | null;
  status: AttendanceStatus;
  source: AttendanceSource;
  distance_m?: number | null;
  accuracy_m?: number | null;
}

export interface AttendanceDayItem {
  schedule_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room: string | null;
  status: AttendanceStatus | 'PENDING';
  source: AttendanceSource | null;
  checked_in_at: string | null;
  distance_m: number | null;
}

export const attendanceService = {
  async checkInByGeo(data: AttendanceCheckInRequest): Promise<AttendanceRecord> {
    const response = await api.post<AttendanceRecord>('/attendance/check-in', data);
    return response.data;
  },

  async getMy(date?: string): Promise<AttendanceDayItem[]> {
    const response = await api.get<AttendanceDayItem[]>('/attendance/my', {
      params: date ? { date } : undefined,
    });
    return response.data;
  },

  async getClass(classId: number, date?: string): Promise<AttendanceRecord[]> {
    const response = await api.get<AttendanceRecord[]>('/attendance/class', {
      params: {
        class_id: classId,
        ...(date ? { date } : {}),
      },
    });
    return response.data;
  },

  async override(recordId: number, status: AttendanceStatus, reason?: string): Promise<AttendanceRecord> {
    const response = await api.post<AttendanceRecord>(`/attendance/${recordId}/override`, {
      status,
      ...(reason ? { reason } : {}),
    });
    return response.data;
  },
};

export default attendanceService;
