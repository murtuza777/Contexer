# Google OAuth Setup Guide for Contexer

This guide will walk you through setting up Google OAuth authentication for your Contexer application.

## Prerequisites

- A Google Cloud Platform (GCP) account
- Your Supabase project (Contexer - Project ID: jmebuptzryjtmgppqjgo)
- Admin access to your Supabase dashboard

## Step 1: Create Google OAuth Application

### 1.1 Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### 1.2 Enable Google+ API
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it
3. Also enable "Google OAuth2 API" if available

### 1.3 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" for User Type (unless you have a workspace)
3. Fill in the required information:
   - App name: "Contexer"
   - User support email: your email
   - Developer contact information: your email
4. Add your domain if you have one, or skip for development
5. Save and continue through the scopes (you can skip adding scopes for now)
6. Add test users if needed for development

### 1.4 Create OAuth 2.0 Client ID
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client ID"
3. Choose "Web application" as Application type
4. Name it "Contexer Web Client"
5. Add Authorized redirect URIs:
   ```
   https://jmebuptzryjtmgppqjgo.supabase.co/auth/v1/callback
   ```
6. Click "Create"
7. **Save the Client ID and Client Secret** - you'll need these for Supabase

## Step 2: Configure Supabase

### 2.1 Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your Contexer project

### 2.2 Configure Google Provider
1. Go to "Authentication" > "Providers"
2. Find "Google" in the list and click to configure
3. Enable the Google provider
4. Enter your Google OAuth credentials:
   - **Client ID**: The Client ID from Google Cloud Console
   - **Client Secret**: The Client Secret from Google Cloud Console
5. Click "Save"

## Step 3: Update Environment Variables

Add the following to your `.env.local` file if needed:

```env
NEXT_PUBLIC_SUPABASE_URL=https://jmebuptzryjtmgppqjgo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 4: Test the Implementation

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the login page
3. Click "Continue with Google"
4. Complete the Google OAuth flow
5. You should be redirected back to your application and logged in

## How It Works

### Authentication Flow

1. **User clicks "Continue with Google"**
   - Calls `signInWithGoogle()` function
   - Redirects to Google OAuth consent screen

2. **User authorizes the application**
   - Google redirects to Supabase callback URL
   - Supabase processes the OAuth response

3. **Supabase creates/updates user**
   - If new user: creates account automatically
   - If existing user: signs them in
   - Redirects to `/auth/callback` page

4. **Application handles callback**
   - Gets session from Supabase
   - Redirects to main application

### Code Structure

- **`hooks/useAuth.ts`**: Contains `signInWithGoogle()` function
- **`app/auth/callback/page.tsx`**: Handles OAuth redirects
- **`app/page.tsx`**: Updated login/signup forms with Google buttons

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Check that the redirect URI in Google Cloud Console exactly matches: 
     `https://jmebuptzryjtmgppqjgo.supabase.co/auth/v1/callback`

2. **"invalid_client" error**
   - Verify the Client ID and Client Secret are correct in Supabase
   - Make sure the Google OAuth client is enabled

3. **"access_denied" error**
   - The user declined the OAuth request
   - Or the OAuth consent screen needs to be configured properly

4. **Stuck on loading screen**
   - Check browser console for errors
   - Verify the callback page is working correctly

### Debug Steps

1. Check browser network tab for failed requests
2. Verify Supabase logs in the dashboard
3. Ensure all URLs match exactly (no trailing slashes, correct protocol)
4. Test with different browsers/incognito mode

## Security Notes

- Never expose your Client Secret in client-side code
- The redirect URI must exactly match what's configured in Google Cloud Console
- Consider implementing additional user verification for production apps
- Review Google's OAuth 2.0 security best practices

## Production Deployment

When deploying to production:

1. Update the redirect URI in Google Cloud Console to your production domain:
   ```
   https://your-production-domain.com/auth/v1/callback
   ```

2. Consider using a custom domain for your Supabase project for better branding

3. Submit your app for Google OAuth verification if you plan to have many users

## Additional Resources

- [Supabase Google Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth JavaScript Reference](https://supabase.com/docs/reference/javascript/auth-signinwithoauth) 