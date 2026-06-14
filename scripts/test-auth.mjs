import jwt from 'jsonwebtoken';
import { ensureAuth } from '../server/middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

async function main() {
  console.log('Running quick JWT/auth middleware test');

  const payload = { id: 999, email: 'tester@example.com', role: 'user' };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  console.log('Signed token (preview):', token.slice(0, 40) + '...');

  // Verify using jwt.verify
  const verified = jwt.verify(token, JWT_SECRET);
  console.log('Verified payload:', { id: verified.id, email: verified.email, role: verified.role });

  // Run ensureAuth middleware with a fake req/res/next
  const req = { headers: { authorization: 'Bearer ' + token } };
  const res = {
    status: () => ({ json: (obj) => { throw new Error('Middleware responded: ' + JSON.stringify(obj)); } }),
  };

  let nextCalled = false;
  ensureAuth(req, res, () => { nextCalled = true; console.log('ensureAuth next called, req.user:', req.user); });

  if (!nextCalled) throw new Error('ensureAuth did not call next');

  console.log('JWT/middleware test passed');
}

main().catch((err) => {
  console.error('Test failed:', err.message || err);
  process.exit(1);
});
