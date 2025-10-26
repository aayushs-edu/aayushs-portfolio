# 🎥 Alternative Video Hosting (Large Files 100MB+)

Cloudinary's free tier has upload size limits. Here are better options for your 124MB video:

---

## ✅ Best Options for Large Videos

### Option 1: **Bunny CDN** (RECOMMENDED - $1/month)

**Why Bunny?**
- ✅ $1/month for 100GB storage
- ✅ Accepts files up to 500GB
- ✅ Fast global CDN
- ✅ No upload limits
- ✅ Pay-as-you-go bandwidth ($0.01-0.03/GB)

**Setup (10 minutes):**

1. **Sign up:**
   - Go to: https://bunny.net
   - Create account ($1 minimum deposit with credit card)

2. **Create Storage Zone:**
   - Dashboard → Storage → "Add Storage Zone"
   - Name: `portfolio-videos`
   - Region: Choose closest to your audience
   - Click "Add Storage Zone"

3. **Upload Videos:**
   - Click your storage zone
   - Click "Upload" button
   - Upload all 3 videos (no size limit!)

4. **Get Pull Zone URL:**
   - Click "Pull Zones" tab
   - Copy the CDN URL (looks like: `https://portfolio-videos.b-cdn.net`)

5. **Your video URLs will be:**
   ```
   https://portfolio-videos.b-cdn.net/wild-west.mp4
   https://portfolio-videos.b-cdn.net/sanctuary.mp4
   https://portfolio-videos.b-cdn.net/messi.mp4
   ```

6. **Update your code** (same as before, just use Bunny URLs)

**Cost:**
- Storage: $1/month (100GB)
- Bandwidth: ~$0.30 for 1000 video views
- **Total: ~$1-2/month**

---

### Option 2: **GitHub Releases** (FREE but slower)

**Why GitHub Releases?**
- ✅ Completely FREE
- ✅ No size limits (files up to 2GB each)
- ✅ Reliable hosting
- ❌ Slower than CDN
- ❌ Rate limiting for many requests

**Setup (5 minutes):**

1. **Create a Release:**
   ```bash
   # In your repository
   git tag -a v1.0-videos -m "Video assets"
   git push origin v1.0-videos
   ```

2. **Upload Videos:**
   - Go to your GitHub repo
   - Click "Releases" → "Draft a new release"
   - Choose tag: `v1.0-videos`
   - Drag and drop your 3 video files
   - Click "Publish release"

3. **Get URLs:**
   - After publishing, right-click each video
   - Copy link address
   - URLs look like:
   ```
   https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/v1.0-videos/wild-west.mp4
   ```

4. **Update your code with GitHub URLs**

**Limitations:**
- No CDN (slower loading)
- Rate limits (5000 downloads/hour)
- Good for portfolios with <100 daily visitors

---

### Option 3: **Vimeo** (FREE + Professional)

**Why Vimeo?**
- ✅ FREE for 500MB/week upload
- ✅ Professional player
- ✅ Privacy controls
- ✅ No ads
- ✅ Good quality
- ❌ Need to embed player (not direct video)

**Setup (10 minutes):**

1. **Sign up:**
   - Go to: https://vimeo.com/join
   - Create free account

2. **Upload Videos:**
   - Click "Upload"
   - Upload your videos (one at a time due to 500MB/week limit)
   - Set privacy: "Hide from Vimeo" (if you want)

3. **Get Embed Code:**
   - Click video → Share → "Show options"
   - Enable "Responsive"
   - Copy iframe code

4. **Use in React:**
   ```tsx
   // Create a component
   function VimeoPlayer({ videoId }: { videoId: string }) {
     return (
       <div className="relative pb-[56.25%] h-0">
         <iframe
           src={`https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&loop=1&muted=1`}
           className="absolute top-0 left-0 w-full h-full"
           frameBorder="0"
           allow="autoplay; fullscreen"
         />
       </div>
     );
   }
   ```

**Pros:** Professional, free, good quality
**Cons:** Not direct video file, requires iframe

---

### Option 4: **Compress Videos** (FREE - Use ffmpeg)

Reduce video size by 70% without much quality loss.

**Install ffmpeg:**
```bash
# Windows
winget install ffmpeg

# Mac
brew install ffmpeg

# Linux
sudo apt install ffmpeg
```

**Compress videos:**
```bash
cd public/videos

# High compression for web (124MB → ~25MB)
ffmpeg -i wild-west.mp4 -c:v libx264 -crf 32 -preset slow -vf "scale=1920:-1" -c:a aac -b:a 96k wild-west-web.mp4

# Medium file (124MB → ~15MB)
ffmpeg -i wild-west.mp4 -c:v libx265 -crf 28 -preset medium -vf "scale=1280:-1" -c:a aac -b:a 64k wild-west-web.mp4

# For all videos
ffmpeg -i sanctuary.mp4 -c:v libx264 -crf 32 -preset slow -vf "scale=1920:-1" -c:a aac -b:a 96k sanctuary-web.mp4
ffmpeg -i messi.mp4 -c:v libx264 -crf 32 -preset slow -vf "scale=1920:-1" -c:a aac -b:a 96k messi-web.mp4
```

**Replace originals:**
```bash
mv wild-west-web.mp4 wild-west.mp4
mv sanctuary-web.mp4 sanctuary.mp4
mv messi-web.mp4 messi.mp4
```

**Expected results:**
- `wild-west.mp4`: 124MB → ~20-30MB
- `sanctuary.mp4`: 59MB → ~12-18MB
- `messi.mp4`: 23MB → ~5-8MB
- **Total: ~40-55MB** (might still be too large for Vercel)

Then try uploading to **Cloudinary** (now under 100MB each!)

---

### Option 5: **YouTube (Unlisted)** (FREE)

**Why YouTube?**
- ✅ Completely FREE
- ✅ Unlimited storage
- ✅ Handles any file size
- ✅ Global CDN
- ❌ YouTube branding
- ❌ Requires iframe embed

**Setup:**

1. Upload videos to YouTube as "Unlisted"
2. Get video IDs
3. Use YouTube embed:

```tsx
function YouTubeBackground({ videoId }: { videoId: string }) {
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&modestbranding=1&playlist=${videoId}`}
      className="absolute inset-0 w-full h-full object-cover"
      allow="autoplay; encrypted-media"
    />
  );
}
```

---

## 📊 Comparison

| Option | Cost | Max Size | Speed | Best For |
|--------|------|----------|-------|----------|
| **Bunny CDN** | $1-2/mo | 500GB | ⚡⚡⚡ | Production sites |
| **GitHub Releases** | FREE | 2GB | ⚡ | Low-traffic portfolios |
| **Vimeo** | FREE | 500MB/wk | ⚡⚡⚡ | Professional look |
| **Compress + Cloudinary** | FREE | 100MB each | ⚡⚡⚡ | If compression OK |
| **YouTube** | FREE | Unlimited | ⚡⚡⚡ | Don't mind branding |

---

## 🎯 My Recommendation

### For Best Performance: **Bunny CDN** ($1-2/month)
- Professional
- Fast
- No limits
- Worth the cost for a portfolio

### For Free: **Compress Videos + Cloudinary**
- Compress to ~30MB each
- Upload to Cloudinary free tier
- Good quality, fast

### Quick & Free: **GitHub Releases**
- Works immediately
- No sign-up needed (you already have GitHub)
- Good enough for portfolio

---

## 🚀 Quick Start: GitHub Releases (Fastest Free Option)

```bash
# 1. Create and push tag
git tag -a videos-v1.0 -m "Video assets"
git push origin videos-v1.0

# 2. Go to your GitHub repo → Releases → Draft new release
# 3. Choose tag: videos-v1.0
# 4. Upload your 3 videos
# 5. Publish release

# 6. Get URLs (right-click videos, copy link):
# https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/videos-v1.0/wild-west.mp4
# https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/videos-v1.0/sanctuary.mp4
# https://github.com/YOUR-USERNAME/aayushs-portfolio/releases/download/videos-v1.0/messi.mp4

# 7. Update src/app/page.tsx with these URLs
```

---

## 🛠️ Need Help?

Choose based on your priority:
- **Free + Fast setup**: GitHub Releases (5 min)
- **Free + Best quality**: Compress videos then use Cloudinary (20 min)
- **Best performance**: Bunny CDN (10 min + $1/month)
- **Most professional**: Vimeo (10 min, free)

---

Let me know which option you'd like to use and I can help you set it up! 🚀
