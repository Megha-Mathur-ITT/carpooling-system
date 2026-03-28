import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassengerHistory } from './passenger-history';

describe('PassengerHistory', () => {
  let component: PassengerHistory;
  let fixture: ComponentFixture<PassengerHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerHistory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassengerHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
