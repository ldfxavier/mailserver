require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const nodemailer = require('nodemailer');
const auth = require('./auth');

// Registrar plugin CORS
fastify.register(require('@fastify/cors'), {
  origin: true
});

// Configuração do transporter do Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true, // true para porta 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Inicializar sistema de autenticação
auth.initializeDefaultUser();

// Verificar conexão SMTP no início
transporter.verify((error, success) => {
  if (error) {
    console.log('Erro na configuração SMTP:', error);
  } else {
    console.log('Servidor SMTP pronto para enviar emails');
  }
});

// Esquema de validação para envio de email
const sendEmailSchema = {
  body: {
    type: 'object',
    required: ['to', 'subject', 'text'],
    properties: {
      to: { 
        type: 'string',
        format: 'email',
        description: 'Email do destinatário'
      },
      subject: { 
        type: 'string',
        minLength: 1,
        description: 'Assunto do email'
      },
      text: { 
        type: 'string',
        minLength: 1,
        description: 'Conteúdo em texto do email'
      },
      html: { 
        type: 'string',
        description: 'Conteúdo em HTML do email (opcional)'
      },
      from: {
        type: 'string',
        format: 'email',
        description: 'Email do remetente (opcional, usa o padrão se não informado)'
      }
    }
  }
};

// ====================== ROTAS DE AUTENTICAÇÃO ======================

// Rota para login e obter JWT token
fastify.post('/auth/login', async (request, reply) => {
  try {
    const { email, password } = request.body;
    
    if (!email || !password) {
      reply.code(400);
      return {
        success: false,
        message: 'Email e senha são obrigatórios'
      };
    }
    
    const result = await auth.authenticateUser(email, password);
    
    if (result.success) {
      return {
        success: true,
        message: 'Login realizado com sucesso',
        token: result.token,
        user: result.user
      };
    } else {
      reply.code(401);
      return {
        success: false,
        message: result.message
      };
    }
  } catch (error) {
    reply.code(500);
    return {
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    };
  }
});

// Rota para gerar nova API Key (requer autenticação JWT)
fastify.post('/auth/generate-api-key', { preHandler: auth.authMiddleware }, async (request, reply) => {
  try {
    const { description } = request.body;
    const userId = request.auth.user?.userId || request.auth.userId;
    
    const newApiKey = auth.generateApiKey(userId, description || 'Gerada via API');
    
    return {
      success: true,
      message: 'API Key gerada com sucesso',
      apiKey: newApiKey,
      warning: 'Guarde esta API Key em local seguro. Ela não será exibida novamente.'
    };
  } catch (error) {
    reply.code(500);
    return {
      success: false,
      message: 'Erro ao gerar API Key',
      error: error.message
    };
  }
});

// Rota para listar API Keys do usuário
fastify.get('/auth/api-keys', { preHandler: auth.authMiddleware }, async (request, reply) => {
  try {
    const userId = request.auth.user?.userId || request.auth.userId;
    const apiKeys = auth.getUserApiKeys(userId);
    
    return {
      success: true,
      apiKeys: apiKeys,
      total: apiKeys.length
    };
  } catch (error) {
    reply.code(500);
    return {
      success: false,
      message: 'Erro ao listar API Keys',
      error: error.message
    };
  }
});

// Rota para desativar API Key
fastify.delete('/auth/api-keys/:keyId', { preHandler: auth.authMiddleware }, async (request, reply) => {
  try {
    const { keyId } = request.params;
    const userId = request.auth.user?.userId || request.auth.userId;
    
    const result = auth.deactivateApiKey(keyId, userId);
    
    if (result.success) {
      return result;
    } else {
      reply.code(404);
      return result;
    }
  } catch (error) {
    reply.code(500);
    return {
      success: false,
      message: 'Erro ao desativar API Key',
      error: error.message
    };
  }
});

// ====================== ROTAS PÚBLICAS ======================

// Rota para verificar se a API está funcionando
fastify.get('/', async (request, reply) => {
  return { 
    message: 'API de Email com Autenticação - Serviço funcionando!',
    version: '2.0.0',
    authentication: {
      required: 'JWT Token ou API Key necessário para envio de emails',
      endpoints: {
        'POST /auth/login': 'Fazer login e obter JWT token',
        'POST /auth/generate-api-key': 'Gerar nova API Key (requer JWT)',
        'GET /auth/api-keys': 'Listar suas API Keys (requer JWT)',
        'DELETE /auth/api-keys/:id': 'Desativar API Key (requer JWT)'
      }
    },
    emailEndpoints: {
      'POST /send-email': 'Enviar email (requer autenticação)',
      'POST /send-bulk-email': 'Enviar emails em lote (requer autenticação)',
      'GET /health': 'Verificar saúde da API'
    }
  };
});

// Rota para verificar a saúde da API
fastify.get('/health', async (request, reply) => {
  try {
    // Testa a conexão SMTP
    await transporter.verify();
    return { 
      status: 'healthy',
      smtp: 'connected',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    reply.code(503);
    return { 
      status: 'unhealthy',
      smtp: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
});

// ====================== ROTAS PROTEGIDAS (REQUEREM AUTENTICAÇÃO) ======================

// Rota para enviar email
fastify.post('/send-email', { 
  schema: sendEmailSchema, 
  preHandler: auth.authMiddleware 
}, async (request, reply) => {
  try {
    const { to, subject, text, html, from } = request.body;
    
    const mailOptions = {
      from: from || process.env.SMTP_USER,
      to: to,
      subject: subject,
      text: text
    };

    // Adicionar HTML se fornecido
    if (html) {
      mailOptions.html = html;
    }

    // Enviar email
    const info = await transporter.sendMail(mailOptions);
    
    fastify.log.info(`Email enviado: ${info.messageId} - Auth: ${request.auth.type}`);
    
    return {
      success: true,
      message: 'Email enviado com sucesso!',
      messageId: info.messageId,
      to: to,
      subject: subject,
      authenticatedBy: request.auth.type,
      sentAt: new Date().toISOString()
    };
    
  } catch (error) {
    fastify.log.error(`Erro ao enviar email: ${error.message}`);
    
    reply.code(500);
    return {
      success: false,
      message: 'Erro ao enviar email',
      error: error.message
    };
  }
});

// Rota para enviar email em lote
fastify.post('/send-bulk-email', { preHandler: auth.authMiddleware }, async (request, reply) => {
  try {
    const { recipients, subject, text, html, from } = request.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      reply.code(400);
      return {
        success: false,
        message: 'Lista de destinatários é obrigatória e deve ser um array não vazio'
      };
    }

    if (!subject || !text) {
      reply.code(400);
      return {
        success: false,
        message: 'Assunto e texto são obrigatórios'
      };
    }

    const results = [];
    
    for (const recipient of recipients) {
      try {
        const mailOptions = {
          from: from || process.env.SMTP_USER,
          to: recipient,
          subject: subject,
          text: text
        };

        if (html) {
          mailOptions.html = html;
        }

        const info = await transporter.sendMail(mailOptions);
        
        results.push({
          recipient: recipient,
          success: true,
          messageId: info.messageId
        });
        
      } catch (error) {
        results.push({
          recipient: recipient,
          success: false,
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    return {
      success: true,
      message: `Emails processados: ${successCount} enviados, ${failureCount} falharam`,
      totalRecipients: recipients.length,
      successCount: successCount,
      failureCount: failureCount,
      authenticatedBy: request.auth.type,
      processedAt: new Date().toISOString(),
      results: results
    };
    
  } catch (error) {
    fastify.log.error(`Erro ao enviar emails em lote: ${error.message}`);
    
    reply.code(500);
    return {
      success: false,
      message: 'Erro ao enviar emails em lote',
      error: error.message
    };
  }
});

// Configurar servidor
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Servidor rodando na porta ${port}`);
    console.log(`📧 API de Email pronta para uso!`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
