import { TestBed } from '@angular/core/testing';

import { PassengerRideService } from './passenger-ride-service';

describe('PassengerRideService', () => {
  let service: PassengerRideService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PassengerRideService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
