export interface Detection {
  box: [number, number, number, number];
  class: string;
  translated: string;
  confidence: number;
}
