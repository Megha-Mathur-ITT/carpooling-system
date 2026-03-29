import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RideRequestPanel } from './ride-request-panel';

describe('RideRequestPanel', () => {
  let component: RideRequestPanel;
  let fixture: ComponentFixture<RideRequestPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RideRequestPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RideRequestPanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
