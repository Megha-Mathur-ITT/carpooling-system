import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PassengerRideSelection } from './passenger-ride-selection-page';

describe('PassengerRideSelection', () => {
  let component: PassengerRideSelection;
  let fixture: ComponentFixture<PassengerRideSelection>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerRideSelection]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassengerRideSelection);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
