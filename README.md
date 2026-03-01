# Valorant Custom Manager (VCM)

Aplicação web **mobile-first** para gerenciar partidas customizadas de Valorant com atualização em tempo real.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React + Tailwind CSS + Lucide React |
| Backend | Node.js + Express + Socket.io |
| Banco | MongoDB + Mongoose |
| Auth | JWT em cookie HttpOnly |
| Real-time | Socket.io WebSockets |
| Docs | Swagger UI (`/api/docs`) |

---

## Como Executar

### 🐳 Docker (recomendado — sobe tudo de uma vez)

> Pré-requisito: [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e rodando.

```bash
git clone https://github.com/SEU_USUARIO/vcm.git
cd vcm
docker compose up --build
```

Aguarde os 3 serviços subirem:

| Serviço | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:3001 |
| Swagger UI | http://localhost:3001/api/docs |
| MongoDB | localhost:27017 |

```bash
# Parar tudo (mantém os dados)
docker compose down

# Parar e apagar os dados do MongoDB
docker compose down -v
```

---

### 💻 Local (sem Docker)

**Pré-requisitos:** Node.js 18+ e MongoDB rodando localmente (ou URI do Atlas)

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env    # edite conforme necessário
npm run dev             # http://localhost:3001

# 2. Frontend (outro terminal)
cd frontend
npm install
npm run dev             # http://localhost:5173
```

---

## Variáveis de Ambiente

Copie `backend/.env.example` para `backend/.env` e preencha:

| Variável | Descrição | Padrão |
|---|---|---|
| `PORT` | Porta do backend | `3001` |
| `MONGODB_URI` | URI de conexão MongoDB | `mongodb://localhost:27017/vcm` |
| `JWT_SECRET` | Segredo para assinatura dos JWTs | — |
| `JWT_EXPIRES_IN` | Validade do token | `7d` |
| `FRONTEND_URL` | Origem permitida (CORS) | `http://localhost` |
| `RESEND_API_KEY` | API key do Resend (e-mail de reset) | opcional em dev |
| `NODE_ENV` | Ambiente | `development` |

> Em desenvolvimento, se `RESEND_API_KEY` não estiver configurado, o link de reset de senha é impresso nos logs do backend.

---

## Funcionalidades

- **Autenticação** com JWT (cookie HttpOnly) — login por e-mail ou nickname
- **Lobbies** com até 10 jogadores titulares + 10 em lista de espera (FIFO)
- **Promoção automática** da fila ao remover jogador
- **ADM da sala** pode: confirmar presença, remover jogadores, alterar configurações, cancelar partida, entrar/sair como jogador
- **Compartilhamento** via URL direta da sala
- **Tempo real** via WebSocket — atualização sem refresh
- **Cancelamento** de partidas (visível na timeline, sem bloquear horário)
- **Documentação da API** em `/api/docs` (Swagger UI)

---

## Endpoints REST

A documentação completa e interativa está em `http://localhost:3001/api/docs`.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/register` | — | Criar conta |
| `POST` | `/api/auth/login` | — | Entrar (nick ou e-mail) |
| `POST` | `/api/auth/logout` | ✓ | Encerrar sessão |
| `GET` | `/api/auth/me` | ✓ | Usuário logado |
| `POST` | `/api/auth/forgot-password` | — | Solicitar reset de senha |
| `POST` | `/api/auth/reset-password` | — | Redefinir senha |
| `GET` | `/api/lobbies` | — | Listar partidas |
| `POST` | `/api/lobbies` | ✓ | Criar partida |
| `GET` | `/api/lobbies/:id` | — | Detalhes da partida |
| `POST` | `/api/lobbies/:id/join` | ✓ | Entrar na partida |
| `POST` | `/api/lobbies/:id/checkin` | ✓ ADM | Confirmar presença |
| `POST` | `/api/lobbies/:id/kick` | ✓ ADM | Remover jogador |
| `POST` | `/api/lobbies/:id/toggle-player` | ✓ ADM | ADM entra/sai como jogador |
| `POST` | `/api/lobbies/:id/cancel` | ✓ ADM | Cancelar partida |
| `PATCH` | `/api/lobbies/:id` | ✓ ADM | Editar configurações |

---

## Eventos Socket.io

| Evento | Direção | Descrição |
|---|---|---|
| `join_lobby` | Client → Server | Inscrever-se em updates da sala |
| `leave_lobby` | Client → Server | Cancelar inscrição |
| `lobby_updated` | Server → Client | Estado atualizado do lobby |

---

## Arquitetura do Backend

```
src/
├── config/        # JWT, Swagger
├── middleware/    # Verificação de autenticação
├── models/        # Entidades ricas (Mongoose + regras de domínio)
├── repositories/  # Acesso ao MongoDB (única camada com Mongoose)
├── routes/        # HTTP handlers + anotações Swagger
├── services/      # Orquestradores de casos de uso
└── socket/        # Handlers Socket.io
```
