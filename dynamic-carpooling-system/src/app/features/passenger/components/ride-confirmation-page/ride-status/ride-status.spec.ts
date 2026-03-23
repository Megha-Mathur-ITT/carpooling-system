import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RideStatus } from './ride-status';

describe('RideStatus', () => {
  let component: RideStatus;
  let fixture: ComponentFixture<RideStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RideStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RideStatus);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
