// ========================================
// NETLIFY FUNCTION: Criar Pagamento PIX
// ========================================

const { criarPagamentoPIX } = require('./vizzionpay');
const admin = require('firebase-admin');

// Inicialização do Firebase Admin usando variáveis de ambiente da Netlify
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // O .replace garante que as quebras de linha da chave privada sejam lidas corretamente
        privateKey: privateKey.replace(/\\n/g, '\n')
      })
    });
  }
}

const db = admin.apps.length ? admin.firestore() : null;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Lidando com preflight do CORS
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  try {
    if (!db) throw new Error("Conexão com Banco de Dados falhou. Verifique as variáveis do Firebase.");

    const body = JSON.parse(event.body);
    const { amount, userId, userName, userEmail, userDocument } = body;

    // Validação básica
    if (!amount || !userId || !userName) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Campos obrigatórios: amount, userId, userName' }) };
    }

    if (parseFloat(amount) < 30) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Depósito mínimo é R$ 30,00' }) };
    }

    // Chamada para a VizzionPay
    const payment = await criarPagamentoPIX({
      amount,
      userId,
      userName,
      userEmail,
      userDocument
    });

    // Salvar intenção de depósito no Firestore
    const depositRef = db.collection('deposits').doc();
    
    await depositRef.set({
      userId,
      userName,
      amount: parseFloat(amount),
      pixCode: payment.pixCode,
      qrImage: payment.qrImage || '',
      transactionId: payment.transactionId,
      status: 'pending',
      gateway: 'vizzionpay',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Retorno de sucesso para o frontend
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        pixCode: payment.pixCode,
        qrImage: payment.qrImage,
        transactionId: payment.transactionId,
        depositId: depositRef.id,
        message: 'PIX gerado com sucesso'
      })
    };

  } catch (error) {
    console.error("Erro no create-payment:", error);
    return {
      statusCode: error.status || 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Falha ao processar pagamento',
        details: error.details || {}
      })
    };
  }
};
