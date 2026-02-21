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

export type Lesson = {
    id: number;
    date: string; // YYYY-MM-DD
    start_time: string; // HH:MM
    end_time: string;   // HH:MM
    subject: string;
    classroom: string;
    group: Group;
    teacher: Teacher;
};