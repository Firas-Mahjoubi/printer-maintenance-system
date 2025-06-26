import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratDetailsComponent } from './contrat-details.component';

describe('ContratDetailsComponent', () => {
  let component: ContratDetailsComponent;
  let fixture: ComponentFixture<ContratDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ContratDetailsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContratDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
