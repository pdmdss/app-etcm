import { TestBed } from '@angular/core/testing';

import { MsgUpdateService } from './msg-update.service';

describe('MsgUpdateService', () => {
  let service: MsgUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MsgUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
