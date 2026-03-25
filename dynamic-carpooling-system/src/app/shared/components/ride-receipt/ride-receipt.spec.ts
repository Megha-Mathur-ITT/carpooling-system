import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RideReceipt } from './ride-receipt';

describe('RideReceipt', () => {
  let component: RideReceipt;
  let fixture: ComponentFixture<RideReceipt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RideReceipt]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RideReceipt);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
