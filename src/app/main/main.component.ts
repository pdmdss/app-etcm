import { Component, OnInit } from '@angular/core';
import { ApiService } from '@/api/api.service';
import { Oauth2Service } from '@/api/oauth2.service';

import pack from '@/package';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  package = pack;
  initMode = false;
  status?: 'ok' | 'loading' | 'no-contract' | 'no-auth';

  constructor(private api: ApiService, private oauth2: Oauth2Service) {
  }

  ngOnInit(): void {
    this.status = 'loading';
    this.oauth2.refreshTokenCheck()
      .then(is => is ? this.contractCheck() : this.initMode = true)
      .finally(() => this.status = undefined);
  }

  async init() {
    this.initMode = false;
    this.status = 'loading';
    await this.oauth2.refreshTokenDelete();
    await this.oauth2.oAuth2ClassReInit();
    this.contractCheck();
  }

  private contractCheck() {
    this.initMode = false;
    this.api.contractList()
      .subscribe(
        res => this.status = res.items.filter(r => r.classification === 'telegram.earthquake').length > 0 ?
          'ok' : 'no-contract',
        error => this.status = 'no-auth');
  }
}
