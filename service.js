const express = require('express');
const request = require('request');
const pidusage = require('pidusage');

const app = express();

const performance = () => {
  const processId = process.pid;

  setInterval(() => {
    pidusage(processId, (err, stats) => {
      if (err) {
        console.error('Error fetching process usage:', err);
        return;
      }
      console.log('CPU Usage:', stats.cpu, '%');
      console.log('Memory Usage:', stats.memory / (1024 * 1024), 'MB');
    });
  }, 1000);
}

performance();

const downloadStream = (downloadUrl, req, res) => {
  console.log('SERVICE 1 -> Piping stream');

  const pipeStream = request.get({ url: downloadUrl, qs: req.query });

  pipeStream.on('response', (response) => {
    console.log(
      'Response received from downstream service:',
      response.statusCode
    );
  });

  pipeStream.on('data', () => {
    // console.log('SERVICE 1 -> Receiving data');
  });

  const errorHandler = (err) => {
    console.error('SERVICE 1 -> Error:', err.message);
    res.destroy();
  };

  req.on('close', () => {
    console.log('SERVICE 1 -> Stream request close');
    pipeStream.abort();
  });

  pipeStream.on('error', errorHandler);
  res.on('error', errorHandler);

  pipeStream.pipe(res);
};

app.get('/download', (req, res) => {
  downloadStream('http://localhost:4000/generate', req, res);
});

app.get('/download-csv', (req, res) => {
  downloadStream('http://localhost:4000/generate-csv', req, res);
});

app.listen(3000, () => {
  console.log('Service 1 is running on port 3000');
});
