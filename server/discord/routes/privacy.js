/**
 * Discord Privacy Policy Route
 * Static legal route - must load publicly without auth
 * Required endpoint: /privacy
 */

function createPrivacyRouter() {
  return (req, res) => {
    // Set content type to plain text
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    // Privacy Policy text - compliant with Discord requirements
    const privacyText = `ALL-IN CHAT POKER - PRIVACY POLICY

Last Updated: January 2026

1. INFORMATION WE COLLECT
We collect minimal information necessary to provide our entertainment service:

Discord User IDs: Used to identify and authenticate users
Usernames: Display names for community interaction
Usage Data: How you interact with our entertainment features
Connection Times: When you last used the service

2. INFORMATION WE DO NOT COLLECT
We explicitly do not collect:
- Chat logs or message content
- Personal conversations
- Financial information
- Real-world identity information
- Location data beyond what Discord provides
- Contact information beyond what Discord provides

3. HOW WE USE YOUR INFORMATION
Your information is used solely to:
- Provide the entertainment service
- Display your username in games
- Track your fictional game progress
- Enable Discord Linked Roles features
- Ensure service security and stability

4. AI PROCESSING
Our AI host (Acey) processes minimal interaction data for entertainment purposes only:
- Game commands and actions
- Basic user engagement patterns
- No personal conversations are stored
- No message content is retained

5. DATA STORAGE AND SECURITY
- All data is stored securely using encryption
- Discord OAuth tokens are encrypted at rest
- We use industry-standard security practices
- Data is retained only as long as necessary

6. TWITCH INTEGRATION
If you connect your Twitch account:
- We store your Twitch username only
- No Twitch chat data is collected
- No Twitch personal information is stored
- You can disconnect at any time

7. DISCORD LINKED ROLES
We provide Discord Linked Roles based on:
- Whether you've played games (boolean)
- VIP status (if applicable)
- High roller status (if applicable)
All role metadata is boolean only - no personal data shared.

8. YOUR RIGHTS
You have the right to:
- Access your data
- Correct inaccurate data
- Delete your account and all associated data
- Export your data
- Disconnect linked services

9. DATA DELETION
To request data deletion:
- Contact us at [Your Contact Email]
- Include your Discord user ID
- We will delete all your data within 30 days
- Discord Linked Roles will be updated accordingly

10. DATA RETENTION
We retain data only as long as necessary:
- User accounts: Until deletion request
- OAuth tokens: Until expiration or revocation
- Usage data: 90 days maximum
- No chat logs or message content are ever stored

11. THIRD-PARTY SHARING
We do not sell, rent, or share your personal data with third parties except:
- Discord (for authentication and Linked Roles)
- Twitch (if you connect your account, for username only)
- Service providers (only as necessary to run the service)

12. INTERNATIONAL USERS
Your data may be processed in [Your Country/Region]. By using our service, you consent to this processing.

13. CHILDREN'S PRIVACY
Our service is not intended for children under 13. We do not knowingly collect information from children under 13.

14. CHANGES TO THIS POLICY
We may update this privacy policy from time to time. Changes will be posted here and are effective immediately.

15. CONTACT INFORMATION
For privacy-related questions, contact us at:
Email: [Your Contact Email]
Discord: [Your Discord Server/Contact]

---

DATA PROTECTION SUMMARY:
- No chat logs stored
- No message content retained
- Minimal data collection
- Encrypted storage
- Easy deletion process
- Discord ID and username only
- AI processing for entertainment only
- No sale of personal data`;

    res.send(privacyText);
  };
}

module.exports = { createPrivacyRouter };
