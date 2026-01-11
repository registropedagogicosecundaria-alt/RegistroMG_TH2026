
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration
const SUPABASE_URL = "https://ivytrgjcjwkyaqoqaxhn.supabase.co".trim();
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2eXRyZ2pjandreWFxb3FheGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NTAyMjQsImV4cCI6MjA4MzUyNjIyNH0.GRPBjiSIQsI0QZo3RYi3Vl5rv4NYPuc-y3R779qkOPQ".trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const parseError = (err: any): string => {
    if (!err) return "Error desconocido";
    console.error("Database Error Details:", err);
    if (typeof err === 'string') return err;
    if (err.message) {
        if (err.code === '42501') return "ERROR RLS (42501): Debes ejecutar el script SQL en Supabase para habilitar permisos en la tabla 'schedules'.";
        if (err.message.includes("violates unique constraint")) return "Ya existe un registro similar.";
        return err.message;
    }
    return "Error de conexión con la base de datos";
};

// --- User & Session ---
export const validateUser = async (carnet: string, celular: string): Promise<any> => {
    try {
        const { data, error } = await supabase.from('profiles').select('id, full_name, phone').eq('carnet', carnet?.trim()).maybeSingle();
        if (error) throw error;
        if (!data) return { success: false, message: 'Usuario no encontrado.' };
        if (String(data.phone).trim() === celular?.trim()) return { success: true, nombre: data.full_name, id: data.id };
        return { success: false, message: 'Credenciales incorrectas.' };
    } catch (e: any) { return { success: false, message: parseError(e) }; }
};

// --- Carátula ---
export const getCaratulaData = async (userId: string): Promise<{ datos: string }> => {
    try {
        const { data: profile } = await supabase.from('profiles').select('full_name, phone, subject').eq('id', userId).single();
        const { data: inst } = await supabase.from('institutional_data').select('*').eq('teacher_id', userId).maybeSingle();
        const fields = [inst?.department || '', inst?.district || '', inst?.network || '', inst?.sie_code || '', profile?.phone || '', inst?.management_year || '2025', inst?.school_unit || '', inst?.district_director_name || '', inst?.director_name || '', profile?.full_name || '', profile?.subject || ''];
        return { datos: fields.join(',') };
    } catch (e) { return { datos: "" }; }
};

export const saveCaratulaData = async (payload: any, userId: string): Promise<string> => {
    try {
        await supabase.from('institutional_data').upsert({ teacher_id: userId, department: payload.departamento, district: payload.distrito, network: payload.red, sie_code: payload.sie, management_year: parseInt(payload.gestion) || 2025, school_unit: payload.unidad, district_director_name: payload.distrital, director_name: payload.director }, { onConflict: 'teacher_id' });
        await supabase.from('profiles').update({ subject: payload.asignatura }).eq('id', userId);
        return "OK";
    } catch (e) { return parseError(e); }
};

// --- Course Management ---
export const getCourses = async (userId: string): Promise<string[]> => {
    const { data, error } = await supabase.from('courses').select('label').eq('teacher_id', userId);
    if (error) throw error;
    return (data || []).map(c => c.label);
};

export const createCourse = async (courseLabel: string, userId: string): Promise<string> => {
    const parts = courseLabel.split(' ');
    const { error } = await supabase.from('courses').insert({ teacher_id: userId, grade: parts[0], parallel: parts[1] });
    if (error) throw error;
    return "OK";
};

export const deleteCourse = async (courseLabel: string, userId: string): Promise<string> => {
    const { error } = await supabase.from('courses').delete().eq('teacher_id', userId).eq('label', courseLabel);
    if (error) throw error;
    return "OK";
};

const getCourseIdByLabel = async (label: string, userId: string): Promise<string> => {
    const { data, error } = await supabase.from('courses').select('id').eq('teacher_id', userId).eq('label', label).single();
    if (error) throw error;
    return data.id;
};

// --- Filiación ---
export const getFiliationData = async (courseName: string, userId: string): Promise<{ data: any[][], courseName: string }> => {
    const courseId = await getCourseIdByLabel(courseName, userId);
    const { data, error } = await supabase.from('students').select('*').eq('course_id', courseId).order('register_number', { ascending: true });
    if (error) throw error;
    const mapped = (data || []).map(s => [s.register_number, s.full_name, s.gender, s.ci, s.rude, s.birth_date, s.age || '', s.tutor_name, s.tutor_relationship, s.tutor_phone, s.id, s.status || 'ACTIVE']);
    return { data: mapped, courseName };
};

export const saveFiliationData = async (data: any[][], courseName: string, userId: string): Promise<string> => {
    try {
        const courseId = await getCourseIdByLabel(courseName, userId);
        const records = data.map(row => {
            const student: any = { 
                course_id: courseId, 
                register_number: row[0], 
                full_name: row[1]?.toString().trim().toUpperCase() || '', 
                gender: row[2]?.toString().trim() || '', 
                ci: row[3]?.toString().trim() || '', 
                rude: row[4]?.toString().trim() || '', 
                birth_date: row[5] || null, 
                age: parseInt(row[6]) || null, 
                tutor_name: row[7]?.toString().trim().toUpperCase() || '', 
                tutor_relationship: row[8]?.toString().trim().toUpperCase() || '', 
                tutor_phone: row[9]?.toString().trim() || '',
                status: row[11] || 'ACTIVE' 
            };
            if (row[10]) student.id = row[10];
            return student;
        });
        const { error } = await supabase.from('students').upsert(records, { onConflict: 'id' });
        if (error) throw error;
        return "OK";
    } catch (e: any) { return parseError(e); }
};

export const deleteStudentRow = async (studentId: any, courseName: string, userId: string): Promise<string> => {
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) throw error;
    return "OK";
};

// --- Asistencia ---
export const getStudentsForAttendance = async (courseName: string, userId: string): Promise<{ id: any, name: string, status: string }[]> => {
    const courseId = await getCourseIdByLabel(courseName, userId);
    const { data, error } = await supabase.from('students').select('id, full_name, status').eq('course_id', courseId).order('register_number', { ascending: true });
    if (error) throw error;
    return (data || []).map(s => ({ id: s.id, name: s.full_name, status: s.status || 'ACTIVE' }));
};

export const getAttendanceMonthData = async (month: string, courseName: string, userId: string): Promise<{ days: any[], attendance: any }> => {
    const courseId = await getCourseIdByLabel(courseName, userId);
    const { data: students } = await supabase.from('students').select('id').eq('course_id', courseId);
    const studentIds = (students || []).map(s => s.id);
    
    const year = new Date().getFullYear();
    const startDate = `${year}-${month.padStart(2, '0')}-01`;
    const lastDay = new Date(year, parseInt(month), 0).getDate();
    const endDate = `${year}-${month.padStart(2, '0')}-${lastDay}`;
    
    const { data: attRecords } = await supabase.from('attendance').select('*').in('student_id', studentIds).gte('date', startDate).lte('date', endDate);
    
    const attendanceMap: any = {};
    const daysWithData = new Set<number>();
    
    (attRecords || []).forEach(r => {
        const dateObj = new Date(r.date + 'T00:00:00');
        const day = dateObj.getDate();
        attendanceMap[`${r.student_id}-${day}`] = r.status;
        daysWithData.add(day);
    });

    const days = [];
    const diaNombres = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    
    for(let i=1; i<=lastDay; i++) {
        const dateObj = new Date(year, parseInt(month)-1, i);
        const dayOfWeek = dateObj.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            days.push({ 
                date: i, 
                label: `${diaNombres[dayOfWeek]} ${i}`, 
                enabled: daysWithData.has(i) 
            });
        }
    }
    return { days, attendance: attendanceMap };
};

export const saveAttendanceData = async (month: string, attendanceData: any, enabledDays: number[], courseName: string, userId: string): Promise<string> => {
    try {
        const year = new Date().getFullYear();
        const courseId = await getCourseIdByLabel(courseName, userId);
        const { data: students, error: sError } = await supabase.from('students').select('id, status').eq('course_id', courseId);
        if (sError) throw sError;
        if (!students || students.length === 0) return "OK";
        
        const activeStudents = students.filter(s => (s.status || 'ACTIVE') !== 'WITHDRAWN');
        const studentIds = students.map(s => s.id);
        
        const lastDay = new Date(year, parseInt(month), 0).getDate();
        const datesToDelete: string[] = [];
        for (let d = 1; d <= lastDay; d++) {
            if (!enabledDays.includes(d)) {
                datesToDelete.push(`${year}-${month.padStart(2, '0')}-${d.toString().padStart(2, '0')}`);
            }
        }
        if (datesToDelete.length > 0) {
            const { error: dError } = await supabase.from('attendance').delete().in('student_id', studentIds).in('date', datesToDelete);
            if (dError) throw dError;
        }
        const recordsToUpsert: any[] = [];
        enabledDays.forEach(day => {
            const dateStr = `${year}-${month.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            activeStudents.forEach(student => {
                const status = attendanceData[`${student.id}-${day}`] || 'P';
                recordsToUpsert.push({ student_id: student.id, date: dateStr, status: status });
            });
        });
        if (recordsToUpsert.length > 0) {
            const { error: uError } = await supabase.from('attendance').upsert(recordsToUpsert, { onConflict: 'student_id, date' });
            if (uError) throw uError;
        }
        return "OK";
    } catch (e: any) { return parseError(e); }
};

// --- Notas ---
export const getGradesAndCriteria = async (subject: string, term: string, courseName: string, userId: string): Promise<{ success: boolean, data: any }> => {
    const courseId = await getCourseIdByLabel(courseName, userId);
    const trimester = parseInt(term);
    const { data: criteria } = await supabase.from('grading_criteria').select('*').eq('course_id', courseId).eq('trimester', trimester);
    const criteriaTexts: any = { ser: [], saber: [], hacer: [], auto: [] };
    (criteria || []).forEach(c => { criteriaTexts[c.dimension] = c.titles; });
    const { data: students } = await supabase.from('students').select('id').eq('course_id', courseId);
    const studentIds = (students || []).map(s => s.id);
    const { data: grades } = await supabase.from('student_grades').select('*').in('student_id', studentIds).eq('trimester', trimester);
    const gradesMap: any = {};
    (grades || []).forEach(g => {
        if (!gradesMap[g.student_id]) gradesMap[g.student_id] = { ser: [], saber: [], hacer: [], auto: [] };
        gradesMap[g.student_id][g.dimension] = g.scores.map(String);
    });
    return { success: true, data: { criteriaTexts, grades: gradesMap } };
};

export const saveGradesAndCriteria = async (subject: string, term: string, criteriaTexts: any, gradesData: any, courseName: string, userId: string): Promise<{ success: boolean, message?: string }> => {
    const courseId = await getCourseIdByLabel(courseName, userId);
    const trimester = parseInt(term);
    const { data: students } = await supabase.from('students').select('id, status').eq('course_id', courseId);
    const activeStudentIds = new Set((students || []).filter(s => (s.status || 'ACTIVE') !== 'WITHDRAWN').map(s => String(s.id)));
    const criteriaRecords = Object.entries(criteriaTexts).map(([dim, titles]) => ({ course_id: courseId, trimester, dimension: dim, titles: titles }));
    await supabase.from('grading_criteria').upsert(criteriaRecords, { onConflict: 'course_id, trimester, dimension' });
    const gradeRecords: any[] = [];
    Object.entries(gradesData).forEach(([studentId, dimensions]: [string, any]) => {
        if (!activeStudentIds.has(studentId)) return;
        Object.entries(dimensions).forEach(([dim, scores]: [string, any]) => {
            gradeRecords.push({ student_id: studentId, trimester, dimension: dim, scores: scores.map((s: string) => parseFloat(s) || 0) });
        });
    });
    if (gradeRecords.length > 0) await supabase.from('student_grades').upsert(gradeRecords, { onConflict: 'student_id, trimester, dimension' });
    return { success: true };
};

export const getCentralizadorData = async (courseName: string, userId: string): Promise<{ success: boolean, data: any[] }> => {
    try {
        const courseId = await getCourseIdByLabel(courseName, userId);
        const { data: students } = await supabase.from('students').select('id, full_name, register_number, status').eq('course_id', courseId).order('register_number', { ascending: true });
        if (!students) return { success: true, data: [] };
        const studentIds = students.map(s => s.id);
        const { data: allGrades } = await supabase.from('student_grades').select('*').in('student_id', studentIds);
        const summary = students.map(s => {
            const studentGrades = (allGrades || []).filter(g => g.student_id === s.id);
            const getTrimScore = (t: number) => {
                const trimGrades = studentGrades.filter(g => g.trimester === t);
                let total = 0;
                ['ser', 'saber', 'hacer', 'auto'].forEach(dim => {
                    const dimEntry = trimGrades.find(g => g.dimension === dim);
                    if (dimEntry && dimEntry.scores && dimEntry.scores.length > 0) {
                        const sum = dimEntry.scores.reduce((a: number, b: number) => a + b, 0);
                        total += Math.round(sum / dimEntry.scores.length);
                    }
                });
                return total;
            };
            const t1 = getTrimScore(1);
            const t2 = getTrimScore(2);
            const t3 = getTrimScore(3);
            const validTrimesters = [t1, t2, t3].filter(t => t > 0).length;
            const anual = validTrimesters > 0 ? Math.round((t1 + t2 + t3) / 3) : 0;
            return { id: s.id, name: s.full_name, status: s.status || 'ACTIVE', t1, t2, t3, anual };
        });
        return { success: true, data: summary };
    } catch (e: any) { return { success: false, data: [] }; }
};

export const getTemasData = async (courseName: string, userId: string): Promise<{ success: boolean, data: any[] }> => {
    try {
        const { data: teacherCourses, error: cError } = await supabase.from('courses').select('id, label').eq('teacher_id', userId);
        if (cError) throw cError;
        const courseIds = (teacherCourses || []).map(c => c.id);
        const { data: progress, error: pError } = await supabase.from('curricular_progress').select('*').in('course_id', courseIds);
        if (pError) throw pError;
        const mapped = (teacherCourses || []).map(c => {
            const getTrim = (t: number) => {
                const found = progress?.find(p => p.course_id === c.id && p.trimester === t);
                return found ? { planned: found.planned, developed: found.developed } : { planned: 0, developed: 0 };
            };
            return { course: c.label, trimester1: getTrim(1), trimester2: getTrim(2), trimester3: getTrim(3) };
        });
        return { success: true, data: mapped };
    } catch (e: any) { return { success: false, data: [] }; }
};

export const saveTemasData = async (trimester: string, modifiedData: any, userId: string): Promise<any> => {
    try {
        const records: any[] = [];
        const tNum = parseInt(trimester);
        for (const [courseLabel, vals] of Object.entries(modifiedData)) {
            const courseId = await getCourseIdByLabel(courseLabel, userId);
            records.push({ course_id: courseId, trimester: tNum, planned: (vals as any).planned, developed: (vals as any).developed });
        }
        if (records.length > 0) {
            const { error } = await supabase.from('curricular_progress').upsert(records, { onConflict: 'course_id, trimester' });
            if (error) throw error;
        }
        return { success: true };
    } catch (e: any) { return { success: false, message: parseError(e) }; }
};

// --- Horarios ---
export const getScheduleData = async (userId: string): Promise<any[]> => {
    try {
        const { data, error } = await supabase.from('schedules').select('*').eq('teacher_id', userId).order('day_of_week', { ascending: true }).order('start_time', { ascending: true });
        if (error) throw error;
        return data || [];
    } catch (e) { 
        console.error("Error fetching schedule:", e);
        return []; 
    }
};

export const saveScheduleEntry = async (entry: any): Promise<string> => {
    try {
        // Objeto de datos limpio para la base de datos
        const record: any = { 
            teacher_id: entry.teacher_id,
            day_of_week: entry.day_of_week,
            start_time: entry.start_time,
            end_time: entry.end_time,
            course_label: entry.course_label,
            subject: entry.subject?.toString().toUpperCase().trim()
        };

        if (entry.id && entry.id !== "") {
            // Caso Actualización: Usamos el ID existente
            const { error } = await supabase
                .from('schedules')
                .update(record)
                .eq('id', entry.id);
            if (error) throw error;
        } else {
            // Caso Inserción: No enviamos ID para que Supabase genere el UUID
            const { error } = await supabase
                .from('schedules')
                .insert([record]);
            if (error) throw error;
        }
        
        return "OK";
    } catch (e: any) { 
        return parseError(e); 
    }
};

export const deleteScheduleEntry = async (entryId: string): Promise<string> => {
    try {
        const { error } = await supabase.from('schedules').delete().eq('id', entryId);
        if (error) throw error;
        return "OK";
    } catch (e) { return parseError(e); }
};

export const exportCompleteReportPdf = async (trimester: string, courseName: string, userId: string): Promise<any> => {
    return { data: { url: "https://docs.google.com/viewer?url=pdf_endpoint_pending", pageCount: "Supabase Report" } };
};

export const getBoletinNotes = async (studentId: string, term: string, courseName: string, userId: string): Promise<Record<string, number>> => {
    const trimester = parseInt(term);
    const { data: grades } = await supabase.from('student_grades').select('*').eq('student_id', studentId).eq('trimester', trimester);
    const notes: Record<string, number> = {};
    (grades || []).forEach(g => {
        const sum = g.scores.reduce((a: number, b: number) => a + b, 0);
        notes[g.dimension.toUpperCase()] = g.scores.length > 0 ? Math.round(sum / g.scores.length) : 0;
    });
    return notes;
};

export const generateBoletinImage = async (studentName: string, trimesterLabel: string, grades: Record<string, number>): Promise<string> => {
    return "https://docs.google.com/viewer?url=boletin_image_pending";
};

export const clearUserProperties = async (): Promise<boolean> => true;
