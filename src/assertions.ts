import { AssertionError } from 'assert';
import { NotFoundException } from '@nestjs/common';

export function assertIsDefined<T>(val: T): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new AssertionError({
      message: `Expected 'val' to be defined, but received ${val}`,
    });
  }
}

export function assertIsDefinedOrThrowNotFound<T>(
  val: T,
): asserts val is NonNullable<T> {
  if (val === undefined || val === null) {
    throw new NotFoundException();
  }
}

export function isNotNull<T>(val: T): val is NonNullable<T> {
  return val !== null && val !== undefined;
}
