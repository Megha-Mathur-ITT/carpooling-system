import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassengerList } from './passenger-list';

describe('PassengerList', () => {
  let component: PassengerList;
  let fixture: ComponentFixture<PassengerList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassengerList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
