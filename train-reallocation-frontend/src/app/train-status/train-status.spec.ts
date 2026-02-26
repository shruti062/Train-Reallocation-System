import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainStatus } from './train-status';

describe('TrainStatus', () => {
  let component: TrainStatus;
  let fixture: ComponentFixture<TrainStatus>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainStatus]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
