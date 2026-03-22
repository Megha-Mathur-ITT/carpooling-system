import { TestBed } from '@angular/core/testing';

import { DriverAnimation } from './driver-animation';

describe('DriverAnimation', () => {
  let service: DriverAnimation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DriverAnimation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
