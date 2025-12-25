# 🚀 MERC-CMMS Enterprise Setup Instructions

## Complete Enterprise Medical Device CMMS Platform Setup

This guide will help you set up the complete MERC-CMMS platform with Supabase + Vercel (100% FREE).

---

## 📋 **Prerequisites**

- **Supabase Account**: https://supabase.com (Free tier: 500MB database, 2GB bandwidth)
- **Vercel Account**: https://vercel.com (Free tier: Unlimited deployments)
- **Git Repository**: Your code repository

---

## 🗄️ **Step 1: Set Up Supabase Database**

### 1.1 Create Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `merc-cmms-enterprise`
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free
4. Click "Create new project"

### 1.2 Run Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the ENTIRE contents of `supabase_schema.sql` file
4. Paste into the SQL editor
5. Click **"Run"** button
6. Wait for "Success. No rows returned" message

✅ **Your database is now ready!**

### 1.3 Get Your Supabase Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJI...` (long string)

---

## 🔑 **Step 2: Enable Supabase Authentication**

### 2.1 Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure:
   - ✅ Enable email confirmations
   - ✅ Enable email change confirmations
4. Save

### 2.2 Create First Admin User

1. Go to **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Fill in:
   - **Email**: your-email@domain.com
   - **Password**: Create strong password
   - **Auto Confirm User**: ✅ Yes
4. Click "Create user"

### 2.3 Add User Profile

1. Go to **SQL Editor**
2. Run this query (replace with your user ID):

```sql
-- Get your user ID first
SELECT id FROM auth.users WHERE email = 'your-email@domain.com';

-- Insert user profile (use the ID from above)
INSERT INTO public.user_profiles (id, email, full_name, role, department)
VALUES (
    'YOUR-USER-ID-HERE',
    'your-email@domain.com',
    'System Administrator',
    'admin',
    'IT'
);
```

---

## 📦 **Step 3: Enable Supabase Storage**

### 3.1 Create Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Click "Create bucket"
3. Create these buckets:

   **Bucket 1: asset-documents**
   - Name: `asset-documents`
   - Public: ✅ Yes
   - Click "Create bucket"

   **Bucket 2: work-order-attachments**
   - Name: `work-order-attachments`
   - Public: ✅ Yes
   - Click "Create bucket"

   **Bucket 3: reports**
   - Name: `reports`
   - Public: ✅ Yes
   - Click "Create bucket"

### 3.2 Set Storage Policies

For each bucket, go to **Policies** and add:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'asset-documents');

-- Allow public read
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'asset-documents');
```

Repeat for `work-order-attachments` and `reports` buckets.

---

## 🌐 **Step 4: Deploy to Vercel**

### 4.1 Update Configuration Files

1. Open `vercel.json` and ensure it looks like this:

```json
{
  "version": 2,
  "buildCommand": "echo 'Static site - no build required'",
  "outputDirectory": ".",
  "routes": [
    { "src": "/", "dest": "/index.html" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

### 4.2 Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Other
   - **Build Command**: (leave empty)
   - **Output Directory**: `.`
5. Click "Deploy"

✅ **Your app is now live!**

---

## 🔧 **Step 5: Update Supabase Credentials in Code**

### Update ALL HTML Files

Search for these lines in **ALL** HTML files and update with YOUR credentials:

**Files to update:**
- `index.html`
- `assets.html`
- `work-orders.html`
- `customers.html`
- `compliance.html`
- `main.js`

**Find this:**
```javascript
const supabaseUrl = 'https://hmdemsbqiqlqcggwblvl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Replace with YOUR credentials:**
```javascript
const supabaseUrl = 'YOUR-PROJECT-URL';
const supabaseKey = 'YOUR-ANON-PUBLIC-KEY';
```

---

## 🎯 **Step 6: Test Your Setup**

### 6.1 Test Database Connection

1. Open your deployed app
2. Go to **Customers** page
3. Click the **?** button (debug button) in bottom right
4. Should show: "Supabase connection successful!"

### 6.2 Test CRUD Operations

1. Click "Add Customer"
2. Fill in the form
3. Click "Save Customer"
4. Should see: "Customer added successfully!"

### 6.3 Test All Pages

Visit each page and verify it loads:
- ✅ Dashboard: `your-domain.vercel.app/`
- ✅ Customers: `your-domain.vercel.app/customers.html`
- ✅ Assets: `your-domain.vercel.app/assets.html`
- ✅ Work Orders: `your-domain.vercel.app/work-orders.html`
- ✅ Compliance: `your-domain.vercel.app/compliance.html`

---

## 🎨 **Step 7: Seed Sample Data (Optional)**

To populate your database with sample data:

1. Go to **SQL Editor** in Supabase
2. Run `seed_data.sql` (I'll create this file next)
3. This will create:
   - 10 Sample customers
   - 20 Sample locations
   - 50 Sample assets
   - 100 Sample work orders

---

## 🔐 **Step 8: Security Configuration (Production)**

### 8.1 Configure RLS Policies

The database schema includes basic RLS policies. For production:

1. Go to **Authentication** → **Policies**
2. Review and customize policies based on user roles
3. Example:

```sql
-- Only admins can delete customers
CREATE POLICY "Only admins can delete"
ON public.customers FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

### 8.2 Set Up Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize:
   - Confirmation email
   - Password reset email
   - Magic link email

---

## 📊 **Step 9: Monitor & Maintain**

### 9.1 Check Usage

Monitor your free tier limits:
- **Database**: 500MB (Check: Database → Settings)
- **Bandwidth**: 2GB/month (Check: Settings → Billing)
- **Storage**: 1GB (Check: Storage)

### 9.2 Set Up Backups

Supabase automatically backs up your database. To download:
1. Go to **Settings** → **Database**
2. Click "Download backup"

---

## 🎉 **You're All Set!**

Your enterprise CMMS platform is now:
- ✅ Fully functional with real database
- ✅ Hosted on Vercel (with SSL)
- ✅ Using Supabase for data & auth
- ✅ 100% FREE (within limits)
- ✅ Production ready

---

## 📝 **Next Steps**

1. **Add more users**: Authentication → Users → Add user
2. **Customize branding**: Update logo in `/resources/`
3. **Configure email notifications**: Set up email service
4. **Add mobile support**: Already responsive!
5. **Integrate reporting**: Use Supabase functions

---

## 🆘 **Troubleshooting**

### Issue: "Supabase connection failed"
- ✅ Check if you updated credentials in all files
- ✅ Verify Supabase project is not paused
- ✅ Check if anon key is correct

### Issue: "Row Level Security policy violation"
- ✅ Run the RLS policies from schema again
- ✅ Check if user is authenticated
- ✅ Verify table policies in Supabase

### Issue: "Can't upload files"
- ✅ Check if storage buckets exist
- ✅ Verify storage policies are set
- ✅ Ensure buckets are public

---

## 📞 **Support**

For issues:
1. Check Supabase docs: https://supabase.com/docs
2. Check Vercel docs: https://vercel.com/docs
3. Review database logs in Supabase dashboard

---

## 🔄 **Keeping Up to Date**

1. Star/watch your Git repository
2. Pull latest changes: `git pull origin main`
3. Redeploy on Vercel (automatic if connected to Git)

---

**Congratulations! You now have a full enterprise CMMS platform! 🎊**
