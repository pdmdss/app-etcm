import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OauthRoutingModule } from './oauth-routing.module';

import { OauthComponent } from './oauth.component';


@NgModule({
  declarations: [
    OauthComponent
  ],
  imports: [
    CommonModule,
    OauthRoutingModule
  ]
})
export class OauthModule {
}
