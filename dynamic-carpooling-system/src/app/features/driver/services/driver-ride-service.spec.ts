import { TestBed } from '@angular/core/testing';

import { DriverRideService } from './driver-ride-service';

describe('DriverRideService', () => {
  let service: DriverRideService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DriverRideService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
