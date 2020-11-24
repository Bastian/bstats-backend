import { Chart } from './chart.interface';

export interface DefaultChart extends Chart {
  requestParser:
    | PredefineValueParser
    | HardcodedParser
    | NameInRequestParser
    | NameInRequestBoolParser
    | NameInRequestNumberParser;
}

interface PredefineValueParser {
  predefinedValue: string | number;
}

interface HardcodedParser {
  useHardcodedParser: string;
  position?: 'global' | 'plugin';
}

interface NameInRequestParser {
  nameInRequest: string;
  position: 'global' | 'plugin';
}

interface NameInRequestBoolParser extends NameInRequestParser {
  type: 'boolean';
  trueValue: string;
  falseValue: string;
}

interface NameInRequestNumberParser extends NameInRequestParser {
  type: 'number';
}
