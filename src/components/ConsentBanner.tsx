'use client';
import { Cookie, Settings, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  acceptAllConsent,
  getCurrentConsent,
  hasConsent,
  rejectAllConsent,
  saveConsent,
  type ConsentPreferences,
} from '@/lib/consent';

export default function ConsentBanner() {
  const [show, setShow] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: true,
  });

  useEffect(() => {
    // Verifica se já tem consentimento salvo
    if (!hasConsent()) {
      setShow(true);
    }
    
    // Carrega preferências atuais
    const current = getCurrentConsent();
    setPreferences(current);
  }, []);

  const handleAcceptAll = () => {
    acceptAllConsent();
    setShow(false);
    setShowSettings(false);
  };

  const handleRejectAll = () => {
    rejectAllConsent();
    setShow(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setShow(false);
    setShowSettings(false);
  };

  const toggleCategory = (category: keyof ConsentPreferences) => {
    if (category === 'necessary') return; // Não pode desabilitar necessários
    
    setPreferences((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (!show) return null;

  return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-200 shadow-2xl transition-transform duration-200 will-change-transform"
        role="dialog"
        aria-labelledby="consent-title"
        aria-describedby="consent-description"
      >
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {!showSettings ? (
            // Banner simples
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="h-6 w-6 text-brand shrink-0 mt-1" aria-hidden="true" />
                <div>
                  <h2 id="consent-title" className="text-lg font-semibold text-gray-900">
                    🍪 Cookies e Privacidade
                  </h2>
                  <p id="consent-description" className="mt-1 text-sm text-gray-600 leading-relaxed">
                    Usamos cookies essenciais e opcionais para melhorar sua experiência, 
                    analisar nosso tráfego e personalizar conteúdo. Você pode escolher suas 
                    preferências.{' '}
                    <Link
                      href="/politica-de-privacidade"
                      className="underline hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded"
                    >
                      Saiba mais
                    </Link>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setShowSettings(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 transition"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                  Preferências
                </button>
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 transition"
                >
                  Rejeitar
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 transition shadow-sm"
                >
                  Aceitar Todos
                </button>
              </div>
            </div>
          ) : (
            // Configurações detalhadas
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Preferências de Cookies
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  aria-label="Fechar configurações"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                {/* Necessários */}
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">Necessários</h3>
                      <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
                        Sempre ativo
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Essenciais para o funcionamento do site (autenticação, carrinho, segurança).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="mt-1 h-5 w-5 rounded text-brand cursor-not-allowed opacity-50"
                    aria-label="Cookies necessários sempre ativos"
                  />
                </div>

                {/* Funcionais */}
                <div className="flex items-start justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Funcionais</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Lembram suas preferências (tema, idioma) para melhorar sua experiência.
                    </p>
                  </div>
                  <button
                    onClick={() => toggleCategory('functional')}
                    className="mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
                    aria-label={`Cookies funcionais ${preferences.functional ? 'ativados' : 'desativados'}`}
                  >
                    <div
                      className={`relative w-11 h-6 rounded-full transition ${
                        preferences.functional ? 'bg-brand' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          preferences.functional ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* Analytics */}
                <div className="flex items-start justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Analytics</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Nos ajudam a entender como você usa o site (Google Analytics, Hotjar, Clarity).
                    </p>
                  </div>
                  <button
                    onClick={() => toggleCategory('analytics')}
                    className="mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
                    aria-label={`Cookies de analytics ${preferences.analytics ? 'ativados' : 'desativados'}`}
                  >
                    <div
                      className={`relative w-11 h-6 rounded-full transition ${
                        preferences.analytics ? 'bg-brand' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          preferences.analytics ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* Marketing */}
                <div className="flex items-start justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Marketing</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Permitem anúncios personalizados (Facebook, TikTok, Pinterest, LinkedIn).
                    </p>
                  </div>
                  <button
                    onClick={() => toggleCategory('marketing')}
                    className="mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
                    aria-label={`Cookies de marketing ${preferences.marketing ? 'ativados' : 'desativados'}`}
                  >
                    <div
                      className={`relative w-11 h-6 rounded-full transition ${
                        preferences.marketing ? 'bg-brand' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          preferences.marketing ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 transition"
                >
                  Rejeitar Todos
                </button>
                <button
                  onClick={handleSavePreferences}
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand rounded-lg hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 transition shadow-sm"
                >
                  Salvar Preferências
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
