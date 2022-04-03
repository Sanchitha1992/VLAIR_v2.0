import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawVizComponent } from './draw-viz.component';

describe('DrawVizComponent', () => {
  let component: DrawVizComponent;
  let fixture: ComponentFixture<DrawVizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrawVizComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawVizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
