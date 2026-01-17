# Admin User Management Verification

## Quick Manual Tests

### Prerequisites
- Ensure `mercetti` admin user is seeded: `node scripts/seed-admin.js`
- Start server: `node server.js`
- Backend: http://localhost:8080
- Frontend: http://localhost:5173

### 1. Login via /admin/login
```bash
curl -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username":"mercetti","password":"Hype420!Hype"}'
# Expected: success=true, user object, admin_jwt cookie set
```

### 2. Login via /auth/login (Control Center)
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"username":"mercetti","password":"Hype420!Hype"}'
# Expected: success=true, user object, admin_jwt cookie set
```

### 3. Get CSRF token
```bash
curl -X GET http://localhost:8080/admin/csrf \
  -b cookies.txt \
  -c cookies.txt
# Expected: { token: "..." }
```

### 4. List admin users
```bash
curl -X GET http://localhost:8080/admin/users \
  -b cookies.txt
# Expected: { success:true, users:[...] }
```

### 5. Create a new admin
```bash
curl -X POST http://localhost:8080/admin/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "login":"testadmin",
    "display_name":"Test Admin",
    "email":"test@example.com",
    "password":"TestPass123!",
    "role":"admin",
    "status":"active"
  }'
# Expected: { success:true, user:{ login:"testadmin", ... } }
```

### 6. Update admin
```bash
curl -X PUT http://localhost:8080/admin/users/testadmin \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "display_name":"Updated Admin",
    "email":"updated@example.com"
  }'
# Expected: { success:true, user:{ display_name:"Updated Admin", ... } }
```

### 7. Disable/enable admin
```bash
curl -X PATCH http://localhost:8080/admin/users/testadmin/status \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"status":"disabled"}'
# Expected: { success:true, user:{ status:"disabled" } }

curl -X PATCH http://localhost:8080/admin/users/testadmin/status \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"status":"active"}'
# Expected: { success:true, user:{ status:"active" } }
```

### 8. Unlock admin (if locked)
```bash
curl -X POST http://localhost:8080/admin/users/testadmin/unlock \
  -b cookies.txt
# Expected: { success:true }
```

### 9. View audit logs
```bash
curl -X GET http://localhost:8080/admin/audit \
  -b cookies.txt
# Expected: { success:true, logs:[...] }
```

### 10. View login attempts for a user
```bash
curl -X GET http://localhost:8080/admin/users/mercetti/login-attempts \
  -b cookies.txt
# Expected: { success:true, attempts:[...] }
```

### 11. Logout
```bash
curl -X POST http://localhost:8080/admin/logout \
  -b cookies.txt \
  -c cookies.txt
# Expected: { success:true }, cookies cleared
```

### 12. Verify lockout behavior
```bash
# Attempt 5 wrong passwords
for i in {1..5}; do
  curl -X POST http://localhost:8080/admin/login \
    -H "Content-Type: application/json" \
    -d '{"username":"mercetti","password":"wrong"}' \
    -o /dev/null -s -w "Status: %{http_code}\n"
done
# 6th attempt should be 423 Locked or 429 Too Many Requests
curl -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"mercetti","password":"Hype420!Hype"}' \
  -o /dev/null -s -w "Status: %{http_code}\n"
```

## Automated Test Run
```bash
npm test -- test/admin-users.test.js
```

## UI Integration
- Your AI Control Center login form should POST `{username,password}` to `/auth/login`
- After successful login, store the returned JWT and user object
- Use the JWT in Authorization header or cookie for subsequent admin API calls
- Admin user management UI can call the CRUD endpoints listed above

## Security Checks
- Passwords are hashed with scrypt+salt
- Login attempts are logged and throttled
- Accounts lock after repeated failures (15 min)
- All admin routes require valid admin JWT
- Audit trail is recorded for all admin actions
