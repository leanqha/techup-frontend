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

export type Teacher = {
    id: number;
    first_name: string;
    last_name: string;
    middle_name: string;
    full_name: string;
};

// Lesson types are a server-managed catalog now, so a lesson's type is just the
// catalog entry's name (e.g. "Лекция", "Экзамен").
export type LessonType = string;

// A lesson type from the catalog, with the accent color used on lesson cards.
export type LessonTypeMeta = {
    id: number;
    name: string;
    color: string;
};

export type Lesson = {
    id: number;
    date: string; // YYYY-MM-DD
    start_time: string; // HH:MM
    end_time: string;   // HH:MM
    subject: string;
    type: LessonType;
    room_id?: number;
    classroom: string; // room name, for display
    group: Group;
    teacher: Teacher;
};

export type LessonNote = {
    id: number;
    lesson_id: number;
    text: string;
    created_at: string;
    updated_at: string;
};
