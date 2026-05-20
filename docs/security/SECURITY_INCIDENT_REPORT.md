# 🔒 Security Incident Report - GitGuardian Alert

**Date:** 2026-01-12  
**Commit:** `0ccce4c`  
**Alert Type:** Generic High Entropy Secret  
**Severity:** HIGH

---

## 📋 Executive Summary

GitGuardian detected a hardcoded API key in your codebase. The secret has been identified and removed from the current code. Immediate action is required to rotate the leaked key and clean Git history.

---

## 🔍 Secret Detection Results

### ✅ Secret Found

**File:** `supabase/functions/extract-contract-data-v2/index.ts`  
**Line:** 119  
**Variable:** `apiKey`  
**Service:** OCR.space API  
**Key Pattern:** `[REDACTED]`

**Risk Level:** HIGH  
**Service at Risk:** OCR.space API (Free tier key with 500 requests/day limit)

### 📝 Context

The secret was hardcoded as a fallback value:
```typescript
const apiKey = Deno.env.get('OCR_SPACE_API_KEY') || '[REDACTED]';
```

This means:
- If the environment variable is not set, the hardcoded key is used
- The key is visible in Git history
- Anyone with repository access can see and use this key

---

## ✅ Immediate Actions Taken

1. ✅ **Removed hardcoded secret** from `supabase/functions/extract-contract-data-v2/index.ts`
   - Changed to require environment variable
   - Added error handling if key is missing

---

## 🚨 Required Actions

### Step 1: Rotate/Invalidate the Leaked Key

**OCR.space API Key Rotation:**

1. **Log in to OCR.space:**
   - Go to https://ocr.space/ocrapi/freekey
   - Or contact OCR.space support if you have a paid account

2. **Generate a new API key:**
   - Request a new free tier key (if using free tier)
   - Or regenerate your existing key from the dashboard

3. **Update Supabase secrets:**
   ```bash
   supabase secrets set OCR_SPACE_API_KEY=your_new_key_here
   ```

4. **Verify the old key is invalid:**
   - The old OCR.space key should stop working
   - Test with a new request to confirm

**Note:** If this is a free tier key, you may need to:
- Request a new key from OCR.space
- Or upgrade to a paid plan for better security controls

---

### Step 2: Clean Git History

The secret is still visible in Git history. You must remove it from all commits.

#### Option A: Using git filter-branch (Recommended for small repos)

```bash
# Backup your repository first!
git clone --mirror . ../emlak-crm-backup

# Remove the secret from all commits
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch supabase/functions/extract-contract-data-v2/index.ts && \
   git checkout HEAD -- supabase/functions/extract-contract-data-v2/index.ts" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remote (WARNING: This rewrites history)
git push origin --force --all
git push origin --force --tags
```

#### Option B: Using BFG Repo-Cleaner (Easier, faster)

```bash
# Install BFG (if not installed)
# macOS: brew install bfg
# Or download from: https://rtyley.github.io/bfg-repo-cleaner/

# Create a file with the secret to remove
echo '[REDACTED]' > secrets-to-remove.txt

# Clean the repository
bfg --replace-text secrets-to-remove.txt

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

#### Option C: Manual History Rewrite (For specific commit only)

If you only want to fix commit `0ccce4c`:

```bash
# Interactive rebase
git rebase -i 0ccce4c^1

# In the editor, change 'pick' to 'edit' for commit 0ccce4c
# Then fix the file and amend:
git add supabase/functions/extract-contract-data-v2/index.ts
git commit --amend --no-edit
git rebase --continue

# Force push
git push origin --force
```

**⚠️ IMPORTANT WARNINGS:**
- **Backup your repository** before rewriting history
- **Coordinate with your team** - everyone will need to re-clone
- **Update all forks/clones** - they'll need to reset to new history
- **Force pushing rewrites history** - make sure you have backups

---

### Step 3: Verify No Other Secrets

Run these checks to ensure no other secrets exist:

```bash
# Check for common secret patterns
git log --all --source --full-history -p | grep -E "(api[_-]?key|secret|password|token)" -i

# Check for high entropy strings (JWT tokens, API keys)
git log --all -p | grep -E "eyJ[A-Za-z0-9_-]{20,}"

# Check for Supabase keys
git log --all -p | grep -E "SUPABASE.*KEY|supabase.*key"

# Check for Stripe keys
git log --all -p | grep -E "sk_[a-zA-Z0-9]{20,}|pk_[a-zA-Z0-9]{20,}"
```

---

## 📝 Prevention Measures

### 1. Add `.env` to `.gitignore`

Ensure these files are ignored:
```
.env
.env.local
.env.*.local
*.env
```

### 2. Use GitGuardian Pre-commit Hook

Install GitGuardian CLI to prevent future commits:

```bash
# Install GitGuardian CLI
pip install ggshield

# Set up pre-commit hook
ggshield install

# Scan before committing
ggshield scan pre-commit
```

### 3. Use Environment Variables Only

**Never hardcode secrets, even as fallbacks:**

❌ **BAD:**
```typescript
const apiKey = Deno.env.get('API_KEY') || 'hardcoded_fallback';
```

✅ **GOOD:**
```typescript
const apiKey = Deno.env.get('API_KEY');
if (!apiKey) {
  throw new Error('API_KEY environment variable is required');
}
```

### 4. Use Supabase Secrets for Edge Functions

Always use Supabase secrets for Edge Functions:

```bash
# Set secrets (never commit them)
supabase secrets set OCR_SPACE_API_KEY=your_key_here
supabase secrets set GOOGLE_CLOUD_API_KEY=your_key_here
```

### 5. Regular Security Audits

- Run `ggshield scan` before each release
- Review GitGuardian alerts immediately
- Rotate keys periodically (every 90 days)

---

## 📊 Impact Assessment

### Current Status
- ✅ Secret removed from current code
- ⚠️ Secret still visible in Git history
- ⚠️ Key may still be active (needs rotation)

### Potential Risks
1. **API Abuse:** Someone could use your OCR.space quota
2. **Cost Impact:** If upgraded to paid plan, unauthorized usage could incur costs
3. **Service Disruption:** Key abuse could lead to rate limiting or account suspension

### Mitigation
- Rotate the key immediately
- Monitor OCR.space API usage for suspicious activity
- Clean Git history to prevent future exposure

---

## ✅ Checklist

- [x] Secret identified and removed from current code
- [ ] OCR.space API key rotated/invalidated
- [ ] Supabase secret updated with new key
- [ ] Git history cleaned (secret removed from all commits)
- [ ] Team notified about history rewrite
- [ ] All forks/clones updated
- [ ] GitGuardian pre-commit hook installed
- [ ] Security scan completed (no other secrets found)
- [ ] Documentation updated with security best practices

---

## 📞 Support Contacts

- **OCR.space Support:** https://ocr.space/ocrapi
- **GitGuardian Support:** https://docs.gitguardian.com
- **Supabase Secrets Docs:** https://supabase.com/docs/guides/functions/secrets

---

**Report Generated:** 2026-01-12  
**Next Review:** After key rotation and history cleanup
