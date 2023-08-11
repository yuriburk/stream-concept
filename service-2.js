const express = require('express');
const request = require('request');
const app = express();

const downloadStream = (downloadUrl, req, res) => {
  console.log('SERVICE 2 -> Piping stream');

  const pipeStream = request.get({ url: downloadUrl, qs: req.query });

  pipeStream.on('response', (response) => {
    console.log(
      'Response received from downstream service:',
      response.statusCode
    );
  });

  pipeStream.on('data', () => {
    console.log('SERVICE 2 -> Receiving data');
  });

  const errorHandler = (err) => {
    console.error('SERVICE 2 -> Error:', err.message);
    res.destroy();
  };

  req.on('close', () => {
    console.log('SERVICE 2 -> Stream request close');
    pipeStream.abort();
  });

  pipeStream.on('error', errorHandler);
  res.on('error', errorHandler);

  pipeStream.pipe(res);
};

app.get('/download', (req, res) => {
  downloadStream('http://localhost:3000/generate', req, res);
});

app.get('/download-csv', (req, res) => {
  downloadStream('http://localhost:3000/generate-csv', req, res);
});

app.listen(4000, () => {
  console.log('Service 2 is running on port 4000');
});
