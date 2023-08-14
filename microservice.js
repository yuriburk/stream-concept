const express = require('express');
const app = express();
const fs = require('fs');

const { ThrottleStream } = require('./throttle');

app.get('/generate', (req, res) => {
  const fileMb = 100;
  const streamSize = fileMb * 1024 * 1024;
  const chunkSize = 5024;

  res.attachment('file.txt');
  res.setHeader('Content-Type', 'application/octet-stream');

  let isStopped = false;

  const generateRandomStream = (res, size) => {
    let remaining = size;
    let chunkCount = 0;

    const writeNext = () => {
      if (isStopped) {
        console.log('SERVICE 2 -> Stopped by user');
        res.end();
        return;
      }

      if (remaining > 0) {
        const dataSize = Math.min(remaining, chunkSize);
        const chunk = Buffer.alloc(dataSize).fill(
          Math.random().toString(36).substr(2, 36)
        );

        if (res.write(chunk) === false) {
          console.log('SERVICE 2 -> Drain');
          res.once('drain', writeNext);
        } else {
          setTimeout(writeNext, 1);
        }
        remaining -= dataSize;
        chunkCount++;
        console.log(`SERVICE 2 -> Remaining ${remaining}`);
      } else {
        res.end();
      }
    };

    writeNext();
  };

  const stopDownloadHandler = () => {
    isStopped = true;
    console.log('SERVICE 2 -> Connection close');
    res.end();
  };

  req.on('close', stopDownloadHandler);

  console.log('SERVICE 2 -> Generating stream');
  generateRandomStream(res, streamSize);
});

app.get('/generate-csv', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.attachment('file.csv');

  const filePath = `./files/${req.query.name}`;
  const streamStats = fs.statSync(filePath);

  const downloadRateMBps = 10.2;
  const throttleStream = new ThrottleStream({
    rateMBps: downloadRateMBps,
    totalSize: streamStats.size,
  });

  const csvReadStream = fs.createReadStream(filePath);
  csvReadStream.pipe(throttleStream).pipe(res);

  csvReadStream.on('error', (error) => {
    console.error(`SERVICE 2 -> Error loading csv ${error.message}`);
    res.end();
  });

  req.on('close', () => {
    console.log('SERVICE 2 -> Connection close');
    csvReadStream.close();
    throttleStream.end();
  });
});

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.listen(4000, () => {
  console.log('Service 2 is running on port 4000');
});
