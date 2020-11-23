export interface Service {
  id: number;
  name: string;
  owner: {
    name: string;
  };
  software: {
    id: number;
  };
  isGlobal: boolean;
  chartIds: number[];
}
