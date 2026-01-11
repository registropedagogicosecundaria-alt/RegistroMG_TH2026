
export enum View {
    Login,
    Menu,
    Caratula,
    CourseManagement,
    Filiation,
    Attendance,
    Grades,
    Boletines,
    Temas,
    Entrevistas,
    Reports,
    Horario,
}

export interface Student {
    id: number;
    name: string;
}

export interface WorkingDay {
    date: number;
    label: string;
    enabled: boolean;
}

export interface AttendanceData {
    [key: string]: string; // e.g. "studentId-day": "P"
}

export interface Criteria {
    count: number;
    maxPoints: number;
    titles: string[];
}

export interface CriteriaConfig {
    ser: Criteria;
    saber: Criteria;
    hacer: Criteria;
    auto: Criteria;
}

export interface StudentGrades {
    [dimension: string]: string[];
}

export interface AllGradesData {
    [studentId: string]: StudentGrades;
}

export type Dimension = 'ser' | 'saber' | 'hacer' | 'auto';

export interface TrimesterTopics {
    planned: number;
    developed: number;
    pctDeveloped?: number;
    difference?: number;
    notDeveloped?: number;
    pctNotDeveloped?: number;
}

export interface CourseTopics {
    course: string;
    trimester1: TrimesterTopics;
    trimester2: TrimesterTopics;
    trimester3: TrimesterTopics;
}

export interface CentralizerData {
    id: number;
    name: string;
    status?: string;
    t1: number;
    t2: number;
    t3: number;
    anual: number;
}

export interface PrintConfig {
    paperSize: 'letter' | 'legal' | 'a4';
    orientation: 'portrait' | 'landscape';
    margins: 'none' | 'narrow' | 'normal' | 'wide';
    showCharts: boolean;
    showSummary: boolean;
}

export interface ScheduleEntry {
    id?: string;
    teacher_id: string;
    day_of_week: number; // 1-5 (Lunes-Viernes)
    start_time: string;
    end_time: string;
    course_label: string;
    subject: string;
}
