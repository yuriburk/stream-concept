const stream = require('stream');

const { PassThrough } = stream;

class ThrottleStream extends PassThrough {
  constructor(options) {
    super(options);
    this.rateBytesPerMs = ((options.rateMBps || 1.0) * 1024 * 1024) / 1000;
    this.interval = 1;
    this.lastWrite = Date.now();
    this.totalBytesSent = 0;
    this.totalSize = options.totalSize || 0;
  }

  _write(chunk, encoding, callback) {
    const now = Date.now();
    const elapsed = now - this.lastWrite;
    const chunkSize = chunk.length;

    const timeToSendChunk = chunkSize / this.rateBytesPerMs;

    const nextInterval = Math.max(this.interval, timeToSendChunk - elapsed);

    setTimeout(() => {
      this.lastWrite = Date.now();
      this.totalBytesSent += chunkSize;
      this.push(chunk);
      this.printProgress();
      callback();
    }, nextInterval);
  }

  printProgress() {
    if (this.totalSize > 0) {
      const progress = (this.totalBytesSent / this.totalSize) * 100;
      console.log(`SERVICE 1 -> Stream ${progress.toFixed(2)}%`);
    }
  }
}

module.exports = { ThrottleStream };
