import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DrawVisualComponent } from './draw-visual/draw-visual.component';
import { DrawVizComponent } from './draw-viz/draw-viz.component';
import { ExperimentComponent } from './experiment/experiment.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';

const routes: Routes = [{ path: '', component: LoginComponent },
{ path: 'home', component: HomeComponent },
{ path: 'login', component: LoginComponent },
  { path: 'drawViz', component: DrawVizComponent },
  { path: 'experiment', component: ExperimentComponent },
  { path: 'drawVisual', component: DrawVisualComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { 

}
