import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicianCalendarComponent } from './technician-calendar.component';

describe('TechnicianCalendarComponent', () => {
  let component: TechnicianCalendarComponent;
  let fixture: ComponentFixture<TechnicianCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TechnicianCalendarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TechnicianCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
