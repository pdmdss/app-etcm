import { Pipe, PipeTransform } from '@angular/core';
import { Components } from '@dmdata/api-types';

@Pipe({
  name: 'intColor'
})
export class IntColorPipe implements PipeTransform {

  transform(value: Components.Earthquake.IntensityClass | null | undefined): string {
    if (!value) {
      return '0';
    }

    if (value[1] === '-') {
      return `${value[0]}1`;
    }
    if (value[1] === '+') {
      return `${value[0]}2`;
    }

    return value;
  }

}
