import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DriverHistoryDto,
  DriverHistoryPassengerDto,
} from '../models/ride-history.model';
 
@Injectable({ providedIn: 'root' })
export class RideHistoryService {
 
  private readonly base = `http://localhost:5091/api/DriverHistory`;
 
  constructor(private http: HttpClient) {}
 
  getDriverHistory(): Observable<DriverHistoryDto[]> {
    return this.http.get<DriverHistoryDto[]>(`${this.base}/driver/myhistory?_t=${Date.now()}`);
  }
 
  getPassengerHistory(): Observable<DriverHistoryPassengerDto[]> {
    return this.http.get<DriverHistoryPassengerDto[]>(`${this.base}/passenger/myrides?_t=${Date.now()}`);
  }
 
  rateDriver(
    passengerHistoryId: string,
    rating: number
  ): Observable<DriverHistoryPassengerDto> {
    return this.http.post<DriverHistoryPassengerDto>(
      `${this.base}/passenger/rate-driver/${passengerHistoryId}?_t=${Date.now()}`,
      { ratings: rating }
    );
  }
}
