import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawVisualComponent } from './draw-visual.component';

describe('DrawVisualComponent', () => {
  let component: DrawVisualComponent;
  let fixture: ComponentFixture<DrawVisualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrawVisualComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DrawVisualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
