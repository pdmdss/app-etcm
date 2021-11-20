import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainModule } from './main/main.module';
import { OauthModule } from './oauth/oauth.module';


const routes: Routes = [
  {
    path: '',
    loadChildren: async () => MainModule
  },
  {
    path: 'oauth',
    loadChildren: async () => OauthModule
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  exports: [
    RouterModule
  ],
  imports: [
    RouterModule.forRoot(routes, { enableTracing: false })
  ]
})
export class AppRoutingModule {
}
