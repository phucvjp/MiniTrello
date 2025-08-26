# Resend Email Service Setup Guide

## 🚀 Quick Setup

### 1. Create a Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key
1. Log into your Resend dashboard
2. Go to "API Keys" section
3. Click "Create API Key"
4. Copy the generated API key (starts with `re_`)

### 3. Configure Your Domain (Optional but Recommended)
1. In Resend dashboard, go to "Domains"
2. Add your domain (e.g., `yourdomain.com`)
3. Follow DNS verification steps
4. Once verified, you can send from `noreply@yourdomain.com`

### 4. Update Environment Variables
Update your `.env` file with:
```bash
# Email Configuration (using Resend)
RESEND_API_KEY=re_your_actual_api_key_here
EMAIL_FROM=Mini Trello <noreply@yourdomain.com>
```

### 5. Free Tier Limits
- **100 emails/day** on free plan
- **3,000 emails/month** on free plan
- Upgrade to paid plan for higher limits

## 📧 Email Templates

The system now uses Resend to send:
- ✅ **Verification emails** with 6-digit codes
- 🔐 **Password reset emails** with secure links

## 🔧 Testing

For testing purposes, you can use:
```bash
EMAIL_FROM=Mini Trello <onboarding@resend.dev>
```

The `onboarding@resend.dev` domain is provided by Resend for testing and works immediately without domain verification.

## ✨ Benefits of Resend
- Simple API
- Better deliverability
- Real-time delivery tracking
- No SMTP configuration needed
- Built-in analytics

## 🆘 Troubleshooting

### Common Issues:
1. **API Key Error**: Make sure your API key starts with `re_`
2. **Domain Not Verified**: Use `onboarding@resend.dev` for testing
3. **Rate Limits**: Check your Resend dashboard for usage stats

### Check Logs:
The server will log successful email sends:
```
✅ Verification email sent with Resend! {message_id}
```

Or errors:
```
❌ Resend email sending error: {error_details}
```
