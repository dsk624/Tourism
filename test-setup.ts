import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock the grecaptcha object for reCAPTCHA tests
global.grecaptcha = {
  execute: vi.fn().mockResolvedValue('mock-captcha-token'),
  reset: vi.fn()
} as any;

// Mock the crypto.subtle.digest method for hash generation
if (global.crypto && global.crypto.subtle) {
  vi.spyOn(global.crypto.subtle, 'digest').mockResolvedValue(new Uint8Array([1, 2, 3, 4]));
}

// Mock the btoa function
global.btoa = vi.fn().mockReturnValue('mock-base64-string');

// Mock the document.createElement function for canvas fingerprinting
const originalCreateElement = document.createElement.bind(document);
vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
  if (tagName === 'canvas') {
    return {
      width: 200,
      height: 50,
      getContext: vi.fn().mockReturnValue({
        fillStyle: '',
        fillRect: vi.fn(),
        font: '',
        fillText: vi.fn(),
        strokeStyle: '',
        lineWidth: 0,
        strokeRect: vi.fn(),
      }),
      toDataURL: vi.fn().mockReturnValue('mock-canvas-data-url')
    } as any;
  }
  return originalCreateElement(tagName);
});
