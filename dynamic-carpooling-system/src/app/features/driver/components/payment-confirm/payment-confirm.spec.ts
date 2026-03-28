import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentConfirm } from './payment-confirm';

describe('PaymentConfirm', () => {
  let component: PaymentConfirm;
  let fixture: ComponentFixture<PaymentConfirm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentConfirm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentConfirm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
