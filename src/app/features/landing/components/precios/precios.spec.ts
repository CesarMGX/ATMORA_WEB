import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Precios } from './precios';

describe('Precios', () => {
  let component: Precios;
  let fixture: ComponentFixture<Precios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Precios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Precios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
