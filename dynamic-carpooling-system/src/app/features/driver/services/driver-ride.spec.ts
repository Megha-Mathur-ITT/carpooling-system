import { TestBed } from '@angular/core/testing';

import { DriverRide } from './driver-ride';

describe('DriverRide', () => {
  let service: DriverRide;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DriverRide);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
