# 🎥 Video Deployment Guide for Vercel

## ⚠️ Problem

Your videos are **205MB total** which exceeds Vercel's limits:
- `wild-west.mp4` - 124MB
- `sanctuary.mp4` - 59MB
- `messi.mp4` - 23MB

Vercel deployment size limit is **~50MB** for the entire app.

## ✅ Solutions

### Option 1: Host on Cloudinary (Recommended - FREE)

**Why Cloudinary?**
- ✅ Free tier: 25GB storage + 25GB bandwidth/month
- ✅ Automatic video optimization
- ✅ Global CDN (faster loading worldwide)
- ✅ Automatic format conversion (WebM, MP4)
- ✅ Easy to set up

**Steps:**

1. **Sign up for Cloudinary**
   - Go to https://cloudinary.com/users/register_free
   - Create a free account

2. **Upload your videos**
   ```bash
   # In Cloudinary dashboard:
   # - Click "Media Library"
   # - Click "Upload"
   # - Drag your videos: wild-west.mp4, sanctuary.mp4, messi.mp4
   ```

3. **Get video URLs**
   - After upload, click each video
   - Copy the "Secure URL"
   - Should look like: `https://res.cloudinary.com/your-cloud-name/video/upload/v1234567890/wild-west.mp4`

4. **Update your code**
   ```tsx
   // In src/app/page.tsx and src/app/animation/page.tsx
   const videos = [
     {
       src: "https://res.cloudinary.com/YOUR_CLOUD_NAME/video/upload/v1234567890/wild-west.mp4",
       title: "Wild West Showdown",
       year: "2025",
       poster: "/images/view0.jpg"
     },
     // ... etc
   ];
   ```

5. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "Use Cloudinary for video hosting"
   git push
   ```

---

### Option 2: Use Vercel Blob Storage

**Why Vercel Blob?**
- ✅ Integrated with Vercel
- ✅ Simple to use
- ❌ Paid ($0.15/GB stored + $0.20/GB bandwidth)

**Steps:**

1. **Install Vercel Blob**
   ```bash
   npm install @vercel/blob
   ```

2. **Upload videos via CLI**
   ```bash
   npx vercel blob upload public/videos/wild-west.mp4
   npx vercel blob upload public/videos/sanctuary.mp4
   npx vercel blob upload public/videos/messi.mp4
   ```

3. **Use the returned URLs in your code**

---

### Option 3: Compress Videos (Quick Fix)

Reduce video file sizes by 50-70% without much quality loss.

**Install ffmpeg** (one-time):
- Windows: `winget install ffmpeg` or download from https://ffmpeg.org/
- Mac: `brew install ffmpeg`
- Linux: `sudo apt install ffmpeg`

**Compress videos:**
```bash
# Navigate to videos directory
cd public/videos

# Compress wild-west.mp4 (124MB → ~40MB)
ffmpeg -i wild-west.mp4 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k wild-west-compressed.mp4

# Compress sanctuary.mp4 (59MB → ~20MB)
ffmpeg -i sanctuary.mp4 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k sanctuary-compressed.mp4

# Compress messi.mp4 (23MB → ~8MB)
ffmpeg -i messi.mp4 -c:v libx264 -crf 28 -preset slow -c:a aac -b:a 128k messi-compressed.mp4
```

**Replace original files:**
```bash
mv wild-west-compressed.mp4 wild-west.mp4
mv sanctuary-compressed.mp4 sanctuary.mp4
mv messi-compressed.mp4 messi.mp4
```

**Total size:** ~68MB (still might be too large, but much better)

---

### Option 4: YouTube Embed (Alternative)

Upload videos to YouTube (unlisted) and embed them.

**Pros:**
- ✅ Free unlimited hosting
- ✅ YouTube's CDN
- ✅ Automatic quality adaptation

**Cons:**
- ❌ YouTube branding
- ❌ Less control over player

---

## 🎯 Recommended Solution

**Use Cloudinary** (Option 1) - It's free, fast, and professional.

### Quick Setup Script

I've created a script to help you migrate to Cloudinary:

```bash
# Will be created in next message
npm run migrate:videos
```

---

## 🔧 After Changing Video URLs

**Test locally:**
```bash
npm run dev
# Check http://localhost:3000/animation
```

**Deploy to Vercel:**
```bash
git add .
git commit -m "Move videos to Cloudinary"
git push
```

---

## 📊 Size Comparison

| Solution | Storage Cost | Bandwidth | Speed | Ease |
|----------|--------------|-----------|-------|------|
| **Cloudinary** | Free (25GB) | Free (25GB/mo) | ⚡⚡⚡ | ⭐⭐⭐ |
| Vercel Blob | $0.15/GB | $0.20/GB | ⚡⚡⚡ | ⭐⭐⭐ |
| Compressed Local | Free | Vercel limits | ⚡⚡ | ⭐⭐ |
| YouTube | Free | Unlimited | ⚡⚡⚡ | ⭐⭐ |

---

## ❓ FAQ

**Q: Why can't I just upload to Vercel?**
A: Vercel has deployment size limits (~50MB). Your videos alone are 205MB.

**Q: Will Cloudinary slow down my site?**
A: No! Cloudinary uses a global CDN and is often faster than hosting locally.

**Q: What about other video hosts?**
A: You can also use:
- AWS S3 + CloudFront
- Google Cloud Storage
- Bunny CDN
- ImageKit.io

**Q: Can I keep one video local?**
A: Yes! Keep the smallest one (messi.mp4 - 23MB) local if you want.

---

## 🚀 Next Steps

1. Choose your solution (I recommend Cloudinary)
2. Follow the steps above
3. Update video URLs in your code
4. Test locally
5. Deploy to Vercel

Your videos will load faster and your deployments will succeed! 🎉
