export class DateRange {
  private constructor(
    public readonly start: Date,
    public readonly end: Date,
  ) {
    if (start >= end) {
      throw new Error('Invalid date range: Start date must be before end date');
    }
  }

  static create(start: Date, end: Date): DateRange {
    return new DateRange(start, end);
  }

  /**
   * Check if this date range overlaps with another date range
   */
  overlaps(other: DateRange): boolean {
    return this.start < other.end && this.end > other.start;
  }

  /**
   * Check if a specific date falls within this range
   */
  contains(date: Date): boolean {
    return date >= this.start && date < this.end;
  }

  /**
   * Calculate the number of days in this range
   */
  getDays(): number {
    const diffTime = this.end.getTime() - this.start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate the number of days between a date and the end of this range
   * Returns negative if the date is after the end date
   */
  getDaysUntilEnd(fromDate: Date): number {
    const diffTime = this.end.getTime() - fromDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if this range has ended (end date is in the past)
   */
  hasEnded(now: Date = new Date()): boolean {
    return this.end <= now;
  }

  /**
   * Check if this range has started (start date is in the past)
   */
  hasStarted(now: Date = new Date()): boolean {
    return this.start <= now;
  }

  /**
   * Check if this range is currently active
   */
  isActive(now: Date = new Date()): boolean {
    return this.hasStarted(now) && !this.hasEnded(now);
  }

  /**
   * Extend the end date by a number of days
   */
  extendBy(days: number): DateRange {
    if (days <= 0) {
      throw new Error('Extension days must be positive');
    }
    const newEnd = new Date(this.end);
    newEnd.setDate(newEnd.getDate() + days);
    return new DateRange(this.start, newEnd);
  }

  equals(other: DateRange): boolean {
    return (
      this.start.getTime() === other.start.getTime() && this.end.getTime() === other.end.getTime()
    );
  }

  toString(): string {
    return `${this.start.toISOString()} to ${this.end.toISOString()}`;
  }
}
