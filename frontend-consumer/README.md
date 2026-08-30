# 🚀 Integrados - Frontend Consumer (Fintech Suite)

Aplicação Frontend **Single Page Application (SPA)** desacoplada e independente, desenvolvida em Vanilla HTML5, CSS3 Moderno (Glassmorphism Dark Mode) e JavaScript ES6+.

Consome diretamente a API REST do Spring Boot em `http://localhost:8080` cobrindo todos os módulos do ecossistema:

1. **🔐 Autenticação & JWT**: Registro de usuário, Login e carregamento de Perfil (`/api/auth/*`).
2. **🛡️ SenhaSegura Lab**: Validador interativo em tempo real com regras de complexidade (`/api/validate-password`).
3. **💳 Empréstimos Inteligentes**: Simulador de elegibilidade de crédito (Pessoal, Garantia, Consignado) (`/customer-loans` & `/api/loans/me`).
4. **🔒 Cofre Criptográfico**: Criação e listagem de transações com criptografia AES (CPF) e RSA (Cartão) (`/api/transactions`).
5. **📍 Radar GPS (POIs)**: Mapa interativo em HTML5 Canvas com cadastro e busca por raio de proximidade (`/pois`, `/pois/proximidade`).
6. **🔗 Encurtador de URLs**: Geração de short links com contador de cliques e redirecionamento (`/shorten-url`, `/{shortCode}`).
7. **⚡ API Inspector / Console**: Histórico ao vivo de requisições HTTP, headers, tempo de resposta em milissegundos e payloads formatados.

---

## 🏃 Como Executar

Não necessita de etapa pesada de build. Você pode abrir diretamente no navegador ou rodar com um servidor estático:

### Opção 1: Abrir diretamente
Basta dar duplo clique no arquivo `index.html` em qualquer navegador moderno.

### Opção 2: Servidor Node / NPM
```bash
cd frontend-consumer
npm run dev
# Acesse em http://localhost:3000
```

### Opção 3: Python
```bash
cd frontend-consumer
python -m http.server 3000
```
