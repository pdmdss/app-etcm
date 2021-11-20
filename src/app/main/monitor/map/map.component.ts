import { AfterContentInit, Component, OnDestroy, OnInit } from '@angular/core';
import { MapService } from './map.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy, AfterContentInit {

  constructor(private map: MapService) {
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.map.destroy();
  }

  ngAfterContentInit(): void {
    this.map.init();
  }
}
