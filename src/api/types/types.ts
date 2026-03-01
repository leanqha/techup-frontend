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

export type ForgotPasswordRequest = {
    email: string;
};

export type ForgotPasswordResponse = {
    message: string;
};

export type ResetPasswordRequest = {
    token: string;
    new_password: string;
};

export type ResetPasswordResponse = {
    message: string;
};
