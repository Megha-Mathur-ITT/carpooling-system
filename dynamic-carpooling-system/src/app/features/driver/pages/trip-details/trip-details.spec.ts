import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TripDetails } from './trip-details';

describe('TripDetails', () => {
  let component: TripDetails;
  let fixture: ComponentFixture<TripDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TripDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
