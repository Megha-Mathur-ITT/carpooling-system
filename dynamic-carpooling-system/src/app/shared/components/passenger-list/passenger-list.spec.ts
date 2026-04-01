
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassengerListComponent } from './passenger-list';

describe('PassengerListComponent', () => {
  let component: PassengerListComponent;
  let fixture: ComponentFixture<PassengerListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassengerListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
