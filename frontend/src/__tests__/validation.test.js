import { describe, it, expect } from 'vitest';

describe('Frontend Form Validation & Input Constraints', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  describe('Email format validation', () => {
    it('accepts valid RFC-compliant user email formats', () => {
      const validEmails = [
        'driver@voltroute.com',
        'john.doe@subdomain.example.org',
        'ev_tester+123@domain.co.uk',
      ];
      validEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(true);
      });
    });

    it('rejects malformed email formats', () => {
      const invalidEmails = [
        '',
        'notanemail',
        '@missinguser.com',
        'missingdomain@',
        'spaces in@email.com',
      ];
      invalidEmails.forEach((email) => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Password length requirement', () => {
    const isPasswordValid = (pw) => typeof pw === 'string' && pw.length >= 6;

    it('accepts passwords of 6 or more characters', () => {
      expect(isPasswordValid('123456')).toBe(true);
      expect(isPasswordValid('secure_pass_phrase!99')).toBe(true);
    });

    it('rejects short passwords under 6 characters', () => {
      expect(isPasswordValid('')).toBe(false);
      expect(isPasswordValid('12345')).toBe(false);
      expect(isPasswordValid(null)).toBe(false);
    });
  });

  describe('Geographic coordinates validation', () => {
    const isValidCoordinate = (lat, lon) => {
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      return (
        !isNaN(latNum) &&
        latNum >= -90 &&
        latNum <= 90 &&
        !isNaN(lonNum) &&
        lonNum >= -180 &&
        lonNum <= 180
      );
    };

    it('accepts valid global latitude and longitude', () => {
      expect(isValidCoordinate('37.7749', '-122.4194')).toBe(true);
      expect(isValidCoordinate(0, 0)).toBe(true);
      expect(isValidCoordinate('-90', '180')).toBe(true);
      expect(isValidCoordinate('90', '-180')).toBe(true);
    });

    it('rejects out-of-bounds coordinates', () => {
      expect(isValidCoordinate('90.1', '0')).toBe(false);
      expect(isValidCoordinate('-91', '0')).toBe(false);
      expect(isValidCoordinate('0', '180.1')).toBe(false);
      expect(isValidCoordinate('0', '-181')).toBe(false);
      expect(isValidCoordinate('invalid', '12')).toBe(false);
    });
  });

  describe('Search distance & power validation', () => {
    const isValidRadius = (r) => {
      const num = Number(r);
      return !isNaN(num) && num > 0 && num <= 500;
    };

    it('accepts valid radius in km', () => {
      expect(isValidRadius(5)).toBe(true);
      expect(isValidRadius(10)).toBe(true);
      expect(isValidRadius(100)).toBe(true);
    });

    it('rejects invalid radius values', () => {
      expect(isValidRadius(0)).toBe(false);
      expect(isValidRadius(-10)).toBe(false);
      expect(isValidRadius(600)).toBe(false);
      expect(isValidRadius('abc')).toBe(false);
    });
  });
});
