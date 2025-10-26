#!/usr/bin/env node
/**
 * Image Optimization Script
 * Converts JPG/JPEG/PNG images to WebP format for better performance
 *
 * Usage:
 *   node scripts/convert-images-to-webp.js
 *
 * Requirements:
 *   npm install sharp
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Directories to process
const directories = [
  'public/images',
  'public/paintings'
];

// Image extensions to convert
const imageExtensions = ['.jpg', '.jpeg', '.png', '.JPG', '.JPEG', '.PNG'];

// WebP quality (0-100, higher = better quality but larger file)
const WEBP_QUALITY = 85;

async function convertImage(inputPath, outputPath) {
  try {
    const stats = fs.statSync(inputPath);
    const inputSizeMB = (stats.size / 1024 / 1024).toFixed(2);

    await sharp(inputPath)
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath);

    const outputStats = fs.statSync(outputPath);
    const outputSizeMB = (outputStats.size / 1024 / 1024).toFixed(2);
    const savings = ((1 - outputStats.size / stats.size) * 100).toFixed(1);

    console.log(`✓ ${path.basename(inputPath)} → ${path.basename(outputPath)}`);
    console.log(`  ${inputSizeMB}MB → ${outputSizeMB}MB (${savings}% smaller)\n`);

    return {
      success: true,
      inputSize: stats.size,
      outputSize: outputStats.size,
      savings: stats.size - outputStats.size
    };
  } catch (error) {
    console.error(`✗ Failed to convert ${inputPath}:`, error.message);
    return { success: false };
  }
}

async function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠ Directory not found: ${dir}`);
    return [];
  }

  const files = fs.readdirSync(dir);
  const results = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively process subdirectories
      const subResults = await processDirectory(filePath);
      results.push(...subResults);
    } else {
      const ext = path.extname(file);
      if (imageExtensions.includes(ext)) {
        const outputPath = filePath.replace(new RegExp(`${ext}$`), '.webp');

        // Skip if WebP already exists and is newer
        if (fs.existsSync(outputPath)) {
          const outputStat = fs.statSync(outputPath);
          if (outputStat.mtime > stat.mtime) {
            console.log(`⊘ Skipping ${file} (WebP already exists and is newer)`);
            continue;
          }
        }

        const result = await convertImage(filePath, outputPath);
        if (result.success) {
          results.push(result);
        }
      }
    }
  }

  return results;
}

async function main() {
  console.log('🖼️  Image Optimization Script\n');
  console.log('Converting images to WebP format...\n');

  let totalResults = [];

  for (const dir of directories) {
    console.log(`\n📁 Processing ${dir}...`);
    const results = await processDirectory(dir);
    totalResults.push(...results);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));

  if (totalResults.length === 0) {
    console.log('No images were converted.');
  } else {
    const totalSavings = totalResults.reduce((sum, r) => sum + r.savings, 0);
    const totalSavingsMB = (totalSavings / 1024 / 1024).toFixed(2);

    console.log(`✓ Converted ${totalResults.length} images`);
    console.log(`💾 Total space saved: ${totalSavingsMB}MB`);
  }

  console.log('\n✨ Done!\n');
}

// Check if sharp is installed
try {
  require.resolve('sharp');
  main();
} catch (e) {
  console.error('❌ Error: sharp package not found');
  console.error('Please install it by running: npm install sharp');
  process.exit(1);
}
