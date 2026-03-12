// ========================================
// NETLIFY FUNCTION: Criar Pagamento PIX
// ========================================
const { criarPagamentoPIX } = require('./vizzionpay');
const admin = require('firebase-admin');

// Inicialização segura do Firebase
if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, '\n')
        })
      });
    }
  } catch (e) {
    console.error("Erro ao inicializar Firebase Admin:", e.message);
  }
}

const db = admin.apps.length ? admin.firestore() : null;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-public-key, x-secret-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Resposta para Preflight do CORS
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  try {
    if (!db) throw new Error("Banco de dados Firebase indisponível.");

    const body = JSON.parse(event.body);
    const { amount, userId, userName, userEmail, userDocument, userPhone } = body;

    // Validação básica de entrada
    if (!amount || !userId || !userName) {
      return { 
        statusCode: 400, 
        headers, 
        body: JSON.stringify({ error: 'Campos obrigatórios: amount, userId, userName' }) 
      };
    }

    // Chama a integração com os novos headers
    const payment = await criarPagamentoPIX({
      amount,
      userId,
      userName,
      userEmail,
      userDocument,
      userPhone
    });

    // Salva no Firestore
    const depositRef = db.collection('deposits').doc();
    await depositRef.set({
      userId,
      userName,
      amount: parseFloat(amount),
      pixCode: payment.pixCode,
      transactionId: payment.transactionId,
      status: 'pending',
      gateway: 'vizzionpay',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        pixCode: payment.pixCode,
        qrImage: payment.qrImage,
        transactionId: payment.transactionId,
        depositId: depositRef.id
      })
    };

  } catch (error) {
    console.error("Erro na execução da Function:", error);
    
    return {
      statusCode: error.status || 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Erro interno no servidor',
        details: error.details || {}
      })
    };
  }
};
