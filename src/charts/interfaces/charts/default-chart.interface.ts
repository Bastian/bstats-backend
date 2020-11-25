import { Chart } from './chart.interface';

export type DefaultChart = Omit<Chart, 'id'> & {
  requestParser:
    | PredefineValueParser
    | HardcodedParser
    | NameInRequestParser
    | NameInRequestBoolParser
    | NameInRequestNumberParser;
};

interface PredefineValueParser {
  predefinedValue: string | number;
}

export function isPredefinedValueParser(
  requestParser: DefaultChart['requestParser'],
): requestParser is PredefineValueParser {
  return (requestParser as PredefineValueParser).predefinedValue !== undefined;
}

interface HardcodedParser {
  useHardcodedParser: string;
  position?: 'global' | 'plugin';
}

export function isHardcodedParser(
  requestParser: DefaultChart['requestParser'],
): requestParser is HardcodedParser {
  return (requestParser as HardcodedParser).useHardcodedParser !== undefined;
}

interface NameInRequestParser {
  nameInRequest: string;
  position: 'global' | 'plugin';
}

export function isNameInRequestParser(
  requestParser: DefaultChart['requestParser'],
): requestParser is NameInRequestParser {
  return (requestParser as NameInRequestParser).nameInRequest !== undefined;
}

interface NameInRequestBoolParser extends NameInRequestParser {
  type: 'boolean';
  trueValue: string;
  falseValue: string;
}

export function isNameInRequestBoolParser(
  requestParser: DefaultChart['requestParser'],
): requestParser is NameInRequestBoolParser {
  return (requestParser as NameInRequestBoolParser).type === 'boolean';
}

interface NameInRequestNumberParser extends NameInRequestParser {
  type: 'number';
}

export function isNameInRequestNumberParser(
  requestParser: DefaultChart['requestParser'],
): requestParser is NameInRequestNumberParser {
  return (requestParser as NameInRequestNumberParser).type === 'number';
}
