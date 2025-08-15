# 🔐 Guia de Autenticação da API de Email

## Visão Geral

A API agora requer autenticação para envio de emails. Existem duas formas de autenticar:

1. **JWT Token** - Para uso temporário e interativo
2. **API Key** - Para uso em aplicações e automações

## 🚀 Começando

### 1. Credenciais Padrão

**Email:** `admin@expertabi.com`  
**Senha:** `Admin@123456`

> ⚠️ **IMPORTANTE**: Altere essas credenciais em produção!

### 2. Fazer Login e Obter JWT Token

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@expertabi.com",
    "password": "Admin@123456"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-do-usuario",
    "email": "admin@expertabi.com",
    "role": "admin"
  }
}
```

### 3. Gerar API Key

Use o JWT token para gerar uma API Key:

```bash
curl -X POST http://localhost:3001/auth/generate-api-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN_AQUI" \
  -d '{
    "description": "API Key para aplicação de produção"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "message": "API Key gerada com sucesso",
  "apiKey": {
    "id": "uuid-da-chave",
    "key": "sk_1234567890abcdef_0987654321fedcba",
    "description": "API Key para aplicação de produção",
    "createdAt": "2023-12-01T10:00:00.000Z"
  },
  "warning": "Guarde esta API Key em local seguro. Ela não será exibida novamente."
}
```

## 📧 Enviando Emails

### Opção 1: Usando JWT Token

```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN_AQUI" \
  -d '{
    "to": "destinatario@exemplo.com",
    "subject": "Email Autenticado",
    "text": "Este email foi enviado com autenticação JWT!",
    "html": "<h1>Email Autenticado</h1><p>Enviado com JWT!</p>"
  }'
```

### Opção 2: Usando API Key

```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_1234567890abcdef_0987654321fedcba" \
  -d '{
    "to": "destinatario@exemplo.com",
    "subject": "Email Autenticado",
    "text": "Este email foi enviado com API Key!",
    "html": "<h1>Email Autenticado</h1><p>Enviado com API Key!</p>"
  }'
```

## 🔑 Gerenciamento de API Keys

### Listar suas API Keys

```bash
curl -X GET http://localhost:3001/auth/api-keys \
  -H "Authorization: Bearer SEU_JWT_TOKEN_AQUI"
```

### Desativar uma API Key

```bash
curl -X DELETE http://localhost:3001/auth/api-keys/uuid-da-chave \
  -H "Authorization: Bearer SEU_JWT_TOKEN_AQUI"
```

## 🛡️ Segurança

### JWT Tokens
- **Validade:** 24 horas
- **Uso:** Autenticação temporária, gerenciamento de API Keys
- **Header:** `Authorization: Bearer <token>`

### API Keys
- **Validade:** Permanente (até ser desativada)
- **Uso:** Aplicações, automações, uso prolongado
- **Header:** `X-API-Key: <api-key>`
- **Formato:** `sk_<uuid>_<secret>`

### Melhores Práticas

1. **Nunca expor credenciais em código**
   ```bash
   # ✅ Correto - usar variáveis de ambiente
   export API_KEY="sk_1234567890abcdef_0987654321fedcba"
   curl -H "X-API-Key: $API_KEY" ...
   
   # ❌ Errado - hardcoded no código
   const apiKey = "sk_1234567890abcdef_0987654321fedcba";
   ```

2. **Rotar API Keys regularmente**
3. **Usar descrições claras para API Keys**
4. **Desativar API Keys não utilizadas**
5. **Monitorar logs de acesso**

## 🧪 Testando Autenticação

### 1. Teste sem autenticação (deve falhar)
```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Teste","text":"Teste"}'
```

**Resposta esperada:**
```json
{
  "success": false,
  "message": "Acesso negado. Token JWT ou API Key necessário.",
  "error": "UNAUTHORIZED"
}
```

### 2. Teste com JWT inválido (deve falhar)
```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token-invalido" \
  -d '{"to":"test@example.com","subject":"Teste","text":"Teste"}'
```

### 3. Teste com API Key inválida (deve falhar)
```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: chave-invalida" \
  -d '{"to":"test@example.com","subject":"Teste","text":"Teste"}'
```

## 📝 Exemplos Completos

### Fluxo Completo com JavaScript

```javascript
// 1. Fazer login
const loginResponse = await fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@expertabi.com',
    password: 'Admin@123456'
  })
});

const { token } = await loginResponse.json();

// 2. Gerar API Key
const apiKeyResponse = await fetch('http://localhost:3001/auth/generate-api-key', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    description: 'API Key para minha aplicação'
  })
});

const { apiKey } = await apiKeyResponse.json();

// 3. Enviar email usando API Key
const emailResponse = await fetch('http://localhost:3001/send-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey.key
  },
  body: JSON.stringify({
    to: 'usuario@exemplo.com',
    subject: 'Email da API',
    text: 'Este é um email enviado através da API!',
    html: '<h1>Email da API</h1><p>Enviado com sucesso!</p>'
  })
});

const result = await emailResponse.json();
console.log('Email enviado:', result);
```

### Fluxo com Python

```python
import requests

# 1. Fazer login
login_data = {
    "email": "admin@expertabi.com",
    "password": "Admin@123456"
}

login_response = requests.post(
    'http://localhost:3001/auth/login',
    json=login_data
)

token = login_response.json()['token']

# 2. Gerar API Key
api_key_response = requests.post(
    'http://localhost:3001/auth/generate-api-key',
    headers={'Authorization': f'Bearer {token}'},
    json={'description': 'API Key para Python'}
)

api_key = api_key_response.json()['apiKey']['key']

# 3. Enviar email
email_data = {
    "to": "usuario@exemplo.com",
    "subject": "Email via Python",
    "text": "Email enviado usando Python!",
    "html": "<h1>Python Email</h1><p>Enviado com sucesso!</p>"
}

email_response = requests.post(
    'http://localhost:3001/send-email',
    headers={'X-API-Key': api_key},
    json=email_data
)

print('Email enviado:', email_response.json())
```

## ⚙️ Configuração de Ambiente

Adicione ao seu `.env`:

```env
# Configurações de Autenticação
JWT_SECRET="sua_chave_secreta_super_forte_aqui_2024"
API_KEY_SECRET="chave_para_criptografar_api_keys_2024"
ADMIN_EMAIL="admin@expertabi.com"
ADMIN_PASSWORD="Admin@123456"
```

> **Importante:** Use senhas e chaves secretas fortes em produção!

## 🔍 Logs e Monitoramento

A API registra todas as tentativas de autenticação e envios de email:

- ✅ Autenticações bem-sucedidas
- ❌ Tentativas de acesso negadas
- 📧 Emails enviados com informações de autenticação
- 🔄 Uso de API Keys (contadores de uso)

Verifique os logs do servidor para monitorar a atividade!
