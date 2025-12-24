export type GetPathResponse = {
    path: string[];
    dist: number;
};

export type Profile = {
    id: number;
    uid: string;
    email: string;
    first_name: string;
    middle_name: string;
    last_name: string;
    group_id: number;
    group_name: string;
    role: string;
};