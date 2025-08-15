# 📧 Mail Service API com Autenticação

API de email segura desenvolvida com Fastify e Nodemailer para envio de emails através de servidor SMTP. 

**🔐 REQUER AUTENTICAÇÃO:** Todos os endpoints de envio de email agora requerem autenticação via JWT Token ou API Key.

## 🚀 Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente no arquivo `.env`:
```env
# Configurações SMTP
SMTP_HOST="smtp.kinghost.net"
SMTP_PORT="465"
SMTP_USER="nao-responda@expertabi.com"
SMTP_PASS="Expertabi@1324"
PORT=3001

# Configurações de Autenticação
JWT_SECRET="sua_chave_secreta_super_forte_aqui_2024"
API_KEY_SECRET="chave_para_criptografar_api_keys_2024"
ADMIN_EMAIL="admin@expertabi.com"
ADMIN_PASSWORD="Admin@123456"
```

> ⚠️ **IMPORTANTE**: Altere as credenciais padrão em produção!

4. Inicie o servidor:
```bash
# Modo desenvolvimento
npm run dev

# Modo produção
npm start
```

## 🔐 Início Rápido com Autenticação

### 1. Fazer Login
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@expertabi.com",
    "password": "Admin@123456"
  }'
```

### 2. Gerar API Key (usando o token do login)
```bash
curl -X POST http://localhost:3001/auth/generate-api-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN_AQUI" \
  -d '{"description": "Minha primeira API Key"}'
```

### 3. Enviar Email (usando API Key)
```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: SUA_API_KEY_AQUI" \
  -d '{
    "to": "destinatario@example.com",
    "subject": "Email Autenticado",
    "text": "Este email foi enviado com autenticação!"
  }'
```

> 📖 **Guia Completo**: Veja `AUTH_GUIDE.md` para documentação detalhada de autenticação.

## 📋 Endpoints

### GET /
Retorna informações básicas da API.

**Resposta:**
```json
{
  "message": "API de Email - Serviço funcionando!",
  "version": "1.0.0",
  "endpoints": {
    "POST /send-email": "Enviar email",
    "GET /health": "Verificar saúde da API"
  }
}
```

### GET /health
Verifica a saúde da API e conexão SMTP.

**Resposta (Sucesso):**
```json
{
  "status": "healthy",
  "smtp": "connected",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

**Resposta (Erro):**
```json
{
  "status": "unhealthy",
  "smtp": "disconnected",
  "error": "Mensagem de erro",
  "timestamp": "2023-12-01T10:00:00.000Z"
}
```

### POST /send-email
Envia um email para um destinatário.

**Body (JSON):**
```json
{
  "to": "destinatario@exemplo.com",
  "subject": "Assunto do email",
  "text": "Conteúdo em texto do email",
  "html": "<h1>Conteúdo em HTML</h1> (opcional)",
  "from": "remetente@exemplo.com (opcional)"
}
```

**Resposta (Sucesso):**
```json
{
  "success": true,
  "message": "Email enviado com sucesso!",
  "messageId": "unique-message-id",
  "to": "destinatario@exemplo.com",
  "subject": "Assunto do email"
}
```

**Resposta (Erro):**
```json
{
  "success": false,
  "message": "Erro ao enviar email",
  "error": "Descrição do erro"
}
```

### POST /send-bulk-email
Envia emails para múltiplos destinatários.

**Body (JSON):**
```json
{
  "recipients": [
    "destinatario1@exemplo.com",
    "destinatario2@exemplo.com",
    "destinatario3@exemplo.com"
  ],
  "subject": "Assunto do email",
  "text": "Conteúdo em texto do email",
  "html": "<h1>Conteúdo em HTML</h1> (opcional)",
  "from": "remetente@exemplo.com (opcional)"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Emails processados: 2 enviados, 1 falharam",
  "totalRecipients": 3,
  "successCount": 2,
  "failureCount": 1,
  "results": [
    {
      "recipient": "destinatario1@exemplo.com",
      "success": true,
      "messageId": "unique-message-id-1"
    },
    {
      "recipient": "destinatario2@exemplo.com",
      "success": true,
      "messageId": "unique-message-id-2"
    },
    {
      "recipient": "destinatario3@exemplo.com",
      "success": false,
      "error": "Endereço de email inválido"
    }
  ]
}
```

## 📝 Exemplos de Uso

### Usando cURL

**Enviar email simples:**
```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "teste@exemplo.com",
    "subject": "Teste de Email",
    "text": "Este é um email de teste enviado pela API!"
  }'
```

**Enviar email com HTML:**
```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "teste@exemplo.com",
    "subject": "Email com HTML",
    "text": "Versão em texto",
    "html": "<h1>Olá!</h1><p>Este é um email com <strong>HTML</strong>!</p>"
  }'
```

**Verificar saúde da API:**
```bash
curl http://localhost:3001/health
```

### Usando JavaScript (fetch)

```javascript
// Enviar email
const response = await fetch('http://localhost:3001/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    to: 'teste@exemplo.com',
    subject: 'Email via JavaScript',
    text: 'Enviado usando fetch API!',
    html: '<p>Email enviado via <strong>JavaScript</strong>!</p>'
  })
});

const result = await response.json();
console.log(result);
```

## ⚙️ Configuração SMTP

A API está configurada para usar o servidor SMTP da KingHost com as seguintes configurações:

- **Host:** smtp.kinghost.net
- **Porta:** 465 (SSL)
- **Usuário:** nao-responda@expertabi.com
- **Senha:** Definida no arquivo .env

## 🔧 Desenvolvimento

Para desenvolvimento, use:
```bash
npm run dev
```

Isso iniciará o servidor com nodemon para recarregamento automático.

## 📦 Dependências

- **fastify**: Framework web rápido e eficiente
- **nodemailer**: Biblioteca para envio de emails
- **dotenv**: Carregamento de variáveis de ambiente
- **@fastify/cors**: Plugin CORS para Fastify

## 🛡️ Segurança

- As credenciais SMTP são carregadas através de variáveis de ambiente
- Validação de dados de entrada nos endpoints
- Logs detalhados para monitoramento
- Tratamento de erros apropriado

## 📊 Status Codes

- **200**: Sucesso
- **400**: Dados de entrada inválidos
- **500**: Erro interno do servidor
- **503**: Serviço indisponível (problemas SMTP)
