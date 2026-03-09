import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PnrSearch } from './pnr-search';

describe('PnrSearch', () => {
  let component: PnrSearch;
  let fixture: ComponentFixture<PnrSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PnrSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PnrSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
