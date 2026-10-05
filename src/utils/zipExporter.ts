// Pure client-side ZIP file builder conforming to PKZIP 2.0 specification
// Produces standard .zip archives readable by Android AIDE, WinZip, 7-Zip, macOS, and Linux unzip.

interface ZipEntry {
  name: string;
  data: Uint8Array;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function calculateCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export class SimpleZipBuilder {
  private entries: ZipEntry[] = [];

  public addFile(path: string, content: string | Uint8Array) {
    const data =
      typeof content === 'string' ? new TextEncoder().encode(content) : content;
    // Standardize path with forward slashes and no leading slash
    const cleanPath = path.replace(/^[/\\]+/, '').replace(/\\/g, '/');
    this.entries.push({ name: cleanPath, data });
  }

  public generateZipBlob(): Blob {
    let localHeadersSize = 0;
    let centralDirSize = 0;

    const fileMeta: Array<{
      entry: ZipEntry;
      nameBytes: Uint8Array;
      crc: number;
      offset: number;
    }> = [];

    // Measure offsets
    let currentOffset = 0;
    for (const entry of this.entries) {
      const nameBytes = new TextEncoder().encode(entry.name);
      const crc = calculateCrc32(entry.data);
      fileMeta.push({ entry, nameBytes, crc, offset: currentOffset });

      const localHeaderLen = 30 + nameBytes.length + entry.data.length;
      currentOffset += localHeaderLen;
      localHeadersSize += localHeaderLen;

      const centralHeaderLen = 46 + nameBytes.length;
      centralDirSize += centralHeaderLen;
    }

    const endOfCentralDirLen = 22;
    const totalSize = localHeadersSize + centralDirSize + endOfCentralDirLen;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const byteView = new Uint8Array(buffer);

    let pos = 0;

    // 1. Write Local File Headers & Data
    for (const item of fileMeta) {
      // Local file header signature = 0x04034b50
      view.setUint32(pos, 0x04034b50, true);
      view.setUint16(pos + 4, 20, true); // Version needed to extract (2.0)
      view.setUint16(pos + 6, 0x0800, true); // General purpose bit flag (UTF-8)
      view.setUint16(pos + 8, 0, true); // Compression method (0 = STORE)
      view.setUint16(pos + 10, 0, true); // Last mod file time
      view.setUint16(pos + 12, 0, true); // Last mod file date
      view.setUint32(pos + 14, item.crc, true); // CRC-32
      view.setUint32(pos + 18, item.entry.data.length, true); // Compressed size
      view.setUint32(pos + 22, item.entry.data.length, true); // Uncompressed size
      view.setUint16(pos + 26, item.nameBytes.length, true); // File name length
      view.setUint16(pos + 28, 0, true); // Extra field length

      pos += 30;
      byteView.set(item.nameBytes, pos);
      pos += item.nameBytes.length;

      byteView.set(item.entry.data, pos);
      pos += item.entry.data.length;
    }

    const centralDirOffset = pos;

    // 2. Write Central Directory Headers
    for (const item of fileMeta) {
      // Central directory header signature = 0x02014b50
      view.setUint32(pos, 0x02014b50, true);
      view.setUint16(pos + 4, 20, true); // Version made by
      view.setUint16(pos + 6, 20, true); // Version needed to extract
      view.setUint16(pos + 8, 0x0800, true); // General purpose bit flag (UTF-8)
      view.setUint16(pos + 10, 0, true); // Compression method
      view.setUint16(pos + 12, 0, true); // Last mod time
      view.setUint16(pos + 14, 0, true); // Last mod date
      view.setUint32(pos + 16, item.crc, true); // CRC-32
      view.setUint32(pos + 20, item.entry.data.length, true); // Compressed size
      view.setUint32(pos + 24, item.entry.data.length, true); // Uncompressed size
      view.setUint16(pos + 28, item.nameBytes.length, true); // File name length
      view.setUint16(pos + 30, 0, true); // Extra field length
      view.setUint16(pos + 32, 0, true); // File comment length
      view.setUint16(pos + 34, 0, true); // Disk number start
      view.setUint16(pos + 36, 0, true); // Internal file attributes
      view.setUint32(pos + 38, 0, true); // External file attributes
      view.setUint32(pos + 42, item.offset, true); // Relative offset of local header

      pos += 46;
      byteView.set(item.nameBytes, pos);
      pos += item.nameBytes.length;
    }

    const centralDirLength = pos - centralDirOffset;

    // 3. Write End of Central Directory Record
    view.setUint32(pos, 0x06054b50, true); // Signature
    view.setUint16(pos + 4, 0, true); // Disk number
    view.setUint16(pos + 6, 0, true); // Disk with central directory
    view.setUint16(pos + 8, this.entries.length, true); // Number of central directory records on this disk
    view.setUint16(pos + 10, this.entries.length, true); // Total central directory records
    view.setUint32(pos + 12, centralDirLength, true); // Size of central directory
    view.setUint32(pos + 16, centralDirOffset, true); // Offset of start of central directory
    view.setUint16(pos + 20, 0, true); // Comment length

    return new Blob([buffer], { type: 'application/zip' });
  }
}

export function downloadZip(blob: Blob, filename = 'aurawave-project.zip') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
  }, 30000);
}
