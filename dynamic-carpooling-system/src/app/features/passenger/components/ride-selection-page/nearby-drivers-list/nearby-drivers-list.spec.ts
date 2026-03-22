import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NearbyDriversList } from './nearby-drivers-list';

describe('NearbyDriversList', () => {
  let component: NearbyDriversList;
  let fixture: ComponentFixture<NearbyDriversList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NearbyDriversList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NearbyDriversList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
