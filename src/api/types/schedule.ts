// src/types/schedule.ts
export type Faculty = {
    id: number;
    name: string;
};

export type Group = {
    id: number;
    faculty_id: number;
    name: string;
    course: number;
    degree: string; // "бакалавриат" | "магистратура"
    year_start: number;
    specialization: string;
    is_active: boolean;
};

export type Lesson = {
    id: number;
    group_id: number;
    date: string; // ISO string
    start_time: string; // ISO string
    end_time: string;   // ISO string
    subject: string;
    teacher: string;
    classroom: string;
    created_at: string;
    note?: LessonNote;
};

export type LessonNote = {
    id: number;
    lessonId: number;
    text: string;
    createdAt: string;
    updatedAt: string;
};