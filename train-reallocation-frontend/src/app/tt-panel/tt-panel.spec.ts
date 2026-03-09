import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtPanel } from './tt-panel';

describe('TtPanel', () => {
  let component: TtPanel;
  let fixture: ComponentFixture<TtPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
