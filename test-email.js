/**
 * Simple test script to verify email service works independently
 */

async function testEmail() {
  try {
    console.log('🧪 Starting email service test...')
    
    // Start SMTP-tester server
    const smtpTester = await import('smtp-tester')
    const mailServer = smtpTester.default.init(2500)
    console.log('📧 SMTP test server started on port 2500')
    
    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Import and test email service
    const { sendConfirmationEmail } = await import('./src/lib/email-service.ts')
    
    const testEmail = 'test@example.com'
    const testName = 'Test User'
    const testUrl = 'http://localhost:3000/auth/verify-email?token=test-token-123'
    const testToken = 'test-token-123'
    
    console.log('🔔 Sending test email...')
    
    // Set up email capture
    const emailPromise = mailServer.captureOne(testEmail, { wait: 5000 })
    
    // Send email
    await sendConfirmationEmail(testEmail, testName, testUrl, testToken)
    
    // Wait for email
    console.log('⏳ Waiting for email...')
    const { email } = await emailPromise
    
    console.log('✅ Email received!')
    console.log('📋 Subject:', email.subject)
    console.log('📋 To:', email.to)
    console.log('📋 Content preview:', email.text?.substring(0, 100) + '...')
    
    // Stop server
    if (mailServer && typeof mailServer.stop === 'function') {
      mailServer.stop()
    }
    
    console.log('🎉 Email test completed successfully!')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Email test failed:', error)
    process.exit(1)
  }
}

testEmail()
