import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassengerRideConfirmationPage } from './passenger-ride-confirmation-page';

describe('PassengerRideConfirmationPage', () => {
  let component: PassengerRideConfirmationPage;
  let fixture: ComponentFixture<PassengerRideConfirmationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerRideConfirmationPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassengerRideConfirmationPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
