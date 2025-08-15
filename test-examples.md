# 🧪 Exemplos de Teste da API com Autenticação

## ⚠️ ATENÇÃO: Autenticação Obrigatória

A partir da versão 2.0, **TODOS os endpoints de envio de email requerem autenticação**. Você precisa de um JWT Token ou API Key.

## Testando a API

A API está rodando na porta **3001**. Aqui estão alguns exemplos de como testá-la:

### 1. Verificar se a API está funcionando
```bash
curl http://localhost:3001
```

### 2. Verificar saúde da conexão SMTP
```bash
curl http://localhost:3001/health
```

### 3. Obter JWT Token (Login)
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@expertabi.com",
    "password": "Admin@123456"
  }'
```

### 4. Gerar API Key
```bash
# Use o token do passo anterior
curl -X POST http://localhost:3001/auth/generate-api-key \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN_AQUI" \
  -d '{
    "description": "API Key para testes"
  }'
```

### 5. Enviar email com API Key
```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -H "X-API-Key: SUA_API_KEY_AQUI" \
  -d '{
    "to": "seu-email@gmail.com",
    "subject": "Teste da API de Email",
    "text": "Este é um email de teste enviado pela API!"
  }'
```

### 6. Enviar email com JWT Token
```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_JWT_TOKEN_AQUI" \
  -d '{
    "to": "seu-email@gmail.com",
    "subject": "Teste com JWT",
    "text": "Este email foi enviado usando JWT Token!"
  }'
```

### 4. Enviar email com HTML
```bash
curl -X POST http://localhost:3001/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "seu-email@gmail.com",
    "subject": "Email com HTML",
    "text": "Versão em texto",
    "html": "<h1>Olá!</h1><p>Este é um email com <strong>HTML</strong>!</p>"
  }'
```

### 5. Enviar emails em lote
```bash
curl -X POST http://localhost:3001/send-bulk-email \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      "email1@gmail.com",
      "email2@gmail.com",
      "email3@gmail.com"
    ],
    "subject": "Email em Lote",
    "text": "Este email foi enviado para múltiplos destinatários!",
    "html": "<h2>Email em Lote</h2><p>Enviado para múltiplos destinatários!</p>"
  }'
```

## Comandos úteis

### Iniciar o servidor
```bash
npm start          # Modo produção
npm run dev        # Modo desenvolvimento (com nodemon)
```

### Parar o servidor
```bash
# Se rodando em background
pkill -f "node server.js"

# Ou Ctrl+C se rodando no terminal
```

### Ver logs do servidor
Se quiser ver os logs em tempo real, execute em modo desenvolvimento:
```bash
npm run dev
```

## Configurações SMTP

A API está configurada para usar:
- **Servidor:** smtp.kinghost.net
- **Porta:** 465 (SSL)
- **Usuário:** nao-responda@expertabi.com
- **Senha:** [configurada no .env]

## Notas importantes

1. **Porta:** A API roda na porta 3001 (mudou de 3000 para evitar conflitos)
2. **Emails reais:** Para testar com emails reais, substitua os endereços de exemplo
3. **Logs:** O servidor mostra logs detalhados dos envios e erros
4. **Validação:** A API valida automaticamente os dados de entrada
