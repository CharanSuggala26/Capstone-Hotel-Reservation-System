import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignHotel } from './assign-hotel';

describe('AssignHotel', () => {
  let component: AssignHotel;
  let fixture: ComponentFixture<AssignHotel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignHotel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignHotel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
