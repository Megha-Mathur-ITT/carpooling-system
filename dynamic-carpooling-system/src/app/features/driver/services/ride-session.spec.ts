import { TestBed } from '@angular/core/testing';

import { RideSessionService } from './ride-session';

describe('RideSession', () => {
  let service: RideSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RideSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
