# AWS SES Email Configuration Guide

This guide will help you set up AWS Simple Email Service (SES) for sending emails from FrameCraft.

## Overview

FrameCraft supports multiple email providers:
- **Development Mode** (default): Emails are logged to console only
- **Gmail OAuth**: Uses Google OAuth2 for sending emails
- **AWS SES** (recommended for production): Scalable, reliable email delivery

## Why AWS SES?

- **Reliability**: High deliverability rates with proper configuration
- **Scalability**: Send thousands of emails per second
- **Cost-effective**: $0.10 per 1,000 emails
- **Analytics**: Built-in bounce and complaint tracking
- **Security**: Full AWS IAM integration

## Prerequisites

1. AWS Account with SES access
2. Verified domain or email addresses
3. AWS IAM credentials with SES permissions

## Step-by-Step Setup

### 1. Enable AWS SES in Your AWS Account

1. Log in to AWS Console
2. Navigate to Amazon SES service
3. Choose your region (recommended: `us-east-1` for best deliverability)

### 2. Verify Your Email/Domain

#### Option A: Verify Email Address (Quick Setup)
```bash
# Using AWS CLI
aws ses verify-email-identity --email-address noreply@yourdomain.com
```

Or in AWS Console:
1. Go to SES → Email Addresses
2. Click "Verify a New Email Address"
3. Enter your email and click verify
4. Check inbox and click verification link

#### Option B: Verify Domain (Recommended for Production)
1. Go to SES → Domains
2. Click "Verify a New Domain"
3. Enter your domain
4. Add the provided DNS records to your domain
5. Wait for verification (usually 24-72 hours)

### 3. Create IAM User for SES

1. Go to IAM → Users → Add User
2. Username: `framekraft-ses`
3. Select "Programmatic access"
4. Attach policy: `AmazonSESFullAccess` or create custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:GetSendQuota",
        "ses:GetSendStatistics",
        "ses:ListVerifiedEmailAddresses",
        "ses:VerifyEmailIdentity",
        "ses:GetIdentityVerificationAttributes"
      ],
      "Resource": "*"
    }
  ]
}
```

5. Save the Access Key ID and Secret Access Key

### 4. Move Out of Sandbox (Production Only)

By default, SES accounts are in sandbox mode (can only send to verified emails).

To request production access:
1. Go to SES → Sending Statistics
2. Click "Request a Sending Limit Increase"
3. Fill out the form with:
   - Use case description
   - How you handle bounces/complaints
   - Expected sending volume
4. Wait for AWS approval (24-48 hours)

### 5. Configure FrameCraft Environment

Add to your `.env` file:

```bash
# AWS SES Configuration
AWS_SES_ENABLED=true
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
AWS_SES_REPLY_TO=support@yourdomain.com
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=your-secret-access-key-here
```

### 6. Test Configuration

1. Restart the server:
```bash
npm run dev
```

2. Check email configuration:
```bash
curl http://localhost:3001/api/email/config
```

3. Send test email:
```bash
curl -X POST http://localhost:3001/api/email/send-test \
  -H "Content-Type: application/json" \
  -d '{"recipientEmail":"your-email@example.com","testType":"invoice"}'
```

## Email Features in FrameCraft

### Available Email Types

1. **Invoice Emails**: Professional invoice delivery to customers
2. **Order Status Updates**: Automatic notifications on order progress
3. **Payment Reminders**: Automated reminders for outstanding balances
4. **Bulk Marketing**: Send promotional emails to customer lists

### API Endpoints

- `GET /api/email/config` - Check current email configuration
- `POST /api/email/switch-provider` - Switch between providers
- `POST /api/email/verify-email` - Verify email address (AWS SES)
- `GET /api/email/check-verified/:email` - Check verification status
- `POST /api/email/send-test` - Send test email
- `GET /api/email/statistics` - Get sending statistics (AWS SES)
- `POST /api/receivables/send-reminder` - Send payment reminder

### Using the Email Service

#### Send Invoice Email
```javascript
await unifiedEmailService.sendInvoiceEmail(
  invoiceId,
  'customer@example.com',
  'Optional custom message'
);
```

#### Send Order Status Update
```javascript
await unifiedEmailService.sendOrderStatusUpdate(
  orderId,
  'completed',
  'customer@example.com'
);
```

#### Send Bulk Email (AWS SES only)
```javascript
await unifiedEmailService.sendBulkEmail({
  recipients: ['customer1@example.com', 'customer2@example.com'],
  subject: 'Special Offer',
  htmlBody: '<html>...</html>',
  textBody: 'Plain text version',
  campaignId: 'summer-sale-2024'
});
```

## Monitoring & Troubleshooting

### Check Email Service Health
```bash
curl http://localhost:3001/api/email/config
```

### View Email Statistics (AWS SES)
```bash
curl http://localhost:3001/api/email/statistics
```

### Common Issues

#### 1. "Email address not verified"
- Verify the from email in AWS SES
- Check you're using the correct AWS region

#### 2. "Rate limit exceeded"
- AWS SES has sending rate limits
- Check your current quota: `aws ses get-send-quota`

#### 3. "Access denied"
- Verify IAM permissions
- Check AWS credentials are correct

#### 4. "Message rejected"
- Check for spam trigger words
- Ensure proper email formatting
- Verify recipient email is valid

### Best Practices

1. **Always verify sender domains** for better deliverability
2. **Set up SPF, DKIM, and DMARC** DNS records
3. **Monitor bounce and complaint rates** (should be <5% and <0.1%)
4. **Use configuration sets** for tracking
5. **Implement retry logic** for transient failures
6. **Handle bounces and complaints** programmatically
7. **Warm up your sending reputation** gradually

## Security Considerations

1. **Never commit AWS credentials** to version control
2. **Use IAM roles** in production (EC2/ECS)
3. **Rotate access keys** regularly
4. **Enable MFA** on AWS account
5. **Use least privilege principle** for IAM policies
6. **Monitor for unusual activity** using CloudWatch

## Production Checklist

- [ ] Domain verified in AWS SES
- [ ] Moved out of SES sandbox
- [ ] SPF records configured
- [ ] DKIM enabled and configured
- [ ] DMARC policy set up
- [ ] Bounce handling implemented
- [ ] Complaint handling implemented
- [ ] CloudWatch alarms configured
- [ ] Rate limiting implemented
- [ ] Error handling and retry logic
- [ ] Email templates tested
- [ ] Monitoring dashboard set up

## Support

For issues or questions:
1. Check AWS SES documentation: https://docs.aws.amazon.com/ses/
2. Review CloudWatch logs for errors
3. Contact AWS Support for SES-specific issues
4. Check FrameCraft logs: `npm run dev` and review console output