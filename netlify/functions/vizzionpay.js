// ========================================
// BIBLIOTECA VIZZIONPAY - API CLIENT
// ========================================
const axios = require('axios');

const VIZZION_BASE_URL = process.env.VIZZION_BASE_URL || 'https://app.vizzionpay.com/api/v1';
const SITE_URL = process.env.URL;

const apiClient = axios.create({
  baseURL: VIZZION_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

function validarCredenciais() {
  const token = process.env.VIZZION_SECRET_KEY;
  if (!token) {
    throw new Error('A variável VIZZION_SECRET_KEY não está definida na Netlify.');
  }
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

async function criarPagamentoPIX(data) {
  validarCredenciais();
  const { amount, userId, userName, userEmail, userDocument } = data;
  const callbackUrl = `${SITE_URL}/.netlify/functions/webhook-payment`;

  const payload = {
    identifier: `${userId}-${Date.now()}`,
    amount: parseFloat(amount),
    client: {
      name: userName,
      // Limpa caracteres especiais do documento e usa um fallback válido se vazio
      document: (userDocument || '62846175084').replace(/\D/g, ''),
      email: userEmail && userEmail.includes('@') ? userEmail : 'contato@seudominio.com'
    },
    callbackUrl: callbackUrl
  };

  try {
    const response = await apiClient.post('/gateway/pix/receive', payload);
    const { data: paymentData } = response;
    
    return {
      success: true,
      pixCode: paymentData.pixCode || paymentData.emv,
      qrImage: paymentData.qrImage || paymentData.qrcodeImage,
      transactionId: paymentData.id || paymentData.transactionId
    };
  } catch (error) {
    console.error('--- ERRO DETALHADO VIZZION PAY ---');
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
      throw {
        status: error.response.status,
        message: error.response.data?.message || 'Erro na API VizzionPay',
        details: error.response.data
      };
    }
    throw new Error(`Erro interno: ${error.message}`);
  }
}

async function verificarStatusPagamento(transactionId) {
  validarCredenciais();
  try {
    const response = await apiClient.get(`/gateway/transactions?id=${transactionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || new Error('Falha ao verificar status');
  }
}

async function criarSaquePIX(data) {
  validarCredenciais();
  const { amount, pixKey, pixType, withdrawId, ownerName, ownerDocument } = data;
  const callbackUrl = `${SITE_URL}/.netlify/functions/webhook-transfer`;

  const payload = {
    identifier: String(withdrawId),
    amount: parseFloat(amount),
    discountFeeOfReceiver: false,
    pix: { key: pixKey, type: pixType },
    owner: {
      name: ownerName || 'Nome Não Informado',
      document: (ownerDocument || '62846175084').replace(/\D/g, '')
    },
    callbackUrl: callbackUrl
  };

  try {
    const response = await apiClient.post('/gateway/transfers', payload);
    return {
      success: true,
      transactionId: response.data.id || response.data.transactionId,
      status: response.data.status
    };
  } catch (error) {
    console.error('--- ERRO SAQUE VIZZION ---', error.response?.data);
    throw error.response?.data || new Error('Falha no saque');
  }
}

module.exports = {
  criarPagamentoPIX,
  verificarStatusPagamento,
  criarSaquePIX
};
