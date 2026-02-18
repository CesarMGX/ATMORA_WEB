import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Solucion } from './solucion';

describe('Solucion', () => {
  let component: Solucion;
  let fixture: ComponentFixture<Solucion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Solucion]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Solucion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
