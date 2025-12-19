export type GetPathResponse = {
    path: string[];
    dist: number;
};

export type Profile = {
    id: number;
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
};