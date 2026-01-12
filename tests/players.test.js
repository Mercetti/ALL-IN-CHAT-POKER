const request = require('supertest');

// Initialize database before requiring server
const db = require('../server/db');
db.init();

const { server } = require('../server');

describe('Player/Streamer Management', () => {
  let playerCookie = null;
  let playerToken = null;
  let adminCookie = null;

  beforeAll(async () => {
    // Seed mercetti admin if not exists
    const auth = require('../server/auth');
    const existing = db.getAdminUser('mercetti');
    if (!existing) {
      db.createAdminUser({
        login: 'mercetti',
        display_name: 'Mercetti',
        email: 'owner@example.com',
        password_hash: auth.hashPassword('Hype420!Hype'),
        role: 'owner',
        status: 'active',
        created_by: 'test',
      });
    }

    // Login as admin
    const adminRes = await request(server)
      .post('/admin/login')
      .send({ username: 'mercetti', password: 'Hype420!Hype' });
    adminCookie = adminRes.headers['set-cookie'].find(c => c.startsWith('admin_jwt='));
  });

  it('should register a new player', async () => {
    const res = await request(server)
      .post('/players/register')
      .send({
        login: 'testplayer',
        password: 'TestPass123!',
        email: 'testplayer@example.com',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile.login).toBe('testplayer');
    playerToken = res.body.token;
  });

  it('should reject duplicate player registration', async () => {
    const res = await request(server)
      .post('/players/register')
      .send({
        login: 'testplayer',
        password: 'AnotherPass123!',
      });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/login_taken/);
  });

  it('should login player', async () => {
    const res = await request(server)
      .post('/players/login')
      .send({
        login: 'testplayer',
        password: 'TestPass123!',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile.login).toBe('testplayer');
    playerToken = res.body.token;
  });

  it('should reject player login with wrong password', async () => {
    const res = await request(server)
      .post('/players/login')
      .send({
        login: 'testplayer',
        password: 'wrong',
      });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid_credentials/);
  });

  it('should get player profile', async () => {
    const res = await request(server)
      .get('/players/me')
      .set('Authorization', `Bearer ${playerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile.login).toBe('testplayer');
    expect(res.body.profile.twitchLinked).toBe(false);
    expect(res.body.profile.discordLinked).toBe(false);
  });

  it('should update player profile', async () => {
    const res = await request(server)
      .put('/players/me')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        display_name: 'Test Player',
        email: 'updated@example.com',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.profile.display_name).toBe('Test Player');
    expect(res.body.profile.email).toBe('updated@example.com');
  });

  it('should change player password', async () => {
    const res = await request(server)
      .put('/players/me/password')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        currentPassword: 'TestPass123!',
        newPassword: 'NewPass123!',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should login with new password', async () => {
    const res = await request(server)
      .post('/players/login')
      .send({
        login: 'testplayer',
        password: 'NewPass123!',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject password change with wrong current password', async () => {
    const res = await request(server)
      .put('/players/me/password')
      .set('Authorization', `Bearer ${playerToken}`)
      .send({
        currentPassword: 'wrong',
        newPassword: 'NewPass123!',
      });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid_current_password/);
  });

  it('should list players as admin', async () => {
    const res = await request(server)
      .get('/admin/players')
      .set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.players)).toBe(true);
    expect(res.body.players.some(p => p.login === 'testplayer')).toBe(true);
  });

  it('should ban player as admin', async () => {
    const res = await request(server)
      .post('/admin/players/testplayer/ban')
      .set('Cookie', adminCookie)
      .send({ reason: 'Test ban' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.player.role).toBe('banned');
  });

  it('should reject login for banned player', async () => {
    const res = await request(server)
      .post('/players/login')
      .send({
        login: 'testplayer',
        password: 'NewPass123!',
      });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid_credentials/);
  });

  it('should unban player as admin', async () => {
    const res = await request(server)
      .post('/admin/players/testplayer/unban')
      .set('Cookie', adminCookie)
      .send({ reason: 'Test unban' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.player.role).toBe('player');
  });

  it('should login after unbanning', async () => {
    const res = await request(server)
      .post('/players/login')
      .send({
        login: 'testplayer',
        password: 'NewPass123!',
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should reject unauthorized access to admin endpoints', async () => {
    const res = await request(server).get('/admin/players');
    expect(res.status).toBe(401);
  });

  it('should reject unauthenticated access to player endpoints', async () => {
    const res = await request(server).get('/players/me');
    expect(res.status).toBe(401);
  });

  afterAll(async () => {
    // Cleanup test player
    const db = require('../server/db');
    db.db.prepare('DELETE FROM profiles WHERE login = ?').run('testplayer');
  });
});
