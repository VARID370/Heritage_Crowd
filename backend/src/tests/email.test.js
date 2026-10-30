const { sendVerificationEmail, isEmailConfigured, getEmailProvider } = require('../services/emailService');

describe('Email Verification Service Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should accurately detect when no email provider is configured', () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.BREVO_API_KEY;
    delete process.env.SMTP_PASS;

    expect(isEmailConfigured()).toBe(false);
    expect(getEmailProvider()).toBeNull();
  });

  it('should accurately detect Resend provider when RESEND_API_KEY is set', () => {
    process.env.RESEND_API_KEY = 're_test_key_123';
    expect(isEmailConfigured()).toBe(true);
    expect(getEmailProvider()).toBe('resend');
  });

  it('should accurately detect Brevo provider when BREVO_API_KEY is set', () => {
    delete process.env.RESEND_API_KEY;
    process.env.BREVO_API_KEY = 'xkeysib-test-123';
    expect(isEmailConfigured()).toBe(true);
    expect(getEmailProvider()).toBe('brevo');
  });

  it('should accurately detect SMTP provider when SMTP credentials are set', () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.BREVO_API_KEY;
    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_USER = 'test@gmail.com';
    process.env.SMTP_PASS = 'secret_pass';

    expect(isEmailConfigured()).toBe(true);
    expect(getEmailProvider()).toBe('smtp');
  });

  it('should return honest unconfigured status without pretending an email was sent', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.BREVO_API_KEY;
    delete process.env.SMTP_PASS;

    const result = await sendVerificationEmail({
      email: 'user@example.com',
      name: 'Test Visitor',
      token: 'test_token_123',
      otp: '654321',
    });

    expect(result.sent).toBe(false);
    expect(result.provider).toBeNull();
    expect(result.error).toMatch(/Email provider not configured/i);
    expect(result.token).toBe('test_token_123');
    expect(result.otp).toBe('654321');
  });
});
