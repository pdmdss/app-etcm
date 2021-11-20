import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';

import { MainModule } from './main/main.module';
import { OauthModule } from './oauth/oauth.module';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    MainModule,
    OauthModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
