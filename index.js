require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const app = express()
const Person = require('./models/person')

app.use(express.json())
app.use(cors())
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :POSTdata'))
app.use(express.static('build'))
morgan.token('POSTdata', function (req, res) { return ' ' })


app.get('/', (request, response) => {
  response.send('<h1>Hello World!</h1>')
})

app.get('/api/persons', (request, response) => {
  Person.find({}).then(persons => {
    response.json(persons)
  })
})

app.get('/api/persons/:id', (request, response, next) => {
  Person.findById(request.params.id).then(person => {
    if (person) {
      response.json(person)
    } else {
      response.status(404).end()
    }
  })
    .catch(error => next(error))
})

app.get('/info', (request, response) => {
  Person.countDocuments({}, function (err, count) {
    allPeople = count.toString()
  })
    .then(result => {
      response.send(`
      <div>
        <p>Phonebook has info for ${allPeople} people.<p/>
        <p>${new Date()}<p/>
      </div>
    `)
    })

})

app.delete('/api/persons/:id', (request, response) => {
  Person.findByIdAndRemove(request.params.id)
    .then(result => {
      response.status(204).end()
    })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response) => {
  const body = request.body

  if (!body.number) {
    return response.status(400).json({
      error: 'number is missing'
    })
  }
  if (!body.name) {
    return response.status(400).json({
      error: 'name is missing'
    })
  }

  Person.findByIdAndUpdate(request.params.id, body)
    .then(result => {
      response.status(200).end()
    })
    .catch(error => next(error))
})

app.post('/api/persons', (request, response) => {
  const body = request.body
  //const names = persons.map(person => person.name.toLowerCase())

  if (!body.number) {
    return response.status(400).json({
      error: 'number is missing'
    })
  }
  if (!body.name) {
    return response.status(400).json({
      error: 'name is missing'
    })
  }
  /*
  if (names.includes(body.name.toLowerCase())) {
    return response.status(400).json({
      error: 'name must be unique'
    })
  }
  */

  const person = new Person ({
    name: body.name,
    number: body.number,
  })

  person.save().then(savedPerson => {
    response.json(savedPerson)
  })
    .catch(error => next(error))

  morgan.token('POSTdata', function (req, res) { return JSON.stringify(req.body) })
})

const unknownEndpoint = (request, response) => {
  response.status(404).send({error: 'unknown endpoint'})
}
// 'unknownEndpoint' middleware should be loaded 2nd to last.
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({error: 'malformatted id'})
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({error: error.message})
  }

  next(error)
}
// 'errrorHandler' middleware must be loaded LAST!
app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})