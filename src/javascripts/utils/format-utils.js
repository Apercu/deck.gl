import {rgb} from 'd3-color';

export function normalizeParam(p) {
  let {value} = p;
  let displayValue;

  switch (p.type) {
  case 'color':
    const color = rgb(value);
    value = [color.r, color.g, color.b];
    displayValue = '#' + value.map(
      v => `${v < 16 ? '0' : ''}${v.toString(16)}`
    ).join('');
    break;

  default:
    displayValue = value.toString();
  }
  return {...p, value, displayValue};
}
