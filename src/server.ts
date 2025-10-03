import express from 'express';

const app = express();
const PORT = process.env['PORT'] || 3000;

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ message: 'Hello World' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
