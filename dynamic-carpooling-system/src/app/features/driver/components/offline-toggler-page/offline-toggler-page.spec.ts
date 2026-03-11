import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OfflineTogglerPage } from './offline-toggler-page';

describe('OfflineTogglerPage', () => {
  let component: OfflineTogglerPage;
  let fixture: ComponentFixture<OfflineTogglerPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OfflineTogglerPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OfflineTogglerPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
