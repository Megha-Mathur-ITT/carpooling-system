import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RouteSearch } from './route-search';

describe('RouteSearch', () => {
  let component: RouteSearch;
  let fixture: ComponentFixture<RouteSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouteSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RouteSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
