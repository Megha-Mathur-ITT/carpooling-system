import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassengerLandingPage } from './passenger-landing-page';

describe('PassengerLandingPage', () => {
  let component: PassengerLandingPage;
  let fixture: ComponentFixture<PassengerLandingPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerLandingPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassengerLandingPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
