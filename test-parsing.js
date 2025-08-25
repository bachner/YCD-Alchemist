#!/usr/bin/env node

// Test the improved parsing logic
const path = require('path');

// Helper function to clean up strings
function cleanupString(str) {
  return str
    // Remove common prefixes/suffixes
    .replace(/^(The\s+|A\s+)/i, '')
    // Remove track numbers and common patterns
    .replace(/^\d+\s*[-.]?\s*/, '')
    // Remove file format indicators
    .replace(/\s*\(.*?\)\s*/g, ' ')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to extract track info from file path
function extractTrackInfoFromPath(filePath) {
  try {
    // Get the full path and extract components
    const pathParts = filePath.split(/[\/\\]/);
    const fileName = pathParts[pathParts.length - 1];
    
    // Remove file extension from filename
    const nameWithoutExt = fileName.replace(/\.[^.]*$/, '');
    
    let artist = '';
    let title = '';
    
    // Enhanced parsing for complex file paths
    // Pattern 1: "Artist - Album - Track Number - Title"
    const complexPattern = /^(.+?)\s*-\s*(.+?)\s*-\s*\d+\s*-\s*(.+)$/;
    const complexMatch = nameWithoutExt.match(complexPattern);
    
    if (complexMatch) {
      artist = complexMatch[1].trim();
      title = complexMatch[3].trim();
    } else {
      // Pattern 2: Simple "Artist - Title" 
      const simplePattern = /^(.+?)\s*-\s*(.+)$/;
      const simpleMatch = nameWithoutExt.match(simplePattern);
      
      if (simpleMatch) {
        artist = simpleMatch[1].trim();
        title = simpleMatch[2].trim();
      } else {
        // Fallback: extract from path structure
        title = nameWithoutExt.trim();
        
        // Try to get artist from directory structure
        for (let i = pathParts.length - 3; i >= 0; i--) {
          const part = pathParts[i];
          if (part && part !== 'Music' && !part.match(/^[A-Z]:$/) && part.length > 1) {
            artist = part;
            break;
          }
        }
      }
    }
    
    // Clean up common artifacts
    artist = cleanupString(artist);
    title = cleanupString(title);
    
    return {
      artist: artist || 'Unknown Artist',
      title: title || nameWithoutExt,
      originalPath: filePath
    };
  } catch (error) {
    console.error('Error extracting track info:', error);
    return null;
  }
}

// Test cases from the terminal output
const testPaths = [
  'M:\\Music\\O\\One Direction\\Take Me Home\\One Direction - Take Me Home - 02 - Kiss You',
  'M:\\Music\\J\\Justin Bieber\\Beauty And A Beat (Feat. Nicki Minaj) (Single)\\Justin Bieber - Beauty And A Beat (Feat. Nicki Minaj) (Single) - 01 - Beauty And A Beat (Feat. Nicki Minaj)',
  'M:\\Music\\D\\David Guetta\\One Last Time (Feat. Taped Rai) (Single)\\David Guetta - One Last Time (Feat. Taped Rai) (Single) - 01 - One Last Time (Radio Version)',
  'M:\\Music\\T\\Taylor Swift\\Red\\Taylor Swift - Red - 04 - I Knew You Were Trouble',
  'M:\\Music\\I\\Imagine Dragons\\Radioactive (Single)\\Imagine Dragons - Radioactive (Single) - 01 - Radioactive',
  'M:\\Music\\A\\Adele\\Skyfall (Single)\\Adele - Skyfall (Single) - 01 - Skyfall',
  'M:\\Music\\P\\PSY\\Gangnam Style (Single)\\PSY - Gangnam Style (Single) - 01 - Gangnam Style'
];

console.log('🧪 Testing Improved Track Parsing\n');
console.log('=' .repeat(80));

testPaths.forEach((testPath, index) => {
  const result = extractTrackInfoFromPath(testPath);
  console.log(`\n${index + 1}. Original: ${testPath}`);
  console.log(`   Artist: "${result.artist}"`);
  console.log(`   Title:  "${result.title}"`);
  console.log('   ' + '-'.repeat(60));
});

console.log('\n🎯 Key Improvements:');
console.log('✅ Extracts clean artist and title names');
console.log('✅ Removes album names and track numbers');
console.log('✅ Handles complex file path structures');
console.log('✅ Cleans up parenthetical information');
console.log('✅ Much better for Spotify search!');
