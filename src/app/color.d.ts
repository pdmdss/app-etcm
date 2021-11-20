interface ColorSet {
  name: string;
  items: {
    name: '0' | '1' | '2' | '3' | '4' | '5-' | '5+' | '6-' | '6+' | '7' | '!5-';
    svg?: {
      encode: 'base64';
      content: string;
    };
    background?: {
      color: {
        red: number;
        green: number;
        blue: number;
        alpha: number;
      };
    };
    text?: {
      font?: string;
      size?: number;
      color?: {
        red: number;
        green: number;
        blue: number;
        alpha: number;
      };
      content?: string;
    };
    border?: {
      width?: number;
      radius?: number;
      color?: {
        red: number;
        green: number;
        blue: number;
        alpha: number;
      };
    };
  }[];
}
