/**
 * K App - Backend API Server
 * WebSocket + REST API for real-time messaging
 */

import { serve } from 'bun';

const PORT = parseInt(process.env.PORT || '3001');

// In-memory store (use Redis/PostgreSQL in production)
const users = new Map<string, {
  id: string;
  username: string;
  displayName: string;
  publicKey: string;
  signingPublicKey: string;
  passwordHash: string;
  salt: string;
  lastSeen: number;
  isOnline: boolean;
}>();

const sessions = new Map<string, { userId: string; token: string; createdAt: number }>();
const connections = new Map<string, Set<{ socket: WebSocket; userId: string }>>();

// Generate secure token
const generateToken = (length = 64): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    token += chars[randomValues[i] % chars.length];
  }
  return token;
};

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: corsHeaders });

const errorResponse = (message: string, status = 400) =>
  new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders });

// Request handler
const handleRequest = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Health check
  if (path === '/health') {
    return jsonResponse({ status: 'ok', version: '1.0.0', name: 'K App Server' });
  }

  // AUTH: Register
  if (path === '/api/auth/register' && method === 'POST') {
    try {
      const body = await req.json() as {
        username: string;
        displayName: string;
        passwordHash: string;
        salt: string;
        publicKey: string;
        signingPublicKey: string;
        phone?: string;
      };

      const { username, displayName, passwordHash, salt, publicKey, signingPublicKey } = body;

      if (!username || !displayName || !passwordHash || !publicKey) {
        return errorResponse('Missing required fields');
      }

      // Check username availability
      for (const user of users.values()) {
        if (user.username === username.toLowerCase()) {
          return errorResponse('Username already taken', 409);
        }
      }

      const userId = crypto.randomUUID();
      const user = {
        id: userId,
        username: username.toLowerCase(),
        displayName,
        publicKey,
        signingPublicKey,
        passwordHash,
        salt,
        lastSeen: Date.now(),
        isOnline: true,
      };

      users.set(userId, user);

      // Create session token
      const token = generateToken();
      sessions.set(token, { userId, token, createdAt: Date.now() });

      console.log(`[REGISTER] New user: @${username}`);

      return jsonResponse({
        success: true,
        userId,
        token,
        user: {
          id: userId,
          username: user.username,
          displayName: user.displayName,
          publicKey: user.publicKey,
          signingPublicKey: user.signingPublicKey,
        },
      });
    } catch (e) {
      return errorResponse('Invalid request body');
    }
  }

  // AUTH: Login
  if (path === '/api/auth/login' && method === 'POST') {
    try {
      const body = await req.json() as { username: string; passwordHash: string };
      const { username, passwordHash } = body;

      let foundUser = null;
      for (const user of users.values()) {
        if (user.username === username.toLowerCase()) {
          foundUser = user;
          break;
        }
      }

      if (!foundUser || foundUser.passwordHash !== passwordHash) {
        return errorResponse('Invalid credentials', 401);
      }

      const token = generateToken();
      sessions.set(token, { userId: foundUser.id, token, createdAt: Date.now() });

      foundUser.isOnline = true;
      foundUser.lastSeen = Date.now();

      return jsonResponse({
        success: true,
        token,
        user: {
          id: foundUser.id,
          username: foundUser.username,
          displayName: foundUser.displayName,
          publicKey: foundUser.publicKey,
          signingPublicKey: foundUser.signingPublicKey,
        },
      });
    } catch {
      return errorResponse('Invalid request');
    }
  }

  // USER: Get public key
  if (path.startsWith('/api/users/') && method === 'GET') {
    const userId = path.split('/')[3];
    const user = users.get(userId);
    if (!user) return errorResponse('User not found', 404);
    return jsonResponse({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      publicKey: user.publicKey,
      signingPublicKey: user.signingPublicKey,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
    });
  }

  // SEARCH: Find users
  if (path === '/api/users/search' && method === 'GET') {
    const q = url.searchParams.get('q')?.toLowerCase() || '';
    const results = Array.from(users.values())
      .filter(u => u.username.includes(q) || u.displayName.toLowerCase().includes(q))
      .slice(0, 20)
      .map(u => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        publicKey: u.publicKey,
        signingPublicKey: u.signingPublicKey,
        isOnline: u.isOnline,
        lastSeen: u.lastSeen,
      }));

    return jsonResponse({ users: results });
  }

  return errorResponse('Not found', 404);
};

// WebSocket handler for real-time messaging
const handleWebSocket = (ws: WebSocket, req: Request) => {
  const url = new URL(req.url);
  const token = url.searchParams.get('token') || '';
  const session = sessions.get(token);

  if (!session) {
    ws.close(4001, 'Unauthorized');
    return;
  }

  const userId = session.userId;
  const user = users.get(userId);
  if (!user) {
    ws.close(4004, 'User not found');
    return;
  }

  // Register connection
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  const userConnections = connections.get(userId)!;
  const conn = { socket: ws, userId };
  userConnections.add(conn);

  // Mark online
  user.isOnline = true;
  broadcastUserStatus(userId, true);

  console.log(`[WS] Connected: @${user.username}`);

  ws.addEventListener('message', (event) => {
    try {
      const data = JSON.parse(event.data as string);
      handleWsMessage(ws, userId, data);
    } catch (e) {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.addEventListener('close', () => {
    userConnections.delete(conn);
    if (userConnections.size === 0) {
      user.isOnline = false;
      user.lastSeen = Date.now();
      broadcastUserStatus(userId, false);
    }
    console.log(`[WS] Disconnected: @${user.username}`);
  });

  // Send welcome
  ws.send(JSON.stringify({
    type: 'connected',
    userId,
    serverTime: Date.now(),
  }));
};

// Handle WebSocket messages
const handleWsMessage = (ws: WebSocket, senderId: string, data: {
  type: string;
  to?: string;
  message?: unknown;
  chatId?: string;
  messageId?: string;
}) => {
  const { type } = data;

  switch (type) {
    case 'message': {
      const { to, message } = data;
      if (!to || !message) return;

      // Deliver to recipient
      deliverMessage(to, {
        type: 'message',
        from: senderId,
        message,
        timestamp: Date.now(),
      });

      // Confirm delivery to sender
      ws.send(JSON.stringify({
        type: 'delivered',
        messageId: (message as { messageId?: string })?.messageId,
        timestamp: Date.now(),
      }));
      break;
    }

    case 'typing': {
      const { to } = data;
      if (!to) return;
      deliverMessage(to, {
        type: 'typing',
        from: senderId,
        chatId: data.chatId,
      });
      break;
    }

    case 'read': {
      const { to, chatId } = data;
      if (!to) return;
      deliverMessage(to, {
        type: 'read',
        from: senderId,
        chatId,
        timestamp: Date.now(),
      });
      break;
    }

    case 'ping': {
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    }
  }
};

// Deliver message to a user's connections
const deliverMessage = (userId: string, payload: unknown) => {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  const message = JSON.stringify(payload);
  for (const conn of userConnections) {
    try {
      conn.socket.send(message);
    } catch {
      userConnections.delete(conn);
    }
  }
};

// Broadcast online status
const broadcastUserStatus = (userId: string, isOnline: boolean) => {
  for (const [uid, conns] of connections.entries()) {
    if (uid !== userId) {
      for (const conn of conns) {
        try {
          conn.socket.send(JSON.stringify({
            type: 'user_status',
            userId,
            isOnline,
            timestamp: Date.now(),
          }));
        } catch {
          conns.delete(conn);
        }
      }
    }
  }
};

// Start server
const server = serve({
  port: PORT,
  fetch: async (req) => {
    const url = new URL(req.url);

    // Handle WebSocket upgrade
    if (url.pathname === '/ws' && req.headers.get('upgrade') === 'websocket') {
      const upgraded = server.upgrade(req);
      if (upgraded) return undefined as unknown as Response;
      return new Response('WebSocket upgrade failed', { status: 500 });
    }

    return handleRequest(req);
  },
  websocket: {
    open: (ws) => {
      // Connection established
    },
    message: (ws, message) => {
      try {
        const data = JSON.parse(message as string);
        const userId = (ws.data as { userId?: string })?.userId;
        if (userId) handleWsMessage(ws as unknown as WebSocket, userId, data);
      } catch {
        // ignore
      }
    },
    close: (ws) => {
      // Cleanup handled in ws.addEventListener
    },
  },
});

console.log(`
╔══════════════════════════════════════╗
║     K App Server - Secure Chat      ║
╠══════════════════════════════════════╣
║  Port:    ${PORT}                       ║
║  E2E:     X25519 + XSalsa20         ║
║  Sign:    Ed25519                   ║
║  WS:      Real-time messaging       ║
╚══════════════════════════════════════╝
`);

export default server;
