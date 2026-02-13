import { DomainException } from '../DomainException';

// Concrete implementation for testing the abstract base class
class TestDomainException extends DomainException {
  constructor(message: string, code: string, metadata?: Record<string, unknown>) {
    super(message, code, metadata);
  }
}

describe('DomainException', () => {
  describe('constructor', () => {
    it('should create an exception with message and code', () => {
      const exception = new TestDomainException('Test error message', 'TEST_ERROR');

      expect(exception.message).toBe('Test error message');
      expect(exception.code).toBe('TEST_ERROR');
      expect(exception.name).toBe('TestDomainException');
    });

    it('should create an exception with metadata', () => {
      const metadata = { userId: '123', action: 'delete' };
      const exception = new TestDomainException('Test error', 'TEST_ERROR', metadata);

      expect(exception.metadata).toEqual(metadata);
    });

    it('should create an exception without metadata', () => {
      const exception = new TestDomainException('Test error', 'TEST_ERROR');

      expect(exception.metadata).toBeUndefined();
    });

    it('should set timestamp on creation', () => {
      const beforeCreation = new Date();
      const exception = new TestDomainException('Test error', 'TEST_ERROR');
      const afterCreation = new Date();

      expect(exception.timestamp).toBeInstanceOf(Date);
      expect(exception.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(exception.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });

    it('should be an instance of Error', () => {
      const exception = new TestDomainException('Test error', 'TEST_ERROR');

      expect(exception).toBeInstanceOf(Error);
      expect(exception).toBeInstanceOf(DomainException);
    });

    it('should have a stack trace', () => {
      const exception = new TestDomainException('Test error', 'TEST_ERROR');

      expect(exception.stack).toBeDefined();
      expect(exception.stack).toContain('TestDomainException');
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON without metadata', () => {
      const exception = new TestDomainException('Test error', 'TEST_ERROR');
      const json = exception.toJSON();

      expect(json.name).toBe('TestDomainException');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.timestamp).toBeDefined();
      expect(typeof json.timestamp).toBe('string');
    });

    it('should serialize to JSON with metadata', () => {
      const metadata = { userId: '123', action: 'delete' };
      const exception = new TestDomainException('Test error', 'TEST_ERROR', metadata);
      const json = exception.toJSON();

      expect(json.name).toBe('TestDomainException');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('TEST_ERROR');
      expect(json.metadata).toEqual(metadata);
      expect(json.timestamp).toBeDefined();
    });

    it('should serialize timestamp as ISO string', () => {
      const exception = new TestDomainException('Test error', 'TEST_ERROR');
      const json = exception.toJSON();

      expect(json.timestamp).toBe(exception.timestamp.toISOString());
    });
  });

  describe('toString', () => {
    it('should format exception without metadata', () => {
      const exception = new TestDomainException('Test error message', 'TEST_ERROR');
      const str = exception.toString();

      expect(str).toBe('[TEST_ERROR] Test error message');
    });

    it('should format exception with metadata', () => {
      const metadata = { userId: '123' };
      const exception = new TestDomainException('Test error message', 'TEST_ERROR', metadata);
      const str = exception.toString();

      expect(str).toContain('[TEST_ERROR] Test error message');
      expect(str).toContain('"userId":"123"');
    });

    it('should include all metadata properties', () => {
      const metadata = { userId: '123', action: 'delete', itemCount: 5 };
      const exception = new TestDomainException('Test error', 'TEST_ERROR', metadata);
      const str = exception.toString();

      expect(str).toContain('userId');
      expect(str).toContain('action');
      expect(str).toContain('itemCount');
    });
  });

  describe('instanceof checks', () => {
    it('should work correctly with instanceof', () => {
      const exception = new TestDomainException('Test error', 'TEST_ERROR');

      expect(exception instanceof TestDomainException).toBe(true);
      expect(exception instanceof DomainException).toBe(true);
      expect(exception instanceof Error).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should be catchable in try-catch block', () => {
      expect(() => {
        try {
          throw new TestDomainException('Test error', 'TEST_ERROR');
        } catch (error) {
          expect(error).toBeInstanceOf(TestDomainException);
          expect(error).toBeInstanceOf(DomainException);
          throw error;
        }
      }).toThrow(TestDomainException);
    });

    it('should preserve stack trace when caught and re-thrown', () => {
      let caughtError: Error | null = null;

      try {
        throw new TestDomainException('Test error', 'TEST_ERROR');
      } catch (error) {
        caughtError = error as Error;
      }

      expect(caughtError).not.toBeNull();
      expect(caughtError!.stack).toBeDefined();
      expect(caughtError!.stack).toContain('TestDomainException');
    });
  });
});
