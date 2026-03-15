import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RideRequestPopup } from './ride-request-popup';

describe('RideRequestPopup', () => {
  let component: RideRequestPopup;
  let fixture: ComponentFixture<RideRequestPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RideRequestPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RideRequestPopup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
