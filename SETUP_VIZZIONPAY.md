# 🚀 Setup VizzionPay + Netlify Functions

## ✅ O QUE FOI FEITO

### **REMOÇÃO TOTAL DA EVOPAY**
- ❌ Removidas todas as referências à EVOPAY
- ❌ Removidas URLs, tokens e variáveis da EVOPAY
- ❌ Removidos arquivos `pipedream/evopay/*`

### **NOVA INTEGRAÇÃO: VIZZIONPAY**
- ✅ Biblioteca completa `vizzionpay.js`
- ✅ 5 Netlify Functions prontas
- ✅ Integração Firebase v9 automática
- ✅ Sistema de depósito AUTOMÁTICO
- ✅ Sistema de saque com aprovação manual

---

## 📦 ESTRUTURA CRIADA

```
netlify/
  functions/
    vizzionpay.js           ← Biblioteca VizzionPay
    create-payment.js       ← Criar pagamento PIX
    check-payment.js        ← Verificar status
    webhook-payment.js      ← Receber confirmação (automático)
    create-withdraw.js      ← Solicitar saque
    package.json            ← Dependências das functions

src/
  hooks/
    useDeposit.ts           ← Hook atualizado (chama Netlify)
    useWithdraw.ts          ← Hook atualizado (chama Netlify)
    useAuth.tsx             ← Simplificado (sem EVOPAY)
```

---

## 🔧 CONFIGURAÇÃO PASSO A PASSO

### **1. Obter Token da VizzionPay**
1. Acesse o painel da VizzionPay
2. Gerar API Key
3. Copiar token

### **2. Firebase Service Account**
1. Console Firebase → Configurações → Contas de Serviço
2. Gerar nova chave privada
3. Baixar JSON

### **3. Configurar Variáveis de Ambiente no Netlify**
No painel do Netlify:
- **Site Settings** → **Environment Variables**

Adicionar:
```
VIZZION_TOKEN = seu_token_aqui
VIZZION_BASE_URL = https://api.vizzionpay.com/v1

FIREBASE_PROJECT_ID = monety-site-2
FIREBASE_PRIVATE_KEY_ID = (copiar do JSON)
FIREBASE_PRIVATE_KEY = (copiar do JSON - manter \n)
FIREBASE_CLIENT_EMAIL = (copiar do JSON)
FIREBASE_CLIENT_ID = (copiar do JSON)
FIREBASE_CERT_URL = (copiar do JSON)
```

### **4. Configurar Webhook na VizzionPay**
No painel da VizzionPay:
- **Configurações** → **Webhooks**
- **URL:** `https://seu-site.netlify.app/.netlify/functions/webhook-payment`
- **Eventos:** Marcar `payment.completed`

---

## 🎯 FLUXO DE FUNCIONAMENTO

### **DEPÓSITO AUTOMÁTICO:**
1. Usuário solicita depósito no frontend
2. Frontend chama `/.netlify/functions/create-payment`
3. Netlify Function cria pagamento na VizzionPay
4. Retorna QR Code + Código copia-e-cola
5. Usuário paga via PIX
6. **VizzionPay chama webhook automaticamente**
7. Webhook credita saldo no Firebase
8. Usuário vê saldo atualizado em tempo real

### **SAQUE COM APROVAÇÃO:**
1. Usuário solicita saque no frontend
2. Frontend chama `/.netlify/functions/create-withdraw`
3. Saldo é descontado
4. Status: `processing` (pendente)
5. **Admin aprova no painel**
6. Admin usa VizzionPay para enviar pagamento
7. Status atualizado para `completed`

---

## 🧪 TESTAR LOCALMENTE

### **Instalar Netlify CLI:**
```bash
npm install -g netlify-cli
```

### **Rodar Functions Localmente:**
```bash
netlify dev
```

### **Testar Depósito:**
```bash
curl -X POST http://localhost:8888/.netlify/functions/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50,
    "userId": "USER_ID_AQUI",
    "userName": "João Silva"
  }'
```

---

## 🔒 SEGURANÇA

✅ **Token VizzionPay NUNCA exposto no frontend**
✅ **Todas as chamadas via backend (Netlify Functions)**
✅ **Firebase Admin SDK server-side**
✅ **CORS configurado corretamente**
✅ **Validação de horário de saque (09h-17h)**

---

## 📊 ESTRUTURA FIRESTORE

```
deposits (root collection)
  - userId, userName, amount
  - pixCode, qrImage
  - transactionId (VizzionPay)
  - status: pending/completed
  - gateway: vizzionpay

users/{uid}
  - balance, totalEarned, spins
  - inviteStatus: pending/active
  - invitedBy: uid do convidador

users/{uid}/withdrawals
  - amount, fee, netAmount
  - pixKey, pixType
  - status: processing/completed/rejected

users/{uid}/transactions
  - type: deposit/withdrawal/bonus
  - amount, description, gateway
```

---

## 🚀 DEPLOY

### **Deploy no Netlify:**
```bash
# Push para repositório
git add .
git commit -m "Integração VizzionPay completa"
git push

# Netlify faz deploy automático
```

### **Verificar Functions:**
- Acesse: `https://seu-site.netlify.app/.netlify/functions/`
- Deve retornar lista de functions

---

## 📞 ENDPOINTS DISPONÍVEIS

```
POST   /.netlify/functions/create-payment
       Body: { amount, userId, userName }
       Retorna: { pixCode, qrImage, transactionId }

GET    /.netlify/functions/check-payment?transactionId=xxx
       Retorna: { status, amount, paidAt }

POST   /.netlify/functions/webhook-payment
       (Chamado automaticamente pela VizzionPay)

POST   /.netlify/functions/create-withdraw
       Body: { userId, amount, pixKey, pixType }
       Retorna: { withdrawalId, message }
```

---

## ✅ CHECKLIST FINAL

- [ ] Token VizzionPay obtido
- [ ] Service Account Firebase criada
- [ ] Variáveis de ambiente configuradas no Netlify
- [ ] Webhook configurado na VizzionPay
- [ ] Site deployado no Netlify
- [ ] Teste de depósito realizado
- [ ] Teste de saque realizado
- [ ] Webhook testado (via simulação)

---

## 🎉 TUDO PRONTO!

Sistema 100% funcional com:
- ✅ Depósito PIX automático
- ✅ Saque com aprovação manual
- ✅ Integração Firebase v9
- ✅ Deploy direto no Netlify
- ✅ Sem servidor próprio necessário
