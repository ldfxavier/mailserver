const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Simulação de banco de dados em memória para API Keys
// Em produção, use um banco de dados real
const apiKeys = new Map();
const users = new Map();

// Usuário admin padrão
const initializeDefaultUser = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (adminEmail && adminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    users.set(adminEmail, {
      id: uuidv4(),
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    console.log(`✅ Usuário admin criado: ${adminEmail}`);
  }
};

// Gerar API Key
const generateApiKey = (userId, description = '') => {
  const keyId = uuidv4();
  const keySecret = crypto.randomBytes(32).toString('hex');
  const apiKey = `sk_${keyId.replace(/-/g, '')}_${keySecret}`;
  
  // Criptografar a API key para armazenamento
  const cipher = crypto.createCipher('aes-256-cbc', process.env.API_KEY_SECRET);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const keyData = {
    id: keyId,
    userId: userId,
    keyHash: encrypted,
    description: description,
    isActive: true,
    createdAt: new Date().toISOString(),
    lastUsed: null,
    usageCount: 0
  };
  
  apiKeys.set(keyId, keyData);
  
  return {
    id: keyId,
    key: apiKey,
    description: description,
    createdAt: keyData.createdAt
  };
};

// Validar API Key
const validateApiKey = (apiKey) => {
  try {
    // Descriptografar todas as chaves para comparar
    for (const [keyId, keyData] of apiKeys.entries()) {
      if (!keyData.isActive) continue;
      
      const decipher = crypto.createDecipher('aes-256-cbc', process.env.API_KEY_SECRET);
      let decrypted = decipher.update(keyData.keyHash, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      if (decrypted === apiKey) {
        // Atualizar estatísticas de uso
        keyData.lastUsed = new Date().toISOString();
        keyData.usageCount++;
        
        return {
          valid: true,
          keyId: keyId,
          userId: keyData.userId,
          keyData: keyData
        };
      }
    }
    
    return { valid: false };
  } catch (error) {
    console.error('Erro ao validar API key:', error);
    return { valid: false };
  }
};

// Autenticar usuário
const authenticateUser = async (email, password) => {
  const user = users.get(email);
  if (!user) {
    return { success: false, message: 'Usuário não encontrado' };
  }
  
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return { success: false, message: 'Senha incorreta' };
  }
  
  const token = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return {
    success: true,
    token: token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role
    }
  };
};

// Verificar JWT Token
const verifyJwtToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, data: decoded };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Middleware de autenticação para Fastify
const authMiddleware = async (request, reply) => {
  const authHeader = request.headers.authorization;
  const apiKeyHeader = request.headers['x-api-key'];
  
  // Verificar API Key primeiro
  if (apiKeyHeader) {
    const validation = validateApiKey(apiKeyHeader);
    if (validation.valid) {
      request.auth = {
        type: 'api_key',
        keyId: validation.keyId,
        userId: validation.userId,
        keyData: validation.keyData
      };
      return;
    }
  }
  
  // Verificar JWT Token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const verification = verifyJwtToken(token);
    
    if (verification.valid) {
      request.auth = {
        type: 'jwt',
        user: verification.data
      };
      return;
    }
  }
  
  // Nenhuma autenticação válida encontrada
  reply.code(401).send({
    success: false,
    message: 'Acesso negado. Token JWT ou API Key necessário.',
    error: 'UNAUTHORIZED',
    howToAuthenticate: {
      jwt: 'Inclua o header: Authorization: Bearer <token>',
      apiKey: 'Inclua o header: X-API-Key: <sua-api-key>'
    }
  });
};

// Listar API Keys do usuário
const getUserApiKeys = (userId) => {
  const userKeys = [];
  for (const [keyId, keyData] of apiKeys.entries()) {
    if (keyData.userId === userId) {
      userKeys.push({
        id: keyId,
        description: keyData.description,
        isActive: keyData.isActive,
        createdAt: keyData.createdAt,
        lastUsed: keyData.lastUsed,
        usageCount: keyData.usageCount
      });
    }
  }
  return userKeys;
};

// Desativar API Key
const deactivateApiKey = (keyId, userId) => {
  const keyData = apiKeys.get(keyId);
  if (keyData && keyData.userId === userId) {
    keyData.isActive = false;
    return { success: true, message: 'API Key desativada com sucesso' };
  }
  return { success: false, message: 'API Key não encontrada ou não autorizada' };
};

module.exports = {
  initializeDefaultUser,
  generateApiKey,
  validateApiKey,
  authenticateUser,
  verifyJwtToken,
  authMiddleware,
  getUserApiKeys,
  deactivateApiKey,
  users,
  apiKeys
};
