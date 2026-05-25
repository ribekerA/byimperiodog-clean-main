/**
 * Validadores para IDs de tracking (pixels e analytics)
 * By Império Dog - Sistema de Pixels/Analytics
 */

import type { ValidationResult } from '@/types/tracking';

/**
 * Valida Facebook/Meta Pixel ID
 * - Deve ser string numérica (15-16 dígitos tipicamente)
 * - Sem espaços ou caracteres especiais
 * - Pode ser vazio/null
 * 
 * @example validateFacebookPixelId('1234567890123456') // { valid: true }
 * @example validateFacebookPixelId('abc123') // { valid: false, error: '...' }
 */
export function validateFacebookPixelId(id: string | null | undefined): ValidationResult {
  // Null ou vazio é válido (desabilita o pixel)
  if (!id || id.trim() === '') {
    return { valid: true };
  }

  const trimmed = id.trim();

  // Deve conter apenas dígitos
  if (!/^\d+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Facebook Pixel ID deve conter apenas números (ex: 1234567890123456)',
    };
  }

  // Tamanho típico: 15-16 dígitos
  if (trimmed.length < 10 || trimmed.length > 20) {
    return {
      valid: false,
      error: 'Facebook Pixel ID deve ter entre 10 e 20 dígitos',
    };
  }

  return { valid: true };
}

/**
 * Valida Google Analytics 4 ID (GA4)
 * - Deve começar com "G-" seguido de código alfanumérico
 * - Formato: G-XXXXXXXXXX
 * - Pode ser vazio/null
 * 
 * @example validateGoogleAnalyticsId('G-ABCD12345') // { valid: true }
 * @example validateGoogleAnalyticsId('UA-12345-1') // { valid: false, error: '...' }
 */
export function validateGoogleAnalyticsId(id: string | null | undefined): ValidationResult {
  // Null ou vazio é válido (desabilita o analytics)
  if (!id || id.trim() === '') {
    return { valid: true };
  }

  const trimmed = id.trim();

  // Deve começar com "G-"
  if (!trimmed.startsWith('G-')) {
    return {
      valid: false,
      error: 'Google Analytics ID deve começar com "G-" (formato GA4, ex: G-ABCD12345)',
    };
  }

  // Validar formato: G- seguido de alfanumérico
  if (!/^G-[A-Z0-9]{8,15}$/i.test(trimmed)) {
    return {
      valid: false,
      error: 'Google Analytics ID deve seguir o formato G-XXXXXXXXXX (GA4)',
    };
  }

  return { valid: true };
}

/**
 * Valida Google Tag Manager ID
 * - Deve começar com "GTM-" seguido de código alfanumérico
 * - Formato: GTM-XXXXXXX
 * 
 * @example validateGTMId('GTM-ABC123') // { valid: true }
 */
export function validateGTMId(id: string | null | undefined): ValidationResult {
  if (!id || id.trim() === '') {
    return { valid: true };
  }

  const trimmed = id.trim();

  if (!trimmed.startsWith('GTM-')) {
    return {
      valid: false,
      error: 'Google Tag Manager ID deve começar com "GTM-" (ex: GTM-ABC123)',
    };
  }

  if (!/^GTM-[A-Z0-9]{5,10}$/i.test(trimmed)) {
    return {
      valid: false,
      error: 'Google Tag Manager ID deve seguir o formato GTM-XXXXXXX',
    };
  }

  return { valid: true };
}

/**
 * Valida TikTok Pixel ID
 * - Formato alfanumérico (ex: C123ABC456DEF)
 * 
 * @example validateTikTokPixelId('C123ABC456DEF') // { valid: true }
 */
export function validateTikTokPixelId(id: string | null | undefined): ValidationResult {
  if (!id || id.trim() === '') {
    return { valid: true };
  }

  const trimmed = id.trim();

  // TikTok Pixel geralmente começa com "C" e tem formato alfanumérico
  if (!/^[A-Z0-9]{10,20}$/i.test(trimmed)) {
    return {
      valid: false,
      error: 'TikTok Pixel ID deve ser alfanumérico com 10-20 caracteres',
    };
  }

  return { valid: true };
}

/**
 * Valida Google Ads ID
 * - Formato: AW-XXXXXXXXXX
 * 
 * @example validateGoogleAdsId('AW-123456789') // { valid: true }
 */
export function validateGoogleAdsId(id: string | null | undefined): ValidationResult {
  if (!id || id.trim() === '') {
    return { valid: true };
  }

  const trimmed = id.trim();

  if (!trimmed.startsWith('AW-')) {
    return {
      valid: false,
      error: 'Google Ads ID deve começar com "AW-" (ex: AW-123456789)',
    };
  }

  if (!/^AW-\d{8,12}$/i.test(trimmed)) {
    return {
      valid: false,
      error: 'Google Ads ID deve seguir o formato AW-XXXXXXXXXX',
    };
  }

  return { valid: true };
}

/**
 * Valida Hotjar ID
 * - Apenas números (6-10 dígitos)
 * 
 * @example validateHotjarId('123456') // { valid: true }
 */
export function validateHotjarId(id: string | null | undefined): ValidationResult {
  if (!id || id.trim() === '') {
    return { valid: true };
  }

  const trimmed = id.trim();

  if (!/^\d{6,10}$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Hotjar ID deve conter apenas números (6-10 dígitos)',
    };
  }

  return { valid: true };
}

/**
 * Valida Microsoft Clarity ID
 * - Formato alfanumérico (ex: abcdef123456)
 * 
 * @example validateClarityId('abcdef123456') // { valid: true }
 */
export function validateClarityId(id: string | null | undefined): ValidationResult {
  if (!id || id.trim() === '') {
    return { valid: true };
  }

  const trimmed = id.trim();

  if (!/^[a-z0-9]{10,15}$/i.test(trimmed)) {
    return {
      valid: false,
      error: 'Clarity ID deve ser alfanumérico com 10-15 caracteres',
    };
  }

  return { valid: true };
}

/**
 * Valida Pinterest Tag ID
 * - Apenas números (13 dígitos tipicamente)
 * 
 * @example validatePinterestTagId('1234567890123') // { valid: true }
 */
export function validatePinterestTagId(id: string | null | undefined): ValidationResult {
  if (!id || id.trim() === '') {
    return { valid: true };
  }

  const trimmed = id.trim();

  if (!/^\d{13,16}$/.test(trimmed)) {
    return {
      valid: false,
      error: 'Pinterest Tag ID deve conter apenas números (13-16 dígitos)',
    };
  }

  return { valid: true };
}

/**
 * Valida meta de posts semanal
 * 
 * @example validateWeeklyPostGoal(7) // { valid: true }
 */
export function validateWeeklyPostGoal(goal: number | null | undefined): ValidationResult {
  if (goal === null || goal === undefined) {
    return { valid: true };
  }

  const num = Number(goal);

  if (isNaN(num) || !Number.isInteger(num)) {
    return {
      valid: false,
      error: 'Meta de posts semanal deve ser um número inteiro',
    };
  }

  if (num < 1 || num > 100) {
    return {
      valid: false,
      error: 'Meta de posts semanal deve estar entre 1 e 100',
    };
  }

  return { valid: true };
}
