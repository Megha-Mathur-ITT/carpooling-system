import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverActiveRidePanel } from './driver-active-ride-panel';

describe('DriverActiveRidePanel', () => {
  let component: DriverActiveRidePanel;
  let fixture: ComponentFixture<DriverActiveRidePanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverActiveRidePanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverActiveRidePanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
