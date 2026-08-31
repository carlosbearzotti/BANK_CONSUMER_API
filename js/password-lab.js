import { passwordService } from './services/passwordService.js';

export const passwordLabModule = {
  init(showToast) {
    const input = document.getElementById('pwdLabInput');
    const validateBtn = document.getElementById('pwdLabValidateBtn');
    const meterFill = document.getElementById('pwdMeterFill');
    const meterLabel = document.getElementById('pwdMeterLabel');

    const rules = {
      length: { el: document.getElementById('ruleLength'), test: (p) => p.length >= 8 },
      uppercase: { el: document.getElementById('ruleUpper'), test: (p) => /[A-Z]/.test(p) },
      lowercase: { el: document.getElementById('ruleLower'), test: (p) => /[a-z]/.test(p) },
      digit: { el: document.getElementById('ruleDigit'), test: (p) => /[0-9]/.test(p) },
      special: { el: document.getElementById('ruleSpecial'), test: (p) => /[\W_]/.test(p) }
    };

    const updateChecklist = (pwd) => {
      let passedCount = 0;
      for (const key in rules) {
        const passed = rules[key].test(pwd);
        if (passed) passedCount++;
        if (rules[key].el) {
          rules[key].el.className = `password-rule-item ${passed ? 'valid' : 'invalid'}`;
          const icon = rules[key].el.querySelector('.rule-icon');
          if (icon) icon.textContent = passed ? '✓' : '✗';
        }
      }

      const percent = (passedCount / 5) * 100;
      if (meterFill) {
        meterFill.style.width = `${percent}%`;
        if (passedCount <= 2) meterFill.style.backgroundColor = 'var(--status-danger)';
        else if (passedCount <= 4) meterFill.style.backgroundColor = 'var(--status-warning)';
        else meterFill.style.backgroundColor = 'var(--status-success)';
      }

      if (meterLabel) {
        if (passedCount === 0) meterLabel.textContent = 'Digite uma senha...';
        else if (passedCount <= 2) meterLabel.textContent = 'Senha Fraca';
        else if (passedCount <= 4) meterLabel.textContent = 'Senha Média';
        else meterLabel.textContent = 'Senha Forte e Segura!';
      }
    };

    if (input) {
      input.addEventListener('input', (e) => {
        updateChecklist(e.target.value);
      });
    }

    if (validateBtn) {
      validateBtn.addEventListener('click', async () => {
        const password = input ? input.value : '';
        try {
          await passwordService.validate(password);

          // O backend retorna 204 No Content quando a senha atende a todas as 5 regras
          showToast('LãoBank Segurança: Senha VÁLIDA e em total conformidade!', 'success');
        } catch (err) {
          const reasons = err.data?.failures ? err.data.failures.join(' • ') : err.message;
          showToast(`API LãoBank rejeitou: ${reasons}`, 'warning');
        }
      });
    }
  }
};
