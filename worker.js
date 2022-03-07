onmessage = function (event) {
  const [width, height] = event.data;

  // Each pixel has [R, G, B, A] values.
  const data = new Uint8ClampedArray(width * height * 4);

  // For speed, it's enough to randomize the first pixel.
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.floor(Math.random() * 255);
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 255;
  }

  postMessage(data, [data.buffer]);
};
