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
