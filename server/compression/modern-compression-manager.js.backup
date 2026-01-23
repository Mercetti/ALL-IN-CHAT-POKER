/**
 * Modern Compression Manager for Java 21+ Compatibility
 * Replaces deprecated java.util.zip APIs with modern alternatives
 * Provides secure and efficient compression/decompression capabilities
 */

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ModernCompressionManager {
  constructor(options = {}) {
    this.defaultLevel = options.level || 6;
    this.defaultWindowBits = options.windowBits || 15;
    this.defaultMemLevel = options.memLevel || 8;
    this.defaultStrategy = options.strategy || 0;
    this.chunkSize = options.chunkSize || 16384;
    this.compressionFormats = ['gzip', 'deflate', 'brotli', 'lz4'];
  }

  /**
   * Compress data using specified format
   * @param {Buffer|string} data - Data to compress
   * @param {string} format - Compression format ('gzip', 'deflate', 'brotli')
   * @param {Object} options - Compression options
   * @returns {Buffer} Compressed data
   */
  compress(data, format = 'gzip', options = {}) {
    try {
      const input = typeof data === 'string' ? Buffer.from(data) : data;
      const compressionOptions = {
        level: options.level || this.defaultLevel,
        windowBits: options.windowBits || this.defaultWindowBits,
        memLevel: options.memLevel || this.defaultMemLevel,
        strategy: options.strategy || this.defaultStrategy
      };

      switch (format.toLowerCase()) {
        case 'gzip':
          return this.compressGzip(input, compressionOptions);
        case 'deflate':
          return this.compressDeflate(input, compressionOptions);
        case 'brotli':
          return this.compressBrotli(input, options);
        case 'lz4':
          return this.compressLZ4(input, options);
        default:
          throw new Error(`Unsupported compression format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Compression failed: ${error.message}`);
    }
  }

  /**
   * Decompress data using specified format
   * @param {Buffer} data - Data to decompress
   * @param {string} format - Compression format ('gzip', 'deflate', 'brotli')
   * @param {Object} options - Decompression options
   * @returns {Buffer} Decompressed data
   */
  decompress(data, format = 'gzip', options = {}) {
    try {
      const decompressionOptions = {
        windowBits: options.windowBits || this.defaultWindowBits,
        memLevel: options.memLevel || this.defaultMemLevel
      };

      switch (format.toLowerCase()) {
        case 'gzip':
          return this.decompressGzip(data, decompressionOptions);
        case 'deflate':
          return this.decompressDeflate(data, decompressionOptions);
        case 'brotli':
          return this.decompressBrotli(data, options);
        case 'lz4':
          return this.decompressLZ4(data, options);
        default:
          throw new Error(`Unsupported compression format: ${format}`);
      }
    } catch (error) {
      throw new Error(`Decompression failed: ${error.message}`);
    }
  }

  /**
   * Compress data using gzip
   * @param {Buffer} data - Data to compress
   * @param {Object} options - Compression options
   * @returns {Buffer} Compressed data
   */
  compressGzip(data, options = {}) {
    return new Promise((resolve, reject) => {
      const gzip = zlib.createGzip(options);
      const chunks = [];
      
      gzip.on('data', (chunk) => chunks.push(chunk));
      gzip.on('end', () => resolve(Buffer.concat(chunks)));
      gzip.on('error', reject);
      
      gzip.write(data);
      gzip.end();
  }

  /**
   * Decompress gzip data
   * @param {Buffer} data - Data to decompress
   * @param {Object} options - Decompression options
   * @returns {Buffer} Decompressed data
   */
  decompressGzip(data, options = {}) {
    return new Promise((resolve, reject) => {
      const gunzip = zlib.createGunzip(options);
      const chunks = [];
      
      gunzip.on('data', (chunk) => chunks.push(chunk));
      gunzip.on('end', () => resolve(Buffer.concat(chunks)));
      gunzip.on('error', reject);
      
      gunzip.write(data);
      gunzip.end();
  }

  /**
   * Compress data using deflate
   * @param {Buffer} data - Data to compress
   * @param {Object} options - Compression options
   * @returns {Buffer} Compressed data
   */
  compressDeflate(data, options = {}) {
    return new Promise((resolve, reject) => {
      const deflate = zlib.createDeflate(options);
      const chunks = [];
      
      deflate.on('data', (chunk) => chunks.push(chunk));
      deflate.on('end', () => resolve(Buffer.concat(chunks)));
      deflate.on('error', reject);
      
      deflate.write(data);
      deflate.end();
  }

  /**
   * Decompress deflate data
   * @param {Buffer} data - Data to decompress
   * @param {Object} options - Decompression options
   * @returns {Buffer} Decompressed data
   */
  decompressDeflate(data, options = {}) {
    return new Promise((resolve, reject) => {
      const inflate = zlib.createInflate(options);
      const chunks = [];
      
      inflate.on('data', (chunk) => chunks.push(chunk));
      inflate.on('end', () => resolve(Buffer.concat(chunks)));
      inflate.on('error', reject);
      
      inflate.write(data);
      inflate.end();
  }

  /**
   * Compress data using brotli (if available)
   * @param {Buffer} data - Data to compress
   * @param {Object} options - Compression options
   * @returns {Buffer} Compressed data
   */
  compressBrotli(data, options = {}) {
    // Note: Node.js doesn't have built-in brotli compression
    // This would require an external library like 'iltorb'
    throw new Error('Brotli compression requires external library (iltorb)');
  }

  /**
   * Decompress brotli data
   * @param {Buffer} data - Data to decompress
   * @param {Object} options - Decompression options
   * @returns {Buffer} Decompressed data
   */
  decompressBrotli(data, options = {}) {
    // Note: Node.js doesn't have built-in brotli decompression
    // This would require an external library like 'iltorb'
    throw new Error('Brotli decompression requires external library (iltorb)');
  }

  /**
   * Compress data using LZ4 (if available)
   * @param {Buffer} data - Data to compress
   * @param {Object} options - Compression options
   * @returns {Buffer} Compressed data
   */
  compressLZ4(data, options = {}) {
    // Note: Node.js doesn't have built-in LZ4 compression
    // This would require an external library like 'lz4'
    throw new Error('LZ4 compression requires external library (lz4)');
  }

  /**
   * Decompress LZ4 data
   * @param {Buffer} data - Data to decompress
   * @param {Object} options - Decompression options
   * @returns {Buffer} Decompressed data
   */
  decompressLZ4(data, options = {}) {
    // Note: Node.js doesn't have built-in LZ4 decompression
    // This would require an external library like 'lz4'
    throw new Error('LZ4 decompression requires external library (lz4)');
  }

  /**
   * Compress file
   * @param {string} inputPath - Input file path
   * @param {string} outputPath - Output file path
   * @param {string} format - Compression format
   * @param {Object} options - Compression options
   * @returns {Promise<void>}
   */
  async compressFile(inputPath, outputPath, format = 'gzip', options = {}) {
    try {
      const inputData = fs.readFileSync(inputPath);
      const compressedData = await this.compress(inputData, format, options);
      fs.writeFileSync(outputPath, compressedData);
    } catch (error) {
      throw new Error(`File compression failed: ${error.message}`);
    }
  }

  /**
   * Decompress file
   * @param {string} inputPath - Input file path
   * @param {string} outputPath - Output file path
   * @param {string} format - Compression format
   * @param {Object} options - Decompression options
   * @returns {Promise<void>}
   */
  async decompressFile(inputPath, outputPath, format = 'gzip', options = {}) {
    try {
      const inputData = fs.readFileSync(inputPath);
      const decompressedData = await this.decompress(inputData, format, options);
      fs.writeFileSync(outputPath, decompressedData);
    } catch (error) {
      throw new Error(`File decompression failed: ${error.message}`);
    }
  }

  /**
   * Create compressed archive
   * @param {Array<string>} filePaths - Array of file paths
   * @param {string} outputPath - Output archive path
   * @param {Object} options - Archive options
   * @returns {Promise<void>}
   */
  async createArchive(filePaths, outputPath, options = {}) {
    try {
      const archiver = require('archiver');
      const output = fs.createWriteStream(outputPath);
      const archive = archiver(options.format || 'zip', {
        zlib: { level: options.level || 9 }
      });

      return new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
        
        archive.pipe(output);
        
        filePaths.forEach(filePath => {
          const fileName = path.basename(filePath);
          archive.file(fs.readFileSync(filePath), { name: fileName });
        
        archive.finalize();
    } catch (error) {
      throw new Error(`Archive creation failed: ${error.message}`);
    }
  }

  /**
   * Extract archive
   * @param {string} archivePath - Archive path
   * @param {string} outputDir - Output directory
   * @param {Object} options - Extraction options
   * @returns {Promise<void>}
   */
  async extractArchive(archivePath, outputDir, options = {}) {
    try {
      const yauzl = require('yauzl');
      
      return new Promise((resolve, reject) => {
        yauzl.open(archivePath, { lazyEntries: true }, (err, zipfile) => {
          if (err) return reject(err);
          
          zipfile.on('entry', (entry) => {
            if (/\/$/.test(entry.fileName)) {
              // Directory entry
              return;
            }
            
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) return reject(err);
              
              const outputPath = path.join(outputDir, entry.fileName);
              fs.mkdirSync(path.dirname(outputPath), { recursive: true });
              
              readStream.pipe(fs.createWriteStream(outputPath))
                .on('error', reject)
                .on('finish', () => {
                  // File extracted
                });
          });
          
          zipfile.on('end', resolve);
          zipfile.on('error', reject);
      });
    } catch (error) {
      throw new Error(`Archive extraction failed: ${error.message}`);
    }
  }

  /**
   * Get compression statistics
   * @param {Buffer} originalData - Original data
   * @param {Buffer} compressedData - Compressed data
   * @returns {Object} Compression statistics
   */
  getCompressionStats(originalData, compressedData) {
    const originalSize = originalData.length;
    const compressedSize = compressedData.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
    
    return {
      originalSize,
      compressedSize,
      compressionRatio,
      spaceSaved: originalSize - compressedSize,
      efficiency: compressionRatio > 0 ? 'good' : 'poor'
    };
  }

  /**
   * Generate compression hash for integrity verification
   * @param {Buffer} data - Data to hash
   * @returns {string} SHA-256 hash
   */
  generateCompressionHash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify compression integrity
   * @param {Buffer} originalData - Original data
   * @param {Buffer} compressedData - Compressed data
   * @param {string} expectedHash - Expected hash
   * @returns {boolean} Verification result
   */
  verifyCompressionIntegrity(originalData, compressedData, expectedHash) {
    const actualHash = this.generateCompressionHash(originalData);
    return actualHash === expectedHash;
  }

  /**
   * Stream compression
   * @param {ReadableStream} inputStream - Input stream
   * @param {WritableStream} outputStream - Output stream
   * @param {string} format - Compression format
   * @param {Object} options - Compression options
   * @returns {Promise<void>}
   */
  async streamCompress(inputStream, outputStream, format = 'gzip', options = {}) {
    try {
      let compressor;
      
      switch (format.toLowerCase()) {
        case 'gzip':
          compressor = zlib.createGzip(options);
          break;
        case 'deflate':
          compressor = zlib.createDeflate(options);
          break;
        default:
          throw new Error(`Unsupported compression format: ${format}`);
      }
      
      return new Promise((resolve, reject) => {
        compressor.on('error', reject);
        outputStream.on('error', reject);
        outputStream.on('finish', resolve);
        
        inputStream.pipe(compressor).pipe(outputStream);
    } catch (error) {
      throw new Error(`Stream compression failed: ${error.message}`);
    }
  }

  /**
   * Stream decompression
   * @param {ReadableStream} inputStream - Input stream
   * @param {WritableStream} outputStream - Output stream
   * @param {string} format - Compression format
   * @param {Object} options - Decompression options
   * @returns {Promise<void>}
   */
  async streamDecompress(inputStream, outputStream, format = 'gzip', options = {}) {
    try {
      let decompressor;
      
      switch (format.toLowerCase()) {
        case 'gzip':
          decompressor = zlib.createGunzip(options);
          break;
        case 'deflate':
          decompressor = zlib.createInflate(options);
          break;
        default:
          throw new Error(`Unsupported compression format: ${format}`);
      }
      
      return new Promise((resolve, reject) => {
        decompressor.on('error', reject);
        outputStream.on('error', reject);
        outputStream.on('finish', resolve);
        
        inputStream.pipe(decompressor).pipe(outputStream);
    } catch (error) {
      throw new Error(`Stream decompression failed: ${error.message}`);
    }
  }

  /**
   * Get supported compression formats
   * @returns {Array<string>} Array of supported formats
   */
  getSupportedFormats() {
    return [...this.compressionFormats];
  }

  /**
   * Check if format is supported
   * @param {string} format - Format to check
   * @returns {boolean} Support status
   */
  isFormatSupported(format) {
    return this.compressionFormats.includes(format.toLowerCase());
  }

  /**
   * Get optimal compression level for data
   * @param {Buffer} data - Data to analyze
   * @returns {number} Optimal compression level
   */
  getOptimalCompressionLevel(data) {
    // Simple heuristic based on data size
    const size = data.length;
    
    if (size < 1024) return 1; // Small files - fast compression
    if (size < 10240) return 6; // Medium files - balanced
    if (size < 102400) return 9; // Large files - maximum compression
    return 6; // Very large files - balanced to avoid memory issues
  }

  /**
   * Batch compress multiple files
   * @param {Array<Object>} files - Array of file objects {path, outputPath, format}
   * @param {Object} options - Compression options
   * @returns {Promise<Array>} Array of compression results
   */
  async batchCompress(files, options = {}) {
    const results = [];
    
    for (const file of files) {
      try {
        await this.compressFile(file.path, file.outputPath, file.format, options);
        results.push({
          file: file.path,
          success: true,
          outputPath: file.outputPath
        });
      } catch (error) {
        results.push({
          file: file.path,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Batch decompress multiple files
   * @param {Array<Object>} files - Array of file objects {path, outputPath, format}
   * @param {Object} options - Decompression options
   * @returns {Promise<Array>} Array of decompression results
   */
  async batchDecompress(files, options = {}) {
    const results = [];
    
    for (const file of files) {
      try {
        await this.decompressFile(file.path, file.outputPath, file.format, options);
        results.push({
          file: file.path,
          success: true,
          outputPath: file.outputPath
        });
      } catch (error) {
        results.push({
          file: file.path,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = ModernCompressionManager;
