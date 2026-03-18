import { TestBed } from '@angular/core/testing';

import { MapAnimation } from './map-animation';

describe('MapAnimation', () => {
  let service: MapAnimation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MapAnimation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
