interface RideRequestCreateDto {
    pickup: {
        name: string;
        latitude: number;
        longitude: number;
    };
    destination: {
        name: string;
        latitude: number;
        longitude: number;
    };
}