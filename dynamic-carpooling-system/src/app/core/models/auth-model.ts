export enum UserRole {
    Passenger = 1,
    Driver = 2,
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

export interface JwtPayload {
    sub: string;
    email: string;
    role: string; 
}
