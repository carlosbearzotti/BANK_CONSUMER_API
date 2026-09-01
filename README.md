# 📱 consumerLãoBank — Portal B2C & Internet Banking Digital

[![Vanilla JS](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3 Glassmorphism](https://img.shields.io/badge/CSS3-Glassmorphism%20Dark-blue.svg)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![HTML5](https://img.shields.io/badge/HTML5-Single%20Page%20App-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![Consumer API](https://img.shields.io/badge/Backend-Integrados%20API-brightgreen.svg)](https://github.com/carlosbearzotti/INTEGRATE_SERVICES_JAVA_API)

Aplicação Frontend **Single Page Application (SPA)** moderna, elegante e desacoplada, servindo como o **Internet Banking B2C** do banco digital fictício **LãoBank**.

---

## 🎯 Casos de Uso & Propósito

O **`consumerLãoBank`** foi projetado para atender o cliente final (Pessoa Física e Jurídica), proporcionando uma experiência de autoatendimento bancário fluida com estética *Dark Mode*, efeitos de *Glassmorphism* e feedback visual em tempo real.

---

## 🔌 Funcionalidades Consumidas do Backend (`Integrados`)

Esta aplicação consome diretamente a API centralizadora REST em `http://localhost:8080`:

### 1. 🔐 Autenticação, Sessão & Recuperação de Senha
- **Endpoints**: `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- **Funcionalidades**:
  - Cadastro de correntista com validação de dados.
  - Login seguro com recebimento e armazenamento de Token JWT no `localStorage`.
  - Fluxo de recuperação de senha por e-mail em 2 etapas (solicitação de código de 6 dígitos e redefinição de senha).

### 2. 🛡️ Laboratório de Senha Segura (`SenhaSegura`)
- **Endpoints**: `POST /api/validate-password`
- **Funcionalidades**:
  - Validador interativo que testa 5 regras de complexidade em tempo real (mínimo 8 dígitos, maiúscula, minúscula, número e caractere especial).

### 3. 💳 Gestão de Transações & Pagamento de Faturas
- **Endpoints**: `POST /api/transactions`, `GET /api/transactions`
- **Funcionalidades**:
  - Visualização de saldo em conta e extrato com valores formatados.
  - Modal sobreposto para **Pagamento de Fatura** e transferências Pix/TED.
  - Criptografia em repouso garantida pelo backend: CPF cifrado via AES-256 e dados de cartão via RSA-2048.

### 4. 📊 Simulador de Crédito & Empréstimos
- **Endpoints**: `GET /api/loans/me`, `POST /customer-loans`
- **Funcionalidades**:
  - Simulação de taxas e elegibilidade de crédito (Crédito Pessoal, Com Garantia, Consignado).
  - Cálculo instantâneo do valor da parcela baseado no prazo e juros.

### 5. 📍 Radar & Agências Recomendadas
- **Endpoints**: `GET /pois`
- **Funcionalidades**:
  - Radar interativo renderizado em HTML5 Canvas com cálculo automático de proximidade euclidiana a partir do endereço cadastrado do cliente.
  - Lista de recomendações inteligentes ordenadas por distância estimada e tempo de trajeto.

### 6. ✂️ Encurtador de URLs ("Indique e Ganhe")
- **Endpoints**: `POST /shorten-url`, `GET /{shortCode}`
- **Funcionalidades**:
  - Geração de links curtos rastreáveis para compartilhamento de comprovantes e campanhas de indicação.

### 7. 📡 Console & Live API Inspector
- **Funcionalidades**:
  - Painel de observabilidade em tempo real para desenvolvedores, exibindo requisições HTTP, headers, tempo de resposta (ms) e payloads.

---

## 🏃 Como Executar

A aplicação é 100% estática e não exige build complexo.

### Opção 1: Node.js (Recomendado)
```bash
# Na pasta consumerLãoBank
npx serve . -l 3000
```
Acesse em: **`http://localhost:3000`**

### Opção 2: Python HTTP Server
```bash
python -m http.server 3000
```

### Opção 3: Visual Studio Code / Live Server
Clique com o botão direito em `index.html` e selecione **Open with Live Server**.

---

## 👨‍💻 Autor
Desenvolvido por **Carlos Bearzotti**  
GitHub: [@carlosbearzotti](https://github.com/carlosbearzotti)
