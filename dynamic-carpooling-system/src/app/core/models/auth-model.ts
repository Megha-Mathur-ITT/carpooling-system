export enum UserRole {
    Driver = 1,
    Passenger = 2
};

export interface LoginRequest {
    email: string;
    password: string;
};

export interface LoginResponse {
    token: string;
}

export interface RegisterRequest {
    role: UserRole,
    email: string,
    username: string,
    password: string,
    vehicleName?: string;
    maxSeats?: number;
    vehicleLicense?: string;
};
