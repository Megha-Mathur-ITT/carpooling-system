import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RidePinVerify } from './ride-pin-verify';

describe('RidePinVerify', () => {
  let component: RidePinVerify;
  let fixture: ComponentFixture<RidePinVerify>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RidePinVerify]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RidePinVerify);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
