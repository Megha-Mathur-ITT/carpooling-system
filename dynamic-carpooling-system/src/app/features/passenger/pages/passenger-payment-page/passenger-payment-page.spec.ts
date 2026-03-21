import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassengerPaymentPage } from './passenger-payment-page';

describe('PassengerPaymentPage', () => {
  let component: PassengerPaymentPage;
  let fixture: ComponentFixture<PassengerPaymentPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerPaymentPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassengerPaymentPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
