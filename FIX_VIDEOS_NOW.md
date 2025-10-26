# 🎥 Fix Videos on Vercel - COMPLETE GUIDE

Your videos are **too large for Cloudinary free tier** (wild-west.mp4 is 124MB).

## 🚀 FASTEST Solution: GitHub Releases (5 minutes, FREE)

This is the quickest way to get your videos working:

### Step 1: Create a Release
```bash
# In your terminal
git tag -a videos-v1.0 -m "Video assets"
git push origin videos-v1.0
```

### Step 2: Upload Videos to GitHub
1. Go to your GitHub repository
2. Click **"Releases"** (right side)
3. Click **"Draft a new release"**
4. Choose tag: **videos-v1.0**
5. Drag and drop your 3 videos from `public/videos/`:
   - wild-west.mp4
   - sanctuary.mp4
   - messi.mp4
6. Click **"Publish release"**

### Step 3: Get URLs
After publishing, **right-click each video** → **Copy link address**

You'll get URLs like:
```
https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/videos-v1.0/wild-west.mp4
https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/videos-v1.0/sanctuary.mp4
https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/videos-v1.0/messi.mp4
```

### Step 4: Update Your Code

**File 1:** `src/app/page.tsx` (around line 699)
```tsx
const videos = [
  {
    src: "https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/videos-v1.0/wild-west.mp4",
    title: "Wild West Showdown",
    year: "2025",
    poster: "/images/view0.webp"
  },
  {
    src: "https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/videos-v1.0/sanctuary.mp4",
    title: "Sanctuary",
    year: "2023",
    poster: "/images/Sanctuary.webp"
  },
  {
    src: "https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/videos-v1.0/messi.mp4",
    title: "Messi Tribute",
    year: "2024",
    poster: "/images/Messi.webp"
  }
];
```

**File 2:** `src/app/animation/page.tsx` (around line 33)
```tsx
const videos = [
  {
    id: 1,
    src: "https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/videos-v1.0/wild-west.mp4",
    poster: "/images/video-poster-1.webp",
    title: "Wild West",
    year: "2024"
  },
  {
    id: 2,
    src: "https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/videos-v1.0/messi.mp4",
    poster: "/images/video-poster-2.webp",
    title: "Soccer Star",
    year: "2024"
  },
  {
    id: 3,
    src: "https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/videos-v1.0/sanctuary.mp4",
    poster: "/images/sanctuary.webp",
    title: "Sanctuary",
    year: "2023"
  },
];
```

### Step 5: Deploy
```bash
git add .
git commit -m "Use GitHub Releases for video hosting"
git push
```

**Done!** ✅ Videos will now work on Vercel!

---

## ⚡ BETTER Solution: Compress + Cloudinary (15 minutes, FREE)

Compress videos to under 100MB, then use Cloudinary.

### Step 1: Install ffmpeg

**Windows:**
```bash
winget install ffmpeg
```

**Mac:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

### Step 2: Run Compression Script

**Windows:**
```bash
scripts\compress-videos.bat
```

**Mac/Linux:**
```bash
chmod +x scripts/compress-videos.sh
./scripts/compress-videos.sh
```

This will:
- Compress wild-west.mp4 from 124MB → ~30MB
- Compress sanctuary.mp4 from 59MB → ~15MB
- Compress messi.mp4 from 23MB → ~6MB
- Backup originals as `*.mp4.original`

### Step 3: Upload to Cloudinary
1. Go to https://cloudinary.com (sign up if needed)
2. Upload your **compressed** videos
3. Get the URLs
4. Update your code (same as before)

---

## 💰 BEST Solution: Bunny CDN (10 minutes, $1/month)

Best performance, no size limits.

### Setup:
1. **Sign up:** https://bunny.net
2. **Create Storage Zone:** Name it `portfolio-videos`
3. **Upload** all 3 videos (no compression needed!)
4. **Get URLs:** `https://portfolio-videos.b-cdn.net/wild-west.mp4`
5. **Update code** with Bunny URLs

**Cost:** ~$1-2/month (worth it for professional site)

---

## 📊 Which Should You Choose?

| Method | Time | Cost | Speed | Quality |
|--------|------|------|-------|---------|
| **GitHub Releases** | 5 min | FREE | ⚡ OK | ✅ Original |
| **Compress + Cloudinary** | 15 min | FREE | ⚡⚡⚡ Fast | ✅ Good |
| **Bunny CDN** | 10 min | $1/mo | ⚡⚡⚡ Fast | ✅ Original |

### My Recommendation:
- **Starting out?** → GitHub Releases (quickest)
- **Want best free option?** → Compress + Cloudinary
- **Professional portfolio?** → Bunny CDN (worth the $1)

---

## ⚠️ Why This Happened

- **Vercel deployment limit:** ~50MB total
- **Your videos:** 205MB total
- **Cloudinary free upload limit:** 100MB per file
- **Your largest video:** 124MB (too big for Cloudinary)

**Solution:** Either compress OR use a different host (GitHub/Bunny)

---

## 📝 Quick Reference

**Replace YOUR-USERNAME with your actual GitHub username!**

Example:
```
If your GitHub is: github.com/aayushs-edu/aayushs-portfolio
Then YOUR-USERNAME is: aayushs-edu

URL becomes:
https://github.com/aayushs-edu/aayushs-portfolio/releases/download/videos-v1.0/wild-west.mp4
```

---

## 🆘 Troubleshooting

**Videos still not loading?**
- Check browser console for exact error
- Verify URLs are correct (no typos)
- Make sure CORS is allowed (GitHub Releases allow it by default)

**ffmpeg not found?**
- Windows: Restart terminal after installing
- Mac: Run `brew install ffmpeg`
- Verify: `ffmpeg -version`

**Compressed videos look bad?**
- Adjust CRF value in script (lower = better quality, bigger file)
- Default is 28 (good balance)
- Try 24 for higher quality (larger files)

---

## 🎯 Next Steps

1. **Choose your method** (I recommend GitHub Releases for now)
2. **Follow the steps** above
3. **Test locally** (`npm run dev`)
4. **Deploy** (`git push`)
5. **Success!** 🎉

Need help? See the full guides:
- [ALTERNATIVE_VIDEO_HOSTING.md](./ALTERNATIVE_VIDEO_HOSTING.md) - All options explained
- [VIDEO_DEPLOYMENT_GUIDE.md](./VIDEO_DEPLOYMENT_GUIDE.md) - Original guide

---

**Choose one method and let's get your videos working!** 🚀
