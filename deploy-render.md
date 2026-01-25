# Deploy to Render Guide

## 🚀 Quick Setup

### 1. Push to GitHub
```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### 2. Set up Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" -> "Web Service"
4. Connect your GitHub repository
5. Select the `all-in-chat-poker` repo
6. Render will auto-detect your `render.yaml` file

### 3. Configure Environment Variables
In Render dashboard, set these secrets:

**For Poker Game:**
- `JWT_SECRET` - Generate a random string
- `ADMIN_PASSWORD` - Your admin password
- `ADMIN_TOKEN` - Generate a random token

**For Bot:**
- `DISCORD_BOT_TOKEN` - Your Discord bot token
- `DISCORD_CLIENT_ID` - Your Discord application ID

### 4. Deploy
- Click "Create Web Service"
- Render will automatically deploy both services and database

## 📊 What Gets Deployed

### Services:
1. **all-in-chat-poker** (Web Service)
   - URL: `https://all-in-chat-poker.onrender.com`
   - Main poker game
   - Health check at `/health`

2. **poker-bot** (Background Worker)
   - Discord/Twitch bot
   - Runs continuously

### Database:
- **poker-db** (PostgreSQL)
   - Managed by Render
   - Automatic backups
   - Connection string injected via `DATABASE_URL`

## 🔧 Post-Deployment

### 1. Test the Game
Visit your app URL and check:
- Game loads
- Health endpoint works: `https://your-app.onrender.com/health`

### 2. Configure Bot
Update your Discord bot to point to:
`https://all-in-chat-poker.onrender.com`

### 3. Database Migration
If you need to migrate existing SQLite data:
1. Export from SQLite
2. Import to PostgreSQL via Render dashboard

## 🆘 Troubleshooting

### Common Issues:
- **Build fails**: Check `package.json` scripts
- **Database connection**: Verify `DATABASE_URL` is set
- **Bot not working**: Check Discord tokens
- **Service not starting**: Check Render logs

### Logs:
- In Render dashboard, click on service -> "Logs"
- Check both web service and worker logs

## 💡 Tips

- Free tier services spin down after 15 minutes inactivity
- Database stays active (free tier)
- Upgrade to paid tier for production use
- Use Render's preview environments for testing

## 📈 Scaling

When ready to scale:
1. Upgrade services to paid tier ($7/month each)
2. Add more services (HELM control, etc.)
3. Add more databases if needed
4. Set up custom domains
