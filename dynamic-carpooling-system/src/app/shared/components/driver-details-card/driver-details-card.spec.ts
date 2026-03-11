import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DriverDetailsCard } from './driver-details-card';

describe('DriverDetailsCard', () => {
  let component: DriverDetailsCard;
  let fixture: ComponentFixture<DriverDetailsCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverDetailsCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DriverDetailsCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
