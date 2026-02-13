export class Money {
  private readonly _cents: number;

  private constructor(cents: number) {
    if (cents < 0) {
      throw new Error('Money amount cannot be negative');
    }
    if (!Number.isInteger(cents)) {
      throw new Error('Money amount must have at most 2 decimal places');
    }
    this._cents = cents;
  }

  static zero(): Money {
    return new Money(0);
  }

  static dollars(amount: number): Money {
    const cents = Math.round(amount * 100);
    // Validate that the original amount had at most 2 decimal places by
    // checking that rounding to the nearest cent introduces only floating-point
    // noise (< 1e-10 dollars), not a real sub-cent component (>= 0.001 dollars).
    if (Math.abs(cents / 100 - amount) > 1e-10) {
      throw new Error('Money amount must have at most 2 decimal places');
    }
    return new Money(cents);
  }

  static fromCents(cents: number): Money {
    return new Money(cents);
  }

  get amount(): number {
    return this._cents / 100;
  }

  get cents(): number {
    return this._cents;
  }

  add(other: Money): Money {
    return new Money(this._cents + other._cents);
  }

  subtract(other: Money): Money {
    return new Money(this._cents - other._cents);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this._cents * factor));
  }

  isGreaterThan(other: Money): boolean {
    return this._cents > other._cents;
  }

  isLessThan(other: Money): boolean {
    return this._cents < other._cents;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    return this._cents >= other._cents;
  }

  isLessThanOrEqual(other: Money): boolean {
    return this._cents <= other._cents;
  }

  equals(other: Money): boolean {
    return this._cents === other._cents;
  }

  toString(): string {
    return `$${(this._cents / 100).toFixed(2)}`;
  }
}
