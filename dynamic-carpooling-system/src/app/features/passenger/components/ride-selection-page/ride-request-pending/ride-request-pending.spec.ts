import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RideRequestPending } from './ride-request-pending';

describe('RideRequestPending', () => {
  let component: RideRequestPending;
  let fixture: ComponentFixture<RideRequestPending>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RideRequestPending]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RideRequestPending);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
