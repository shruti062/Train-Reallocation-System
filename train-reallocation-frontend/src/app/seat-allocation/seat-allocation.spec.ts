import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatAllocation } from './seat-allocation';

describe('SeatAllocation', () => {
  let component: SeatAllocation;
  let fixture: ComponentFixture<SeatAllocation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatAllocation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatAllocation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
