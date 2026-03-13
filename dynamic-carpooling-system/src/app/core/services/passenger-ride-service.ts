import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PassengerRideService {
  pickup: any = null;
  destination: any = null;
  rideRequestId: string | null = null;
}
