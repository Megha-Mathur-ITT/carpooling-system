import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Toggler } from './toggler';

describe('Toggler', () => {
  let component: Toggler;
  let fixture: ComponentFixture<Toggler>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toggler]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Toggler);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
