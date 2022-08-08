const express = require('express')
const { v4: uuidV4 } = require('uuid')

const app = express()

const customers = []

app.use(express.json())

function verifyIfExistsAccountCPF (request, response, next) {
  const {cpf} = request.headers

  const customer = customers.find(customer => customer.cpf === cpf)

  if(!customer) {
    return response.status(400).json({error: 'Customer not found!'})
  }

  request.customer = customer

  return next()
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit') {
      return acc + operation.amount
    } else {
      return acc - operation.amount
    }
  }, 0)

  return balance
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body

  const customerAlreadyExists = customers.some(customer => customer.cpf === cpf)

  if(customerAlreadyExists) {
    return response.status(400).json({error: 'Customer already exists!'})
  }

  const customer = {
    name, 
    cpf,
    id: uuidV4(),
    statement: []
  }

  customers.push(customer)

  return response.status(201).send()
})

app.get('/statement/', verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request

  return response.json(customer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body

  const { customer } = request

  const deposit = {
    description,
    amount,
    type: 'credit',
    createdAt: new Date()
  }

  customer.statement.push(deposit)

  return response.status(201).send()
})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const {amount} = request.body
  
  const {customer} = request

  const balance = getBalance(customer.statement)

  if (balance < amount) {
    return response.status(400).json({error: 'Insufficient funds!'})
  }

  const statementOperation = {
    amount,
    createdAt: new Date(),
    type: 'debit'
  }

  customer.statement.push(statementOperation)

  return response.status(201).send()
})

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request
  const {date} = request.query

  const dateFormat = new Date(date + ' 00:00')

  const statement = customer.statement.filter((statement) => statement.createdAt.toDateString() === new Date(dateFormat).toDateString())

  return response.json(customer.statement)
})

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { name } = request.body

  const { customer } = request

  customer.name = name

  return response.status(201).send()
})

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request

  return response.json(customer)
})

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request

  customers.splice(customer, 1)

  return response.status(200).json(customers)
})

app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
  const {customer} = request

  const balance = getBalance(customer.statement)

  return response.json(balance)
})

app.listen(3333, () => {
  console.log('backend started')
})