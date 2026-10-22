const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generateIcon(size) {
  // Generate RGBA buffer
  const rawData = Buffer.alloc(size * (1 + size * 4));
  
  // Center, radius, color definitions
  const center = size / 2;
  const radius = size * 0.46;
  
  for (let y = 0; y < size; y++) {
    const rowOffset = y * (1 + size * 4);
    rawData[rowOffset] = 0; // Filter byte 0 (None)
    
    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      // Rounded squircle background
      const cornerRadius = size * 0.28;
      const qx = Math.max(0, Math.abs(dx) - (center - cornerRadius));
      const qy = Math.max(0, Math.abs(dy) - (center - cornerRadius));
      const cornerDist = Math.sqrt(qx * qx + qy * qy);
      
      if (cornerDist <= cornerRadius) {
        // Gradient from indigo #4338ca to purple #7e22ce to cyan #06b6d4
        const t = (x + y) / (size * 2);
        let r = Math.round(67 + t * 59);
        let g = Math.round(56 - t * 22);
        let b = Math.round(202 + t * 53);
        
        // Draw an 'A' or lightning/algo slash symbol in white/cyan
        // Normalized coordinates in [0, 1]
        const nx = x / size;
        const ny = y / size;
        
        // Bolt / chevron symbol: (0.35, 0.25) -> (0.65, 0.48) -> (0.42, 0.52) -> (0.60, 0.78)
        let isSymbol = false;
        
        // Check if point is inside stylized 'A' / lightning bolt
        if (nx >= 0.26 && nx <= 0.74 && ny >= 0.20 && ny <= 0.80) {
          // Main stem and diagonal slash
          const distToLine1 = Math.abs((ny - 0.24) - (nx - 0.35) * 1.5);
          const distToLine2 = Math.abs((ny - 0.24) - (0.65 - nx) * 1.5);
          const isCrossbar = (ny >= 0.54 && ny <= 0.62 && nx >= 0.36 && nx <= 0.64);
          const thickness = size < 32 ? 0.16 : 0.09;
          
          if ((distToLine1 < thickness && ny <= 0.76) || (distToLine2 < thickness && ny <= 0.76) || isCrossbar) {
            isSymbol = true;
          }
        }
        
        if (isSymbol) {
          rawData[pixelOffset] = 255;     // R
          rawData[pixelOffset + 1] = 255; // G
          rawData[pixelOffset + 2] = 255; // B
          rawData[pixelOffset + 3] = 255; // A
        } else {
          // Antialiasing for outer squircle edge
          const edgeAlpha = Math.min(1, Math.max(0, cornerRadius - cornerDist + 0.8));
          rawData[pixelOffset] = r;
          rawData[pixelOffset + 1] = g;
          rawData[pixelOffset + 2] = b;
          rawData[pixelOffset + 3] = Math.round(255 * edgeAlpha);
        }
      } else {
        // Transparent
        rawData[pixelOffset] = 0;
        rawData[pixelOffset + 1] = 0;
        rawData[pixelOffset + 2] = 0;
        rawData[pixelOffset + 3] = 0;
      }
    }
  }
  
  // PNG Header
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  
  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8; // Bit depth: 8
  ihdrData[9] = 6; // Color type: 6 (RGBA)
  ihdrData[10] = 0; // Compression: deflate
  ihdrData[11] = 0; // Filter: standard
  ihdrData[12] = 0; // Interlace: none
  const ihdrChunk = createChunk('IHDR', ihdrData);
  
  // IDAT chunk
  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);
  
  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const outDir = path.join(__dirname, 'icons');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

[16, 32, 48, 128].forEach(size => {
  const png = generateIcon(size);
  const filename = path.join(outDir, `icon${size}.png`);
  fs.writeFileSync(filename, png);
  console.log(`Generated: icon${size}.png (${png.length} bytes)`);
});
