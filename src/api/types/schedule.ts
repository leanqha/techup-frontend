// src/types/schedule.ts
export type Faculty = {
    id: number;
    name: string;
};

export type Group = {
    id: number;
    facultyId: number;
    name: string;
    course: number;
    degree: string; // "бакалавриат" | "магистратура"
    yearStart: number;
    specialization: string;
    isActive: boolean;
};

export type Lesson = {
    id: number;
    groupId: number;
    date: string; // ISO string
    startTime: string; // ISO string
    endTime: string;   // ISO string
    subject: string;
    teacher: string;
    classroom: string;
    createdAt: string;
    note?: LessonNote;
};

export type LessonNote = {
    id: number;
    lessonId: number;
    text: string;
    createdAt: string;
    updatedAt: string;
};