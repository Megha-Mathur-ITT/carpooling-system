import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverLanding } from './driver-landing';

describe('DriverLanding', () => {
  let component: DriverLanding;
  let fixture: ComponentFixture<DriverLanding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverLanding]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverLanding);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
