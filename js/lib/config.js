/**
 * Dicionários de Configuração e Constantes de Domínio (Padrão Cortex)
 */

export const STORAGE_KEYS = {
  TOKEN: 'laobank_jwt_token',
  USER: 'laobank_user_data',
  API_KEY: 'laobank_api_key',
  HIDE_BALANCE: 'laobank_hide_balance',
  SIDEBAR_EXPANDED: 'laobank_sidebar_expanded',
  API_BASE_URL: 'laobank_api_base_url'
};

export const DEFAULT_CONFIG = {
  BASE_URL: 'http://localhost:8080',
  API_KEY: 'laobank-digital-key-99999',
  TENANT_NAME: 'LãoBank Digital Banking',
  TENANT_SCHEMA: 'tenant_laobank'
};

export const TRANSACTION_TYPE_CONFIG = {
  PIX: {
    label: 'Transferência Pix',
    icon: '⚡',
    badgeClass: 'badge-info',
    iconClass: 'pix'
  },
  CARD: {
    label: 'Cartão de Crédito',
    icon: '💳',
    badgeClass: 'badge-purple',
    iconClass: 'card'
  },
  LOAN: {
    label: 'Empréstimo Depositado',
    icon: '💰',
    badgeClass: 'badge-success',
    iconClass: 'loan'
  }
};

export const LOAN_MODALITY_CONFIG = {
  PERSONAL: {
    name: 'Empréstimo Pessoal',
    badgeClass: 'badge-primary',
    tagClass: 'nubank-pill-gold',
    interestRate: 4.0
  },
  GUARANTEED: {
    name: 'Empréstimo com Garantia',
    badgeClass: 'badge-info',
    tagClass: 'nubank-pill-gold',
    interestRate: 3.0
  },
  CONSIGNMENT: {
    name: 'Empréstimo Consignado',
    badgeClass: 'badge-success',
    tagClass: 'nubank-pill-emerald',
    interestRate: 2.0
  }
};

export const CARD_PLANS_CONFIG = {
  FREE: {
    id: 'FREE',
    name: 'LãoBank Classic',
    cardName: 'Cartão Físico Classic',
    fee: 'Grátis (R$ 0,00/mês)',
    price: 0.00,
    cdbRate: 101,
    badge: '★ Cliente Classic',
    pillClass: 'nubank-pill-silver',
    colorGrad: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #020617 100%)',
    accentColor: '#94a3b8',
    description: 'Sem anuidade, Pix ilimitado e CDB a 101% do CDI.'
  },
  GOLD: {
    id: 'GOLD',
    name: 'LãoBank Gold Executive',
    cardName: 'Cartão Físico Gold Executive',
    fee: 'R$ 54,99/mês',
    price: 54.99,
    cdbRate: 108,
    badge: '★ Cliente Gold Executive',
    pillClass: 'nubank-pill-gold',
    colorGrad: 'linear-gradient(135deg, #78350f 0%, #451a03 50%, #1c0a00 100%)',
    accentColor: '#fbbf24',
    description: 'Cashback turbinado, atendimento VIP e CDB a 108% do CDI.'
  },
  BLACK: {
    id: 'BLACK',
    name: 'LãoBank Black Prestige',
    cardName: 'Cartão Físico Black Prestige',
    fee: 'R$ 109,99/mês',
    price: 109.99,
    cdbRate: 112,
    badge: '★ Cliente Black Prestige',
    pillClass: 'nubank-pill-emerald',
    colorGrad: 'linear-gradient(135deg, #1e1338 0%, #0f172a 50%, #080c16 100%)',
    accentColor: '#c5a059',
    description: 'Salas VIP LoungeKey, Concierge 24/7 e CDB a 112% do CDI.'
  }
};

