/**
 * Utilitários Universais e Formatadores de Dados (Padrão Cortex)
 */

export const utils = {
  /**
   * Formata número para moeda Real Brasileiro (BRL)
   */
  formatCurrency(value) {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return 'R$ 0,00';
    }
    return Number(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  /**
   * Formata data para formato legível no padrão bancário
   */
  formatDate(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Formata CPF com máscara (000.000.000-00)
   */
  formatCPF(cpf) {
    if (!cpf) return '';
    const clean = String(cpf).replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  },

  /**
   * Sanitiza strings removendo caracteres especiais
   */
  sanitizeDigits(str) {
    if (!str) return '';
    return String(str).replace(/\D/g, '');
  },

  /**
   * Copia texto para a área de transferência do dispositivo
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  }
};
