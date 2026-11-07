const fs = require('fs');
const path = require('path');

const files = ['Immobilier.tsx', 'Mining.tsx', 'Print.tsx', 'Transit.tsx'];

files.forEach(file => {
  const filePath = path.join(__dirname, 'src', 'pages', 'filiales', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add useMemo to imports if not there
    if (!content.includes('useMemo')) {
      content = content.replace(/import {([^}]*)} from 'react';/, (match, p1) => {
        if (p1.trim() === '') return `import { useMemo } from 'react';`;
        return `import {${p1}, useMemo } from 'react';`;
      });
    }

    // Match the specific useQuery block for realisations
    const regex = /const \{\s*data:\s*realisations\s*=\s*\[\]\s*\}\s*=\s*useQuery\(\{[\s\S]*?queryKey:\s*\['galerie',\s*'[^']+'\],[\s\S]*?queryFn:\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\},[\s\S]*?\}\);/g;
    
    const replacement = `const realisations = useMemo(() => {
    if (content?.realisations) {
      try {
        const parsed = typeof content.realisations === 'string' ? JSON.parse(content.realisations) : content.realisations;
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Error parsing realisations JSON');
      }
    }
    return [];
  }, [content?.realisations]);`;

    const newContent = content.replace(regex, replacement);
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated ' + file);
    } else {
      console.log('No change in ' + file);
    }
  }
});
