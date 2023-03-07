require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const Person = require('./models/person');

const app = express();

app.use(cors());
app.use(express.static('build'));
app.use(express.json());

morgan.token('body', (request) => JSON.stringify(request.body));
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :body')
);

app.get('/info', (request, response) => {
  Person.find({}).then((persons) => {
    const numberOfPersons = persons.length;
    const date = new Date();

    response.send(
      `<div>
        <p>Phonebook has info for ${numberOfPersons} people</p>
        <p>${date}</p>
      </div>`
    );
  });
});

app.get('/api/persons', (request, response, next) => {
  Person.find({})
    .then((persons) => response.json(persons))
    .catch((error) => next(error));
});

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id)
    .then((person) =>
      person ? response.json(person) : response.status(404).end()
    )
    .catch((error) => next(error));
});

app.post('/api/persons', (request, response, next) => {
  const { name, number } = request.body;

  const newPerson = new Person({
    name,
    number,
  });

  newPerson
    .save()
    .then((personSaved) => response.json(personSaved))
    .catch((error) => next(error));
});

app.put('/api/persons/:id', (request, response, next) => {
  const { name, number } = request.body;

  const person = {
    name,
    number,
  };

  Person.findByIdAndUpdate(request.params.id, person, {
    new: true,
    runValidators: true,
    context: 'query',
  })
    .then((updatedPerson) => response.json(updatedPerson))
    .catch((error) => next(error));
});

app.delete('/api/persons/:id', (request, response, next) => {
  Person.findByIdAndRemove(request.params.id)
    .then(() => response.status(204).end())
    .catch((error) => next(error));
});

const unknownEndpoints = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

app.use(unknownEndpoints);

const errorHandler = (error, request, response, next) => {
  console.log(error.message);
  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' });
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message });
  }
  next(error);
};

app.use(errorHandler);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

