if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY

const express = require('express')
const app = express()
const fs = require('fs')
const stripe = require('stripe')(stripeSecretKey)

app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.static('public'))

app.get('/store', function(req, res) {
    fs.readFile('items.json', function(error, data) {
        if (error) {
            res.status(500).end()
        } else {
            res.render('store.ejs', {
                stripePublicKey: stripePublicKey,
                items: JSON.parse(data)
            })
        }
    })
})

app.post('/purchase', function(req, res) {
    fs.readFile('items.json', function(error, data) {
        if (error) {
            res.status(500).end()
        } else {
            const itemsJson = JSON.parse(data)
            const itemsArray = itemsJson.music.concat(itemsJson.merch)
            let itemsList = []
            req.body.items.forEach(element => {
                const itemJson = itemsArray.find(i => {
                    return i.id == element.id
                })
                itemsList.push({
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {
                            'name': itemJson.name,
                        },
                        'unit_amount': itemJson.price
                    },
                    'quantity': element.quantity
                })
            })
            stripe.checkout.sessions.create({
                'payment_method_types': ['card'],
                'line_items': itemsList,
                'mode': 'payment',
                'success_url': 'http://localhost:3000/',
                'cancel_url': 'http://localhost:3000/store',
            }).then(session => {
                res.json({'session_id': session.id})
            })
        }
    })
})

app.listen(3000)
