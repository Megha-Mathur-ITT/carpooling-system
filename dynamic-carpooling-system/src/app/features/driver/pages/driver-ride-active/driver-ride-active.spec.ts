import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverRideActive } from './driver-ride-active';

describe('DriverRideActive', () => {
  let component: DriverRideActive;
  let fixture: ComponentFixture<DriverRideActive>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverRideActive]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverRideActive);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
