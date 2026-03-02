import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RosaVientos } from './rosa-vientos';

describe('RosaVientos', () => {
  let component: RosaVientos;
  let fixture: ComponentFixture<RosaVientos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RosaVientos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RosaVientos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
