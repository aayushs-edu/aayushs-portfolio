@echo off
REM Video Compression Script for Windows
REM Compresses videos to work with Cloudinary free tier (under 100MB)

echo ============================================
echo Video Compression Script
echo ============================================
echo.
echo This will compress your videos to ~70%% smaller
echo while maintaining good quality.
echo.
echo Requirements: ffmpeg installed
echo.
pause

cd public\videos

echo.
echo Compressing wild-west.mp4 (124MB → ~30MB)...
ffmpeg -i wild-west.mp4 -c:v libx264 -crf 28 -preset slow -vf "scale=1920:-1" -c:a aac -b:a 128k wild-west-compressed.mp4
if %errorlevel% neq 0 (
    echo ERROR: Failed to compress wild-west.mp4
    echo Make sure ffmpeg is installed: winget install ffmpeg
    pause
    exit /b 1
)

echo.
echo Compressing sanctuary.mp4 (59MB → ~15MB)...
ffmpeg -i sanctuary.mp4 -c:v libx264 -crf 28 -preset slow -vf "scale=1920:-1" -c:a aac -b:a 128k sanctuary-compressed.mp4
if %errorlevel% neq 0 (
    echo ERROR: Failed to compress sanctuary.mp4
    pause
    exit /b 1
)

echo.
echo Compressing messi.mp4 (23MB → ~6MB)...
ffmpeg -i messi.mp4 -c:v libx264 -crf 28 -preset slow -vf "scale=1920:-1" -c:a aac -b:a 128k messi-compressed.mp4
if %errorlevel% neq 0 (
    echo ERROR: Failed to compress messi.mp4
    pause
    exit /b 1
)

echo.
echo ============================================
echo Compression Complete!
echo ============================================
echo.
echo Original files backed up with .original extension
echo.

REM Backup originals
ren wild-west.mp4 wild-west.mp4.original
ren sanctuary.mp4 sanctuary.mp4.original
ren messi.mp4 messi.mp4.original

REM Use compressed versions
ren wild-west-compressed.mp4 wild-west.mp4
ren sanctuary-compressed.mp4 sanctuary.mp4
ren messi-compressed.mp4 messi.mp4

echo.
dir *.mp4
echo.
echo ============================================
echo Next Steps:
echo 1. Upload these compressed videos to Cloudinary
echo 2. They should now be under 100MB each
echo 3. Original files saved as *.mp4.original
echo ============================================
echo.
pause
