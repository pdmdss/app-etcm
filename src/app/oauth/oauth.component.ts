import { Component, OnInit } from '@angular/core';

import { Oauth2Service } from '@/api/oauth2.service';

@Component({
  selector: 'app-oauth',
  templateUrl: './oauth.component.html',
  styleUrls: ['./oauth.component.css']
})
export class OauthComponent implements OnInit {

  constructor(private oauth2: Oauth2Service) {
  }

  ngOnInit(): void {
  }

}
