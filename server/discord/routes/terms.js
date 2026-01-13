/**
 * Discord Terms of Service Route
 * Static legal route - must load publicly without auth
 * Required endpoint: /terms
 */

function createTermsRouter() {
  return (req, res) => {
    // Set content type to plain text
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
    
    // Terms of Service text - entertainment-only framing
    const termsText = `ALL-IN CHAT POKER - TERMS OF SERVICE

Last Updated: January 2026

1. ACCEPTANCE OF TERMS
By accessing or using All-In Chat Poker ("the Service"), you agree to these Terms of Service and our Privacy Policy.

2. ENTERTAINMENT PURPOSE ONLY
The Service is provided for entertainment purposes only. All games, points, chips, and virtual items have no real-world value and cannot be exchanged for real money or prizes.

3. NO REAL MONEY GAMBLING
The Service does not facilitate real money gambling, betting, or wagering. No financial transactions involving real currency are supported or permitted.

4. FICTIONAL CURRENCY
All chips, points, and virtual items are fictional and for entertainment only. These items have no monetary value and cannot be cashed out or exchanged.

5. USER CONDUCT
You must be at least 13 years old to use this Service.
You agree not to:
- Use the Service for any illegal or harmful purposes
- Attempt to exploit or hack the Service
- Harass or abuse other users
- Violate any applicable laws or regulations

6. AI ENTERTAINMENT HOST
Acey is an AI entertainment host designed for community engagement. Acey does not provide financial advice, gambling advice, or guarantee any outcomes. All AI responses are for entertainment purposes only.

7. INTELLECTUAL PROPERTY
The Service and its original content are owned by us and are protected by intellectual property laws.

8. DISCLAIMER OF WARRANTIES
The Service is provided "as is" without warranties of any kind, either express or implied.

9. LIMITATION OF LIABILITY
We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.

10. TERMINATION
We may terminate or suspend your account at any time for violation of these terms.

11. CHANGES TO TERMS
We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.

12. GOVERNING LAW
These terms are governed by the laws of [Your Jurisdiction].

13. CONTACT INFORMATION
For questions about these terms, please contact us at [Your Contact Email].

---

IMPORTANT: This is an entertainment service only. No real money gambling is involved. All virtual items have no monetary value.`;

    res.send(termsText);
  };
}

module.exports = { createTermsRouter };
