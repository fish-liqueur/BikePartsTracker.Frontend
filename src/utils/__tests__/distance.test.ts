import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  distanceFractionDigits,
  formatDistance,
  inferMilesFromNavigatorLanguages,
  metersToUnit,
  reconvertDistanceDraft,
  regionFromLanguageTag,
  resolveDistanceUnit,
  unitToMeters,
} from '@/utils/distance';
import { setActiveLocale } from '@/i18n';

describe('distance helpers (ADR 0002)', () => {
  afterEach(() => {
    setActiveLocale('en');
    vi.unstubAllGlobals();
  });

  describe('resolveDistanceUnit / inference (B-01–B-05)', () => {
    it('B-01 explicit mi wins over metric browser', () => {
      expect(resolveDistanceUnit('mi', ['de-DE'])).toBe('mi');
    });

    it('B-02 null + en-US → mi', () => {
      expect(resolveDistanceUnit(null, ['en-US'])).toBe('mi');
    });

    it('B-03 null + bare en → km (not miles)', () => {
      expect(resolveDistanceUnit(null, ['en'])).toBe('km');
      expect(resolveDistanceUnit(undefined, ['en'])).toBe('km');
    });

    it('B-04 null + de-DE / unknown / empty → km', () => {
      expect(resolveDistanceUnit(null, ['de-DE'])).toBe('km');
      expect(resolveDistanceUnit(null, ['zh-CN'])).toBe('km');
      expect(resolveDistanceUnit(null, [])).toBe('km');
    });

    it('B-05 allowlist regions → mi', () => {
      for (const region of ['US', 'GB', 'LR', 'MM', 'AS', 'GU', 'MP', 'PR', 'VI', 'UM']) {
        expect(inferMilesFromNavigatorLanguages([`en-${region}`])).toBe(true);
        expect(resolveDistanceUnit(null, [`en-${region}`])).toBe('mi');
      }
      expect(resolveDistanceUnit(null, ['en-CA'])).toBe('km');
    });

    it('regionFromLanguageTag skips script subtags', () => {
      expect(regionFromLanguageTag('zh-Hans-CN')).toBe('CN');
      expect(regionFromLanguageTag('en')).toBeNull();
    });
  });

  describe('conversion round-trip (B-11)', () => {
    it('meters ↔ km / mi (statute mile 1609.344)', () => {
      const m = 16093.44;
      expect(metersToUnit(m, 'km')).toBeCloseTo(16.09344, 5);
      expect(metersToUnit(m, 'mi')).toBeCloseTo(10, 5);
      expect(unitToMeters(10, 'mi')).toBeCloseTo(16093.44, 5);
      expect(unitToMeters(metersToUnit(m, 'km'), 'km')).toBeCloseTo(m, 5);
      expect(unitToMeters(metersToUnit(m, 'mi'), 'mi')).toBeCloseTo(m, 5);
    });
  });

  describe('formatDistance (B-15, A-07)', () => {
    it('A-07 former 10 km / 700 km display meaningfully as km', () => {
      setActiveLocale('en');
      expect(formatDistance(10_000, 'km')).toBe('10 km');
      expect(formatDistance(700_000, 'km')).toBe('700 km');
    });

    it('always labels km/mi; fraction rules', () => {
      setActiveLocale('en');
      expect(formatDistance(1500, 'km')).toBe('1.5 km');
      expect(formatDistance(1000, 'km')).toBe('1 km');
      expect(formatDistance(50, 'km')).toMatch(/ km$/); // sub-0.1 → 2 digits
      expect(formatDistance(1609.344, 'mi')).toBe('1 mi');
    });

    it('number format follows active language', () => {
      setActiveLocale('de');
      expect(formatDistance(1500, 'km')).toBe('1,5 km');
    });

    it('distanceFractionDigits', () => {
      expect(distanceFractionDigits(10)).toBe(0);
      expect(distanceFractionDigits(1.5)).toBe(1);
      expect(distanceFractionDigits(0.05)).toBe(2);
    });
  });

  describe('reconvertDistanceDraft (B-14)', () => {
    it('reconverts numeric drafts; leaves empty/non-numeric', () => {
      const mi = reconvertDistanceDraft(
        10, 'km', 'mi'
      );
      expect(typeof mi === 'number' && mi).toBeCloseTo(6.21371, 4);
      expect(reconvertDistanceDraft(
        '', 'km', 'mi'
      )).toBe('');
      expect(reconvertDistanceDraft(
        'abc', 'km', 'mi'
      )).toBe('abc');
    });
  });
});
