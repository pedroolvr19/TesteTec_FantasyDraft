# Enquetes ao vivo

Este projeto implementa um sistema de enquetes em tempo real para o teste técnico da FantasyDraft

Olá! Nesse projeto de teste que fiz, achei bem tranquilo, pois tive experiência no passado com React e Node. Tive um pouco de dificuldade com o Laravel por não ter muito conhecimento, mas como o Laravel é em POO, então foi tranquilo. Levei ontem à noite e hoje para terminar esse projeto.

## Arquitetura do projeto

1. **Backend (Laravel):**
   - Banco de dados SQLite.
   - Rotas de API protegidas pelo `auth:sanctum`.
   - **Bridge Node.js:** Como não foi utilizado Redis, a comunicação Laravel ↔ WebSocket ocorre via chamadas HTTP. Toda vez que um voto é salvo com sucesso, o Laravel faz um `POST` no Express da porta 3001

2. **WebSocket (Node.js):**
   - Servidor Node simples executando o pacote `ws`.
   - Possui duas portas: a porta `3001` para receber os broadcasts do Laravel e a porta `3002` para os clientes React.
   - Gerencia salas (`rooms`) em memória utilizando `Map<pollId, Set<WebSocket>>` para entregar a mensagem apenas aos clientes interessados naquela enquete específica.
   - Implementa mecanismo de *heartbeat* para fechar conexões fantasmas a cada 30 segundos.

3. **Frontend (React + Vite):**
   - SPA utilizando componentes e hooks customizados.
   - **Controle de Votante:** Como o escopo pede proteção Sanctum sem exigir tela de login/cadastro, foi implementado o `DummyUserSeeder` que gera um token fixo. Esse token deve ser inserido no frontend.
   - A identificação única do votante para evitar votos duplicados é feita gerando um UUID v4 armazenado no `localStorage`.

## Requisitos

- **Chave Primária:** Uso de inteiros com auto-incremento.
- **Respostas Diretas:** A API retorna os dados limpos sem o wrapper `{ "data": ... }`.
- **Componentização:** O frontend não é um arquivo gigante. O projeto possui componentes separados (`PollView`, `PollResults`, `PollOption`, `CreatePollForm`) e *CSS Modules* (`.module.css`).
- **Testes Automatizados:** 6 testes PHPUnit escritos no arquivo `tests/Feature/VoteTest.php` validando cenários críticos (voto duplicado, poll_id incorreto, etc).
- **Encerramento Automático:** Adicionado o campo `expires_at` opcional na criação da enquete. Se o tempo expirar, a API barra o voto.
- **Animações:** Barras de progresso com CSS flexível (cubic-bezier) e indicação visual para a opção vencedora.
- **Voto Duplicado no Front:** Se o usuário já votou, ele é bloqueado e levado direto aos resultados.

---

## Como Executar o Projeto

Você vai precisar abrir **três terminais**. Siga a ordem abaixo rigorosamente para que a comunicação Sanctum/WS funcione.

### Passo 1: Backend Laravel
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# Cria o banco e roda as seeders (Vai gerar o token do Sanctum!)
php artisan migrate:fresh --seed

# Copie o token impresso no terminal, e cole no frontend/.env
# Depois, inicie o servidor
php artisan serve
```

### Passo 2: Servidor WebSocket
```bash
cd websocket
npm install

# Inicia o servidor HTTP na porta 3001 e o WS na porta 3002
npm start
```

### Passo 3: Frontend React
Crie um arquivo `.env` na raiz da pasta `frontend/` (se ainda não existir) com:
```env
VITE_API_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:3002
VITE_SANCTUM_TOKEN=COLE_O_TOKEN_AQUI_COM_O_NUMERO_NA_FRENTE
```

Em seguida, rode o servidor:
```bash
cd frontend
npm install
npm run dev
```

Abra `http://localhost:5173` no seu navegador!

---

## Rodando os Testes
Para garantir que as regras de negócio de votação funcionam, no terminal do backend rode:
```bash
cd backend
php artisan test
```
