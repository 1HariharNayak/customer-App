const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(bodyParser.json());

//customer data from JSON file
let customersData = [];
fs.readFile('customers.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading customers file:', err);
        return;
    }
    customersData = JSON.parse(data);
    console.log('Customers data loaded');
});

// API for list customers with search and pagination
app.get('/customers', (req, res) => {
    let { page, limit, first_name, last_name, city } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    let filteredCustomers = customersData;
    if (first_name) {
        filteredCustomers = filteredCustomers.filter(customer => customer.first_name.toLowerCase().includes(first_name.toLowerCase()));
    }
    if (last_name) {
        filteredCustomers = filteredCustomers.filter(customer => customer.last_name.toLowerCase().includes(last_name.toLowerCase()));
    }
    if (city) {
        filteredCustomers = filteredCustomers.filter(customer => customer.city.toLowerCase().includes(city.toLowerCase()));
    }

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

    res.json({
        total: filteredCustomers.length,
        page,
        limit,
        data: paginatedCustomers
    });
});

// API to get single customer by ID
app.get('/customers/:id', (req, res) => {
    const customerId = parseInt(req.params.id);
    const customer = customersData.find(customer => customer.id === customerId);
    if (!customer) {
        res.status(404).json({ message: 'Customer not found' });
    } else {
        res.json(customer);
    }
});

// API to list unique cities with the number of customers
app.get('/cities', (req, res) => {
    const cities = customersData.reduce((acc, customer) => {
        acc[customer.city] = (acc[customer.city] || 0) + 1;
        return acc;
    }, {});
    res.json(cities);
});

// API to add a customer with validations
app.post('/customers', (req, res) => {
    const { id, first_name, last_name, city, company } = req.body;
    if (!id || !first_name || !last_name || !city || !company) {
        res.status(400).json({ message: 'All fields are required' });
        return;
    }

    const existingCustomer = customersData.find(customer => customer.id === id);
    if (existingCustomer) {
        res.status(400).json({ message: 'Customer with this ID already exists' });
        return;
    }

    const existingCity = customersData.find(customer => customer.city === city);
    if (!existingCity) {
        res.status(400).json({ message: 'City does not exist for an existing customer' });
        return;
    }

    const existingCompany = customersData.find(customer => customer.company === company);
    if (!existingCompany) {
        res.status(400).json({ message: 'Company does not exist for an existing customer' });
        return;
    }

    customersData.push({ id, first_name, last_name, city, company });
    res.status(201).json({ message: 'Customer added successfully' });
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
